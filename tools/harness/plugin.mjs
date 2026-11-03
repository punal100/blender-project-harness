import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { Harness, contained, deny, git, modelRole, normalizeGoal, stable } from './engine.mjs';
import { describeDocumentFormats } from './documents.mjs';
import { MAX_BATCH, OPERATION_NAMES, PRIMITIVES, operationBatchCode } from './blender-operations.mjs';
import { projectPathInCommand, shellPolicy, unsafeBlenderShell } from './shell-policy.mjs';

const READ_ONLY = new Set(['read', 'glob', 'grep', 'list', 'webfetch', 'websearch', 'skill', 'todowrite', 'todoread', 'board_read', 'board_post', 'agent_manager_models', 'kilo_local_recall', 'schedule_wakeup', 'cron_create', 'cron_list', 'cron_delete', 'background_process']);
const ORCHESTRATOR_ONLY = new Set(['schedule_wakeup', 'cron_create', 'cron_list', 'cron_delete', 'background_process']);
const BLENDER_READ = new Set(['blender_get_addon_status', 'blender_get_scene_info', 'blender_look', 'blender_search_assets', 'blender_disable_telemetry', 'blender_record_trajectory_feedback']);
const GRADER_BLENDER_READ = new Set(['blender_look']);
const WORKER_BLENDER_READ = new Set(['blender_get_addon_status', 'blender_get_scene_info', 'blender_look']);
const PUBLIC_ACTIONS = new Set(['status', 'launch', 'stop', 'begin', 'extend', 'finalize', 'bootstrap-document', 'bootstrap-commit', 'intake', 'download', 'document', 'self-review', 'review', 'commit', 'approval', 'checkpoint', 'grader-ticket', 'grader-fail', 'recover', 'escalate', 'reregister', 'pause', 'reclaim', 'preserve']);
const SHELL_APPROVAL_TTL_MS = 10 * 60_000;
const SHELL_TOKEN = /\[HARNESS_SHELL:([a-f0-9-]{36})\]/i;
const successful = (output) => output && !output.isError && !output.metadata?.error && !/^Error\b/.test(output.output ?? '');
const BOOTSTRAP_DOCUMENTS = [
  'README.md',
  'Documents/README.md',
  'Documents/REQUIREMENTS.md',
  'Documents/WORKFLOW.md',
  'Documents/REVIEW.md',
  'Documents/ASSETS.md',
  'Documents/DECISIONS.md',
  'Documents/TASKSTRACKER.md',
  'Documents/Tasks/README.md',
  'Documents/Goals/README.md',
  'Documents/Goals/<NN>-<slug>.md',
  'Documents/References/README.md',
  'Documents/References/<name>.md',
  'Documents/Reviews/README.md',
  'assets/**/*.md',
  'renders/README.md',
  'exports/README.md',
  'scenes/README.md',
  'scripts/README.md',
  'backups/README.md',
];
const capabilities = () => ({
  operations: [...OPERATION_NAMES],
  primitives: [...PRIMITIVES],
  bootstrapDocuments: [...BOOTSTRAP_DOCUMENTS],
  documentFormats: describeDocumentFormats(),
  actions: [
    { name: 'status', actor: 'orchestrator', phase: 'any', payload: '{project?:string}' },
    { name: 'bootstrap-document', actor: 'orchestrator', phase: 'before registration', payload: '{project,path,content}' },
    { name: 'bootstrap-commit', actor: 'orchestrator', phase: 'before registration', payload: '{project,message}' },
    { name: 'intake', actor: 'orchestrator', phase: 'scan or open change', payload: '{project,files?,folders?,kind?,source?,generated?,scan?}' },
    { name: 'download', actor: 'orchestrator', phase: 'before or during production', payload: '{project?,url,filename?,maxBytes?}' },
    { name: 'prepare', actor: 'orchestrator', phase: 'before registration', payload: '{project,goal,scene}' },
    { name: 'reregister', actor: 'orchestrator', phase: 'paused project', payload: '{reason}' },
    { name: 'launch|stop', actor: 'orchestrator', phase: 'active goal', payload: '{}' },
    { name: 'begin', actor: 'orchestrator', phase: 'active goal', payload: '{outcome,objects,paths,milestone?,requirements?,revision?}' },
    { name: 'extend', actor: 'orchestrator', phase: 'open change', payload: '{objects?,paths}' },
    { name: 'finalize', actor: 'orchestrator', phase: 'open change', payload: '{}' },
    { name: 'ticket', actor: 'orchestrator', phase: 'open change', payload: '{operation:apply|save|seal|wip,payload}' },
    { name: 'document', actor: 'orchestrator', phase: 'open change', payload: '{path,content}' },
    { name: 'self-review|review|grader-ticket|grader-fail', actor: 'orchestrator', phase: 'sealed change', payload: 'see docs' },
    { name: 'commit|checkpoint|approval', actor: 'orchestrator', phase: 'reviewed change', payload: 'see docs' },
    { name: 'recover|escalate|pause|reclaim|preserve', actor: 'orchestrator', phase: 'recovery', payload: '{reopen?}, escalation fields, {reason}, {project,reason}, or {reason} for a sealed tooling block' },
  ],
  limits: { appliesBeforeCheckpoint: 20, hardApplyCap: 20, maxChangeObjects: 20, ticketTtlMinutes: 10, minutesWithoutApply: 15, wipEveryApplies: 3, maxRounds: 'configured 1-4', batchOperations: MAX_BATCH },
  commitPolicy: 'Project documents are created with bootstrap-document/document. Every successful apply batch commits atomically; the review produces the final commit. A non-scene change containing only documentation, source-only scripts, references, or assets commits and checkpoints without apply, seal, or review. A failed or expired change may use commit {mode:"wip"} then checkpoint; a sealed tooling block uses preserve {reason} then checkpoint. Manual project git add or git commit is blocked.',
  shellPolicy: 'Read-only and trusted harness commands run directly. Any other non-project shell command requires a warning acknowledgement: repeat the exact command with description "Reason: ... [HARNESS_SHELL:<id>]". The command and reason are committed atomically under <project>/Documents/Commands/ or root Commands/; command output is never captured or committed. Blender launches, project mutations, and command substitution stay blocked.',
  documentPolicy: 'Use blender_document action read for structured title/field/section access and action write for declared writes. Registration documents (REQUIREMENTS, WORKFLOW, REVIEW, and the active goal) are frozen after prepare; close the change and call reregister {reason}, bootstrap-document, bootstrap-commit, then prepare to replace them. Direct read/edit is permitted but discouraged; review reports are written only through the document tool.',
  documentTool: { actions: ['read', 'write', 'ledger'], read: '{project?,path,section?}', write: '{project?,path,content}', ledger: '{project?}' },
});

function jsonPayload(value, label = 'payload') {
  if (value === undefined || value === null || value === '') return {};
  if (typeof value === 'string') {
    if (!value.trim()) return {};
    if (value === '[object Object]') deny(`${label} arrived as [object Object]; pass a JSON object or a JSON string`);
    try { value = JSON.parse(value); } catch (error) { deny(`${label} is not valid JSON: ${error.message}`); }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) deny(`${label} must be a JSON object or a JSON string containing an object`);
  return value;
}

function kiloGoal(info) {
  const metadata = info?.metadata ?? {};
  let raw = metadata['kilo.goal'] ?? metadata?.kilo?.goal ?? metadata?.goal;
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch { return null; }
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const status = typeof raw.status === 'string' ? raw.status.toLowerCase() : typeof raw.state === 'string' ? raw.state.toLowerCase() : null;
  if (!status) return null;
  const reason = raw.reason ?? raw.report?.reason ?? raw.lastReport?.reason ?? raw.last_report?.reason;
  return {
    status,
    active: status === 'active',
    reason: typeof reason === 'string' && reason.trim() ? reason.trim().slice(0, 1000) : null,
    objective: typeof raw.objective === 'string' ? raw.objective.slice(0, 1000) : null,
  };
}

function withKiloGoal(result, info) {
  if (!result || typeof result !== 'object' || Array.isArray(result)) return result;
  const goal = kiloGoal(info);
  if (!goal) return result;
  result.kiloGoal = goal;
  if (['blocked', 'paused'].includes(goal.status)
    && (result.goalActive || ['goal', 'goal_report'].includes(result.nextStep?.action))) {
    result.nextStep = {
      phase: 'resume-goal',
      actor: 'orchestrator',
      action: 'goal',
      command: 'goal {action:"resume"}',
      reason: `Kilo marks the goal ${goal.status}; resume it before the next workflow step or goal_report.`,
    };
    result.next = result.nextStep.reason;
  }
  return result;
}

function reconcileGoal(harness, session, info) {
  const goal = kiloGoal(info);
  if (!goal) return goal;
  harness.transaction((s) => {
    const p = Object.values(s.projects).find((item) => item.orchestrator === session);
    if (!p || p.complete) return;
    if (goal.status === 'active' && !p.goalActive) {
      p.goalActive = true;
      p.paused = null;
      p.goalSync = { source: 'kilo', status: goal.status, at: new Date().toISOString() };
    } else if (['paused', 'blocked', 'complete'].includes(goal.status) && p.goalActive) {
      p.goalActive = false;
      p.goalSync = { source: 'kilo', status: goal.status, at: new Date().toISOString() };
    }
  });
  return goal;
}

function shellReason(description) {
  if (typeof description !== 'string') return '';
  return description.replace(SHELL_TOKEN, ' ').replace(/^\s*(?:reason|why)\s*:\s*/i, '').replace(/\s+/g, ' ').trim().slice(0, 1000);
}

function shellPendingDir(harness) {
  return path.join(harness.home, 'shell-approvals');
}

function shellApprovalTarget(project, id) {
  return project ? `${project}/Documents/Commands/${id}.md` : `Commands/${id}.md`;
}

function pendingShellRecords(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => name.endsWith('.json')).map((name) => {
    try { return JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')); } catch { return null; }
  }).filter(Boolean);
}

function writePendingShell(dir, record) {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  fs.writeFileSync(path.join(dir, `${record.id}.json`), JSON.stringify(record, null, 2) + '\n', { mode: 0o600 });
}

function shellApprovalError(message) {
  throw new Error(message);
}

function guardShell(harness, session, project, command, args = {}) {
  const policy = shellPolicy(command);
  if (policy.kind === 'deny') deny(policy.reason);
  if (policy.kind === 'read-only' || policy.kind === 'trusted') return;
  if (projectPathInCommand(command)) deny('project files are harness-owned; use blender_workflow bootstrap-commit or commit, never shell mutation');
  if (harness.developmentMode(session)) return;
  const dir = shellPendingDir(harness);
  const description = args.description ?? '';
  const reasoning = shellReason(description);
  const token = String(description).match(SHELL_TOKEN)?.[1];
  if (!token) {
    const existing = pendingShellRecords(dir).find((record) => record.status === 'pending' && record.session === session
      && record.project === project && record.command === command && Date.now() - Date.parse(record.created) < SHELL_APPROVAL_TTL_MS);
    const record = existing ?? {
      id: crypto.randomUUID(),
      status: 'pending',
      session,
      project,
      command,
      reasoning,
      cwd: args.workdir ?? harness.root,
      created: new Date().toISOString(),
      approvedAt: null,
    };
    if (reasoning) record.reasoning = reasoning;
    writePendingShell(dir, record);
    const target = shellApprovalTarget(project, record.id);
    shellApprovalError([
      `Shell approval required: "${command}" is not a read-only or trusted harness command. Nothing ran.`,
      'This is a warning gate, not a workflow block.',
      `Re-run the exact command with description "Reason: <one sentence why this is safe and necessary> [HARNESS_SHELL:${record.id}]".`,
      `The command and reasoning are committed atomically to ${target} when approved; command output is never captured or committed.`,
    ].join(' '));
  }
  const file = path.join(dir, `${token}.json`);
  if (!fs.existsSync(file)) deny('unknown shell approval id; start the warning flow again');
  const record = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (record.status !== 'pending') deny('shell approval id was already used');
  if (record.session !== session || record.project !== project || record.command !== command) deny('shell approval id is bound to a different session, project, or command');
  if (Date.now() - Date.parse(record.created) > SHELL_APPROVAL_TTL_MS) deny('shell approval id expired; start the warning flow again');
  if (reasoning.length < 8) shellApprovalError(`Shell approval requires a reason of at least 8 characters. Re-run the exact command with description "Reason: <why this is safe and necessary> [HARNESS_SHELL:${record.id}]".`);
  record.status = 'approved';
  record.reasoning = reasoning;
  record.approvedAt = new Date().toISOString();
  harness.commitShellApproval(session, record.project, record);
  fs.rmSync(file, { force: true });
}

export function createHooks(harness, client) {
  const questions = new Map();
  const taskArgs = new Map();
  async function identity(id) {
    // PluginInput.client is SDK v1, whose request shape differs from SDK v2.
    const result = await client.session.get({ path: { id }, query: { directory: harness.root }, throwOnError: true });
    if (!result.data?.id || result.data.id !== id) deny('session identity unavailable');
    return result.data;
  }
  async function childAssignment(session) {
    const info = await identity(session);
    if (!info.parentID) return null;
    const messages = await client.session.messages({ path: { id: session }, query: { limit: 100 }, throwOnError: true });
    if (!Array.isArray(messages.data)) deny('child session messages unavailable');
    const first = messages.data.find((m) => m.info?.role === 'user' && m.parts?.some((p) => p.type === 'text' && p.text?.trim()));
    const user = first?.info;
    const prompt = first?.parts?.filter((p) => p.type === 'text' && !p.synthetic && !p.ignored).map((p) => p.text).join('\n');
    const assistant = messages.data.findLast((m) => m.info?.role === 'assistant' && !m.info.summary)?.info;
    if (user?.agent === 'blender-worker') {
      if (!assistant) deny('worker runtime model metadata unavailable');
      const cfg = harness.workerConfig();
      if (!modelRole(cfg, assistant)) deny('worker runtime model does not match configured worker or backup');
      return { worker: true, info };
    }
    if (user?.agent !== 'blender-grader' || !prompt?.includes('HARNESS_GRADER:')) deny('only assigned worker or grader children allowed during production');
    const existing = harness.transaction((s) => harness.graderAssignment(s, session));
    if (!assistant) deny('grader runtime model metadata unavailable');
    if (!existing) harness.bindGrader(info.parentID, session, prompt, { providerID: assistant.providerID, modelID: assistant.modelID, variant: assistant.variant });
    return info;
  }
  function stateFor(session) {
    return harness.transaction((s) => Object.values(s.projects).find((p) => p.orchestrator === session) ?? null);
  }
  async function statusFor(session) {
    const info = await identity(session);
    reconcileGoal(harness, session, info);
    return withKiloGoal(harness.command(session, 'status'), info);
  }
  function editPaths(tool, args) {
    if (tool === 'apply_patch') {
      const text = args.patchText ?? args.patch ?? '';
      const paths = [...text.matchAll(/^\*\*\* (?:Add File|Update File|Delete File|Move to): (.+)$/gm)].map((m) => m[1]);
      if (!paths.length) deny('cannot classify patch paths');
      return paths;
    }
    const file = args.filePath ?? args.file_path ?? args.path;
    if (typeof file !== 'string') deny('cannot classify file write');
    return [file];
  }
  function relative(file) {
    const full = path.resolve(harness.root, file);
    if (!full.startsWith(harness.root + path.sep)) deny('production access outside workspace');
    const name = path.relative(harness.root, full).replaceAll('\\', '/');
    contained(harness.root, name, true);
    return name;
  }
  return {
    tool: {
      blender_workflow: {
        description: 'Mandatory Blender workflow gate. capabilities, status, bootstrap-document, bootstrap-commit, intake, download, prepare, reregister, launch, stop, begin, extend, finalize, document, ticket, grader-ticket, grader-fail, self-review, review, commit, approval, checkpoint, recover, escalate, preserve. payload is a JSON object or JSON string. Follow status.nextStep for the exact next call. Project documents and commits are harness-owned; never invoke Blender or legacy scripts from the shell.',
        args: { action: z.string(), payload: z.union([z.string(), z.record(z.unknown())]).default('{}') },
        async execute(args, context) {
          const session = await identity(context.sessionID);
          if (session.parentID) deny('workflow control belongs to root orchestrator');
          reconcileGoal(harness, context.sessionID, session);
          const payload = jsonPayload(args.payload);
          let result;
          if (args.action === 'capabilities') result = capabilities();
          else if (args.action === 'bootstrap-document') result = harness.bootstrapDocument(context.sessionID, payload);
          else if (args.action === 'bootstrap-commit') result = harness.bootstrapCommit(context.sessionID, payload);
          else if (args.action === 'intake') result = harness.intake(context.sessionID, payload);
          else if (args.action === 'download') result = await harness.download(context.sessionID, payload);
          else if (args.action === 'prepare') result = harness.prepare(context.sessionID, payload);
          else if (args.action === 'ticket') {
            const p = stateFor(context.sessionID);
            if (!p) deny('no registered project for this session; call blender_workflow prepare and complete its registration question first');
            if (payload.operation === 'apply') operationBatchCode(payload.payload, p.change?.objects ?? []);
            else if (stable(payload.payload) !== '{}') deny('save/seal/wip payload must be empty object');
            result = harness.issue(context.sessionID, payload.operation, payload.payload);
          } else {
            if (!PUBLIC_ACTIONS.has(args.action)) deny('internal workflow action unavailable');
            result = args.action === 'recover' ? harness.recover(context.sessionID, payload)
              : args.action === 'launch' ? await harness.launch(context.sessionID)
                : args.action === 'stop' ? await harness.stop(context.sessionID)
                  : harness.command(context.sessionID, args.action, payload);
          }
          return JSON.stringify(withKiloGoal(result, session), null, 2);
        },
      },
      blender_document: {
        description: 'Structured project-document access. action read returns title, metadata fields, section index and format diagnostics; pass section to read one section. action write creates or updates a declared document or the assigned grader report and rejects invalid format/structure. action ledger returns the harness-owned task rows and summary. payload is a JSON object or JSON string. Use this instead of raw full-file reads and direct edits.',
        args: { action: z.string(), payload: z.union([z.string(), z.record(z.unknown())]).default('{}') },
        async execute(args, context) {
          const payload = jsonPayload(args.payload);
          if (args.action === 'read') return JSON.stringify(harness.documentRead(context.sessionID, payload, (await identity(context.sessionID)).parentID ?? null), null, 2);
          if (args.action === 'write') return JSON.stringify(harness.documentWrite(context.sessionID, payload), null, 2);
          if (args.action === 'ledger') return JSON.stringify(harness.documentLedger(context.sessionID, payload), null, 2);
          deny('document action must be read, write, or ledger');
        },
      },
    },
    async 'tool.execute.before'(input, output) {
      if (harness.developmentMode(input.sessionID)) return;
      const tool = input.tool.replace(/^functions\./, '');
      const args = output.args ?? {};
      if (/execute_blender_code|import_asset|generate_3d/.test(tool)) deny('raw Blender mutation disabled; use ticketed harness_execute');
      if (tool === 'blender_harness_execute') {
        const session = await identity(input.sessionID);
        if (session.parentID) {
          const child = await childAssignment(input.sessionID);
          if (!child?.worker || args.operation !== 'apply') deny('worker may execute assigned apply operations only');
          harness.authorize(session.parentID, args.token, args.operation, args.payload);
          harness.bindWorkerByToken(session.parentID, input.sessionID, args.token);
          return;
        }
        if (args.operation === 'apply') deny('orchestrator delegates apply operations to blender-worker; save and seal stay orchestrator-owned');
        harness.authorize(input.sessionID, args.token, args.operation, args.payload);
        return;
      }
      if (tool === 'blender_document') {
        const session = await identity(input.sessionID);
        if (session.parentID) {
          const child = await childAssignment(input.sessionID);
          if (!child) deny('document access requires an assigned child');
          if (child.worker) {
            if (args.action === 'write') deny('workers cannot write documents');
            return;
          }
          harness.graderStep(input.sessionID, 'blender_document', args);
          return;
        }
        return;
      }
      const session = await identity(input.sessionID);
      if (!session.parentID) reconcileGoal(harness, input.sessionID, session);
      const p = stateFor(input.sessionID);
      if (session.parentID && harness.transaction((s) => Object.values(s.projects).some((p) => p.orchestrator === session.parentID))) {
        const child = await childAssignment(input.sessionID);
        if (child?.worker) {
          if (ORCHESTRATOR_ONLY.has(tool) || ['write', 'edit', 'apply_patch', 'bash', 'task', 'agent_manager', 'question', 'goal', 'goal_report'].includes(tool)
            || (tool.startsWith('blender_') && !WORKER_BLENDER_READ.has(tool))
            || (!READ_ONLY.has(tool) && !WORKER_BLENDER_READ.has(tool) && !tool.startsWith('context7_'))) deny('worker child is read-only and cannot use this tool');
          return;
        }
        if (ORCHESTRATOR_ONLY.has(tool)) deny('graders cannot use scheduler or process tools');
        const assignment = harness.graderStep(input.sessionID, tool, args);
        if (['write', 'edit', 'apply_patch'].includes(tool)) {
          deny('grader document writes use blender_document only; direct edit is denied');
        } else if (['read', 'glob', 'grep'].includes(tool)) {
          const candidate = args.filePath ?? args.path;
          if (candidate) {
            const name = relative(candidate);
            if (tool !== 'read') deny('grader searches unavailable; read exact assigned spec/evidence files');
            const allowed = harness.transaction((s) => {
              const { p } = harness.graderAssignment(s, input.sessionID);
              return new Set([...Object.keys(p.records.specs), ...Object.keys(p.change.evidence), assignment.report,
                `${p.project}/Documents/Reviews/${p.change.round}/manifest.json`, 'AGENTS.md',
                '.kilo/agent/blender-grader.md', '.kilo/skills/blender-project-grading/SKILL.md']);
            });
            if (!allowed.has(name)) deny('grader read outside frozen assignment or peer report access');
          } else deny('grader read requires exact path');
        } else if (GRADER_BLENDER_READ.has(tool)) {
          const assignmentState = harness.transaction((s) => harness.graderAssignment(s, input.sessionID));
          if (!assignmentState?.p?.change?.evidence) deny('grader evidence is unavailable');
          if (tool === 'blender_look') {
            const image = args.image;
            if (typeof image !== 'string') deny('grader look requires exact frozen evidence image');
            const full = path.resolve(harness.root, image);
            const relative = full.startsWith(harness.root + path.sep) ? path.relative(harness.root, full).replaceAll('\\', '/') : null;
            if (!relative || !Object.hasOwn(assignmentState.p.change.evidence, relative)) deny('grader look limited to frozen evidence image');
          }
        } else if (!READ_ONLY.has(tool) && !tool.startsWith('context7_')) deny('grader tool outside read-only scope');
        return;
      }
      if (tool === 'question') questions.set(input.callID, structuredClone(args));
      if (!p) {
        if (ORCHESTRATOR_ONLY.has(tool)) deny('scheduler and process tools require a registered active goal');
        if (tool.startsWith('blender_') && !BLENDER_READ.has(tool) && tool !== 'blender_workflow') deny('production tool requires a registered project; run blender_workflow prepare and complete its registration question first');
        if (['write', 'edit', 'apply_patch'].includes(tool)) {
          const files = editPaths(tool, args).map(relative);
          if (files.some((f) => path.resolve(harness.root, f).startsWith(harness.home))) deny('harness state is runtime-owned; never write it directly');
          const blocked = files.filter((f) => /^Blender\/[^/]+\//.test(f));
          if (blocked.length) deny(`project files are harness-owned: ${blocked.join(', ')}. Before registration use blender_workflow bootstrap-document for markdown and bootstrap-commit for the exact scaffold; scaffold the folder with node tools/harness/cli.mjs scaffold. Do not write project files directly.`);
        }
        if (tool === 'bash') {
          const command = args.command ?? '';
          if (unsafeBlenderShell(command)) deny('launch and stop Blender through blender_workflow launch/stop; shell Blender commands and legacy scripts are retired');
          if (/^git add\b/.test(command)) {
            const broad = /(?:^|\s)(?:-A|--all|-u|--update|-p|--patch|-i|--interactive|\.|:\/|\*)(?:\s|$)/.test(command);
            if (projectPathInCommand(command) || (broad && fs.existsSync(path.join(harness.root, 'Blender')))) deny('project commits use blender_workflow bootstrap-commit before registration and blender_workflow commit after registration');
          }
          if (/^git commit\b/.test(command)) {
            if (/(?:^|\s)(?:-a\w*|--all|--include|-i)\b/.test(command) || projectPathInCommand(command)) deny('project commits use blender_workflow bootstrap-commit before registration and blender_workflow commit after registration');
            const staged = git(harness.root, ['diff', '--cached', '--name-only']).split(/\r?\n/).filter(Boolean);
            if (staged.some((name) => name.startsWith('Blender/'))) deny('project commits use blender_workflow bootstrap-commit before registration and blender_workflow commit after registration');
          }
          guardShell(harness, input.sessionID, null, command, args);
        }
        return;
      }
      if (tool === 'agent_manager') return;
      if (tool === 'background_process') {
        const command = args.command ?? '';
        if (typeof command !== 'string' || !command.trim()) deny('background process requires one command');
        if (unsafeBlenderShell(command)) deny('launch and stop Blender through blender_workflow launch/stop');
        if (args.workdir && path.resolve(args.workdir) !== harness.root) deny('background process workdir must be the workspace root');
        if (/^git (?:add|commit)\b/i.test(command)) deny('production commits use blender_workflow commit');
        guardShell(harness, input.sessionID, p.project, command, args);
        return;
      }
      if (tool === 'blender_workflow' || tool === 'question' || READ_ONLY.has(tool) || BLENDER_READ.has(tool) || tool.startsWith('context7_')) return;
      if (tool === 'goal') {
        if (args.action === 'start' && normalizeGoal(args.objective) !== normalizeGoal(p.records.goalText)) deny('goal objective must equal registered prompt');
        harness.fresh(p, { allowRosterDrift: true }); return;
      }
      if (tool === 'goal_report') {
        const goal = kiloGoal(session);
        if (goal && ['blocked', 'paused'].includes(goal.status)) deny(`Kilo marks the goal ${goal.status}; run goal {action:"resume"} before goal_report`);
        if (args.status === 'complete') {
          const missing = [];
          if (p.change) missing.push('open change');
          if (!['PASS', 'DOCUMENT'].includes(p.history.at(-1)?.verdict)) missing.push('applicable PASS/DOCUMENT checkpoint');
          if (!p.lastRender) missing.push('inspected sealed render');
          else if (harness.hash(p.lastRender.path) !== p.lastRender.hash) missing.push('unchanged inspected render');
          if (!p.history.some((item) => item.final && item.verdict === 'PASS')) missing.push('final full-spec PASS');
          if (missing.length) deny(`completion blocked by ${missing.join(', ')}; fix the checkpoint, then run goal {action:"resume"} before goal_report`);
          harness.assertCommitted(p.project, harness.snapshot(p.project));
        }
        return;
      }
      if (tool === 'task') {
        if (args.background) deny('production delegation must be foreground');
        if (args.subagent_type === 'blender-worker') {
          if (!p.goalActive || !args.prompt?.trim()) deny('worker delegation requires an active goal and a task prompt');
          if (/HARNESS_GRADER:/.test(args.prompt)) deny('worker task cannot carry a grader marker');
          harness.workerConfig();
          return;
        }
        if (args.subagent_type !== 'blender-grader' || !/HARNESS_GRADER:[a-f0-9-]{36}/.test(args.prompt ?? '')) deny('production delegation requires foreground assigned grader');
        const token = args.prompt.match(/HARNESS_GRADER:([a-f0-9-]{36})/)[1];
        if (!p.change?.inspected || !Object.values(p.change.graders).some((g) => g.token === token)) deny('grader ticket missing');
        taskArgs.set(input.callID, args); return;
      }
      if (['write', 'edit', 'apply_patch'].includes(tool)) {
        const c = p.change;
        const names = editPaths(tool, args).map(relative);
        if (names.every((f) => f.startsWith('.temp/'))) {
          harness.fresh(p, { allowRosterDrift: true });
          return;
        }
        if (!c) deny('no open bounded change; call blender_workflow begin with one outcome, exact object names, and exact project-relative paths before writing project files');
        const allowed = new Set(c.paths);
        if (names.some((f) => Object.hasOwn(p.records.specs, f) || f === `${p.project}/Documents/REVIEW.md`)) deny('registration documents are frozen after registration; restore the committed version and stop for explicit re-registration');
        if (names.some((f) => f === `${p.project}/Documents/TASKSTRACKER.md` || f.startsWith(`${p.project}/Documents/Tasks/`))) deny('the task tracker is harness-owned; ticket issue and completion update it');
        if (names.some((f) => f.startsWith(`${p.project}/Documents/Reviews/`))) deny('review artifacts are harness-owned; use review, self-review, or grader tools');
        if (names.some((f) => !allowed.has(f) || /\.blend$|\/manifest\.json$|\/_evidence\/|\/REPORT\.md$|\.(png|jpg|exr)$/i.test(f))) deny('write outside the declared change scope or targets runtime-owned evidence/report paths; add the exact path to blender_workflow begin paths, or stop writing it');
        if (names.some((f) => f.startsWith(`${p.project}/`) && /\.md$/i.test(f) && !fs.existsSync(path.resolve(harness.root, f)))) deny('new documents require blender_document write or blender_workflow document after declaring the exact path');
        harness.fresh(p);
        return;
      }
      if (tool === 'bash') {
        const command = args.command ?? '';
        if (unsafeBlenderShell(command)) deny('launch and stop Blender through blender_workflow launch/stop; shell Blender commands and legacy scripts are retired');
        if (args.workdir && path.resolve(args.workdir) !== harness.root) deny('production Git/launch commands require workspace root');
        if (/^git add\b/i.test(command)) {
          const broad = /(?:^|\s)(?:-A|--all|-u|--update|-p|--patch|-i|--interactive|\.|:\/|\*)(?:\s|$)/.test(command);
          if (projectPathInCommand(command) || broad) deny('project commits use blender_workflow bootstrap-commit before registration and blender_workflow commit after registration');
        }
        if (/^git commit\b/i.test(command)) {
          if (/(?:^|\s)(?:-a\w*|--all|--include|-i)\b/.test(command)) deny('project commits use blender_workflow commit');
          const staged = git(harness.root, ['diff', '--cached', '--name-only']).split(/\r?\n/).filter(Boolean);
          if (staged.some((name) => name.startsWith('Blender' + '/'))) deny('project commits use blender_workflow commit');
        }
        const workspaceCommand = /^git (?:add|commit)\b/i.test(command);
        guardShell(harness, input.sessionID, workspaceCommand ? null : p.project, command, args);
        return;
      }
      deny(`unclassified production tool: ${tool}`);
    },
    async 'tool.execute.after'(input, output) {
      if (harness.developmentMode(input.sessionID)) return;
      const tool = input.tool.replace(/^functions\./, '');
      if (tool === 'question') {
        const args = questions.get(input.callID); questions.delete(input.callID);
        if (args && !output.metadata?.dismissed && output.metadata?.answers) harness.question(input.sessionID, args, output.metadata.answers);
      }
      const p = stateFor(input.sessionID);
      if (!p) return;
      if (tool === 'goal' && successful(output)) {
        if (['start', 'resume'].includes(input.args.action)) harness.command(input.sessionID, 'goal-active', { objective: input.args.action === 'start' ? input.args.objective : undefined });
        else if (['pause', 'clear'].includes(input.args.action)) harness.command(input.sessionID, 'goal-inactive');
      }
      if (tool === 'goal_report' && input.args.status === 'complete' && successful(output)) harness.command(input.sessionID, 'goal-complete');
      if (tool === 'blender_look' && input.args.image) {
        const imageResult = output.content?.some((c) => c.type === 'image') || output.attachments?.some((a) => a.mime?.startsWith('image/'));
        harness.inspect(input.sessionID, path.resolve(harness.root, input.args.image), Boolean(successful(output) && imageResult));
      }
      if (tool === 'task' && taskArgs.has(input.callID)) {
        const args = taskArgs.get(input.callID); taskArgs.delete(input.callID);
        const child = output.metadata?.sessionId ?? output.metadata?.sessionID ?? output.output?.match(/task(?:_id| id)[=:"\s]+(ses_[A-Za-z0-9]+)/)?.[1];
        const token = args?.prompt?.match(/HARNESS_GRADER:([a-f0-9-]{36})/)?.[1];
        if (!child || !successful(output)) {
          if (token) harness.failGraderByToken(input.sessionID, token, output.output ?? 'grader task failed before child session');
          else deny('grader task result lacks child session ID');
        } else {
          harness.collectGrader(input.sessionID, child);
        }
      } else if (tool === 'task' && input.args?.subagent_type === 'blender-worker') {
        const child = output.metadata?.sessionId ?? output.metadata?.sessionID ?? output.output?.match(/task(?:_id| id)[=:"\s]+(ses_[A-Za-z0-9]+)/)?.[1];
        if (successful(output) && child) {
          harness.bindWorker(input.sessionID, child, input.args?.prompt ?? '');
        } else {
          const token = input.args?.prompt?.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i)?.[0];
          if (token) harness.failWorkerByToken(input.sessionID, token, output.output ?? 'worker task failed before completion');
        }
      }
      if (successful(output) && typeof output.output === 'string') output.output += `\n\nWorkflow: ${JSON.stringify(await statusFor(input.sessionID))}`;
    },
    async 'experimental.chat.system.transform'(input, output) {
      if (harness.developmentMode(input.sessionID)) return;
      if (!input.sessionID) return;
      const p = stateFor(input.sessionID);
      if (p) output.system.push(`Runtime workflow state: ${JSON.stringify(await statusFor(input.sessionID))}. Use blender_workflow; never bypass missing gates.`);
    },
    async 'experimental.session.compacting'(input, output) {
      if (harness.developmentMode(input.sessionID)) return;
      const p = stateFor(input.sessionID);
      if (p) output.context.push(`Durable Blender workflow: ${JSON.stringify(await statusFor(input.sessionID))}. Continue current phase; do not repeat goal start or begin.`);
    },
  };
}

export async function server(context) { return createHooks(new Harness(context.worktree), context.client); }
