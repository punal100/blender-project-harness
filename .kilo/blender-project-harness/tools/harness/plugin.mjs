import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { Harness, contained, deny, git, MEDIA_GENERATION_TOOLS, modelDiagnostics, modelRole, stable, WAIT_LIMIT, activeWaits, expiredWakeups } from './engine.mjs';
import { describeDocumentFormats } from './documents.mjs';
import { MAX_BATCH, OPERATION_NAMES, PRIMITIVES, operationBatchCode } from './blender-operations.mjs';
import { projectPathInCommand, shellPolicy, unsafeBlenderShell } from './shell-policy.mjs';

const READ_ONLY = new Set(['read', 'glob', 'grep', 'list', 'webfetch', 'websearch', 'skill', 'todowrite', 'todoread', 'board_read', 'board_post', 'agent_manager_models', 'kilo_local_recall', 'schedule_wakeup', 'cancel_wakeup', 'cron_create', 'cron_list', 'cron_delete', 'background_process']);
const ORCHESTRATOR_ONLY = new Set(['schedule_wakeup', 'cancel_wakeup', 'cron_create', 'cron_list', 'cron_delete', 'background_process']);
const BLENDER_READ = new Set(['blender_get_addon_status', 'blender_get_scene_info', 'blender_harness_scene_info', 'blender_look', 'blender_search_assets', 'blender_disable_telemetry', 'blender_record_trajectory_feedback']);
const GRADER_BLENDER_READ = new Set(['blender_look']);
const WORKER_BLENDER_READ = new Set(['blender_get_addon_status', 'blender_get_scene_info', 'blender_harness_scene_info', 'blender_look']);
const PUBLIC_ACTIONS = new Set(['status', 'reference', 'launch', 'stop', 'begin', 'extend', 'finalize', 'bootstrap-document', 'bootstrap-commit', 'intake', 'download', 'media-request', 'media-complete', 'media-fail', 'document', 'self-review', 'review', 'commit', 'approval', 'checkpoint', 'grader-ticket', 'grader-fail', 'recover', 'abandon', 'escalate', 'reregister', 'pause', 'reclaim', 'forget', 'preserve']);
const MEDIA_READ = new Set(['mediamcp_check_config', 'mediamcp_list_models', 'mediamcp_check_video_status']);
const SHELL_APPROVAL_TTL_MS = 10 * 60_000;
const SHELL_TOKEN = /\[HARNESS_SHELL:([a-f0-9-]{36})\]/i;
const MAX_AUTO_TURNS = 25;
const successful = (output) => output && !output.isError && !output.metadata?.error && !/^Error\b/.test(output.output ?? '');
const BOOTSTRAP_DOCUMENTS = [
  'README.md',
  'Documents/README.md',
  'Documents/REQUIREMENTS.md',
  'Documents/WORKFLOW.md',
  'Documents/REVIEW.md',
  'Documents/ASSETS.md',
  'Documents/DECISIONS.md',
  'Documents/INTAKE.md',
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
  intakeSource: {
    accepts: 'string note or object',
    fields: ['name', 'asset', 'url', 'vendor', 'author', 'license', 'licenseText', 'licenseFile', 'attribution', 'redistributable', 'external', 'packaging', 'notes', 'licenseUrl'],
    aliases: { note: 'notes', type: 'notes' },
    examples: {
      localReference: { source: 'user-supplied mood reference' },
      externalAsset: { source: { name: 'Chair', vendor: 'Example', license: 'CC0-1.0', licenseText: 'CC0 text' } },
    },
    externalRule: 'kind model or a source url/license requires source.license and source.licenseText or source.licenseFile',
  },
  actions: [
    { name: 'status', actor: 'orchestrator', phase: 'any', payload: '{project?:string}' },
    { name: 'reference', actor: 'orchestrator', phase: 'before registration', payload: '{}' },
    { name: 'bootstrap-document', actor: 'orchestrator', phase: 'before registration', payload: '{project,path,content}' },
    { name: 'bootstrap-commit', actor: 'orchestrator', phase: 'before registration', payload: '{project,message}' },
    { name: 'intake', actor: 'orchestrator', phase: 'scan or open change', payload: '{project,files?,folders?,kind?,source?,generated?,scan?,media?}' },
    { name: 'download', actor: 'orchestrator', phase: 'before or during production', payload: '{project?,url,filename?,maxBytes?}' },
    { name: 'media-request', actor: 'orchestrator', phase: 'open post-registration change', payload: '{purpose,kind?,tool,model?,prompt,seed?,creditEstimate?}' },
    { name: 'media-complete', actor: 'orchestrator', phase: 'open media request', payload: '{id,path,creditActual?}' },
    { name: 'media-fail', actor: 'orchestrator', phase: 'open media request', payload: '{id,error,cancel?}' },
    { name: 'prepare', actor: 'orchestrator', phase: 'before registration', payload: '{project,goal,scene}' },
    { name: 'reregister', actor: 'orchestrator', phase: 'paused project', payload: '{reason}' },
    { name: 'launch|stop', actor: 'orchestrator', phase: 'active goal', payload: '{}' },
    { name: 'begin', actor: 'orchestrator', phase: 'active goal', payload: '{outcome,objects,paths,milestone?,requirements?,scenes?,sceneRequirements?,revision?,media?,final?}' },
    { name: 'extend', actor: 'orchestrator', phase: 'open change', payload: '{objects?,paths,scenes?,sceneRequirements?}' },
    { name: 'finalize', actor: 'orchestrator', phase: 'open change', payload: '{}' },
    { name: 'ticket', actor: 'orchestrator', phase: 'open change', payload: '{operation:apply|save|seal|wip,payload}' },
    { name: 'document', actor: 'orchestrator', phase: 'open change', payload: '{path,content}' },
    { name: 'self-review', actor: 'orchestrator', phase: 'sealed change (review Off)', payload: '{notes}' },
    { name: 'grader-ticket', actor: 'orchestrator', phase: 'sealed change', payload: '{name}' },
    { name: 'grader-fail', actor: 'orchestrator', phase: 'sealed change', payload: '{name,reason}' },
    { name: 'review', actor: 'orchestrator', phase: 'sealed change (all graders done)', payload: '{notes,reason,dispositions}' },
    { name: 'commit', actor: 'orchestrator', phase: 'reviewed change', payload: '{message} or {message,mode:"wip"} for failed/expired' },
    { name: 'approval', actor: 'orchestrator', phase: 'reviewed change (Partially Autonomous)', payload: '{}' },
    { name: 'checkpoint', actor: 'orchestrator', phase: 'committed change', payload: '{}' },
    { name: 'recover', actor: 'orchestrator', phase: 'recovery', payload: '{reopen?:true}' },
    { name: 'abandon', actor: 'orchestrator', phase: 'empty failed/expired change', payload: '{reason}' },
    { name: 'escalate', actor: 'orchestrator', phase: 'capped review', payload: '{reason,max_rounds?:1-4}' },
    { name: 'pause', actor: 'orchestrator', phase: 'active goal', payload: '{}' },
    { name: 'reclaim', actor: 'orchestrator', phase: 'recovery', payload: '{project,reason}' },
    { name: 'forget', actor: 'orchestrator', phase: 'stale registration', payload: '{project,reason}' },
    { name: 'preserve', actor: 'orchestrator', phase: 'sealed tooling-blocked change', payload: '{reason}' },
  ],
  limits: { appliesBeforeCheckpoint: 20, hardApplyCap: 20, maxChangeObjects: 20, maxChangeScenes: 32, ticketTtlMinutes: 10, minutesWithoutApply: 15, wipEveryApplies: 3, maxRounds: 'configured 1-4', batchOperations: MAX_BATCH, autoTurns: 25 },
  goalPolicy: 'Use goal_blender or the /goal-blender command. The built-in goal and goal_report tools are disabled and invalidate the registration. question remains available for clarifications and Partially Autonomous approvals.',
  commitPolicy: 'Project documents are created with bootstrap-document/document. Every successful apply batch commits atomically; the review produces the final commit. A non-scene change containing only documentation, source-only scripts, references, or assets commits and checkpoints without apply, seal, or review. A failed or expired change may use commit {mode:"wip"} then checkpoint; an expired change with no applies also closes with abandon {reason} or an empty WIP commit. A sealed tooling block uses preserve {reason} then checkpoint. Manual project git add or git commit is blocked.',
  mediaPolicy: 'Media generation is blocked until the project is registered, the initial scene is saved and checkpointed, a post-registration bounded change is open, and media-request has recorded the purpose, tool, model, prompt, seed, and credit estimate. Image, texture, and HDRI requests use the configured Media MCP image tools; video, audio, and model generation are not enabled yet. One generation call is allowed per request. Generated files stay under .temp. Call media-complete with the returned path, then intake with the media id and generated metadata. Scene work is blocked while the request is requested, generating, or generated. Retry at most twice with media-fail; a recorded failure can close with commit. Generated media is reference or asset input, never an automatic texture or licensed third-party asset.',
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

function invalidateBuiltInGoal(harness, session, reason) {
  harness.transaction((s) => {
    const p = Object.values(s.projects).find((item) => item.orchestrator === session);
    if (!p || p.complete || p.goalConflict) return;
    const at = new Date().toISOString();
    p.goalActive = false;
    p.goalSource = null;
    p.goalConflict = { at, reason: reason.slice(0, 1000), kind: 'built-in-goal' };
    p.paused = { at, reason: 'registration invalidated by built-in goal' };
  });
}

function withKiloGoal(result, info) {
  if (!result || typeof result !== 'object' || Array.isArray(result)) return result;
  const goal = kiloGoal(info);
  if (!goal) return result;
  result.kiloGoal = goal;
  if (goal.status === 'active' && !result.complete && !result.goalConflict) {
    result.nextStep = {
      phase: 'goal-conflict',
      actor: 'orchestrator',
      action: 'reregister',
      command: 'blender_workflow {action:"reregister",payload:"{\\"reason\\":\\"Built-in /goal invalidated the registration.\\"}"}',
      reason: 'Kilo is running a built-in goal. Use /goal-blender instead; the Blender registration is invalidated. Run /goal clear, close any open change, then reregister.',
    };
    result.next = result.nextStep.reason;
  }
  return result;
}

function reconcileGoal(harness, session, info) {
  const goal = kiloGoal(info);
  if (!goal) return goal;
  if (['active', 'paused', 'blocked'].includes(goal.status)) {
    invalidateBuiltInGoal(harness, session, `Kilo session goal is ${goal.status}; this workspace uses /goal-blender.`);
  }
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

export function createHooks(harness, client, directory = harness.root) {
  const questions = new Map();
  const taskArgs = new Map();
  const taskPlans = new Map();
  const modelAttempts = new Map();
  const questionPending = new Set();
  const continuations = new Set();
  const waitCalls = new Map();
  const modelChain = (choice, globalFallback) => [
    { tier: 'primary', model: choice },
    { tier: 'backup', model: choice?.backup },
    { tier: 'global-fallback', model: globalFallback },
    { tier: 'orchestrator-fallback', model: null },
  ].filter((item) => item.tier === 'orchestrator-fallback' || item.model);
  const chooseModelPlan = (key, choice, globalFallback) => {
    const state = modelAttempts.get(key) ?? { failed: new Set() };
    const chain = modelChain(choice, globalFallback);
    const next = chain.find((item) => !state.failed.has(item.tier));
    if (!next) return null;
    return { key, tier: next.tier, model: next.model, chain };
  };
  const applyModel = (args, plan) => {
    if (plan.tier === 'orchestrator-fallback' || !plan.model) {
      delete args.provider; delete args.model; delete args.variant;
      return;
    }
    Object.assign(args, { provider: plan.model.provider, model: plan.model.model, variant: plan.model.variant });
  };
  const recordModelStartFailure = (plan) => {
    const state = modelAttempts.get(plan.key) ?? { failed: new Set() };
    state.failed.add(plan.tier);
    modelAttempts.set(plan.key, state);
    return plan.chain.find((item) => !state.failed.has(item.tier)) ?? null;
  };
  async function identity(id) {
    // PluginInput.client is SDK v1, whose request shape differs from SDK v2.
    const result = await client.session.get({ path: { id }, query: { directory: harness.root }, throwOnError: true });
    if (!result.data?.id || result.data.id !== id) deny('session identity unavailable');
    return result.data;
  }
  async function lastTurnAborted(sessionID) {
    if (typeof client.session.messages !== 'function') return false;
    try {
      const messages = await client.session.messages({ path: { id: sessionID }, query: { limit: 20 }, throwOnError: true });
      const last = messages.data?.findLast?.((message) => message.info?.role === 'assistant');
      return last?.info?.error?.name === 'MessageAbortedError';
    } catch {
      return false;
    }
  }
  async function abortChildren(project, reason) {
    if (!project) return [];
    const ids = new Set();
    for (const task of project.tasks ?? []) {
      if (task.child && !['done', 'failed', 'cancelled'].includes(task.state)) ids.add(task.child);
    }
    for (const g of Object.values(project.change?.graders ?? {})) {
      if (g.child && !g.verdict && !g.cancelled) ids.add(g.child);
    }
    const children = [...ids];
    if (typeof client.session.abort === 'function') {
      for (const child of children) {
        try {
          await client.session.abort({ path: { id: child }, query: { directory: harness.root } });
        } catch { /* Mark the child cancelled even if the runtime abort is unavailable. */ }
      }
    }
    if (children.length) harness.cancelChildren(project.orchestrator, children, reason);
    return children;
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
      const cfg = harness.workerConfig();
      const observed = assistant ? { providerID: assistant.providerID, modelID: assistant.modelID, variant: assistant.variant } : null;
      const taskTier = harness.transaction((s) => {
        const p = Object.values(s.projects).find((item) => item.orchestrator === info.parentID);
        return p?.tasks?.find((task) => task.child === session)?.modelTier ?? null;
      });
      let role = observed ? modelRole(cfg, observed, harness.globalFallback()) : null;
      if (taskTier === 'global-fallback' || taskTier === 'orchestrator-fallback') role = taskTier;
      if (taskTier && role && taskTier !== role) deny(`worker runtime model tier ${role} does not match requested ${taskTier}; stop this worker and dispatch a fresh task for the requested tier`);
      return { worker: true, info, role, observed, expected: cfg, tier: taskTier };
    }
    if (user?.agent !== 'blender-grader' || !prompt?.includes('HARNESS_GRADER:')) deny('only assigned worker or grader children allowed during production');
    const existing = harness.transaction((s) => harness.graderAssignment(s, session));
    if (!existing) {
      if (!assistant) deny('grader runtime model metadata unavailable; cannot bind grader');
      harness.bindGrader(info.parentID, session, prompt, { providerID: assistant.providerID, modelID: assistant.modelID, variant: assistant.variant });
    }
    return info;
  }
  function stateFor(session) {
    return harness.transaction((s) => Object.values(s.projects).find((p) => p.orchestrator === session) ?? null);
  }
  const delayMs = (value) => {
    if (typeof value !== 'string') return null;
    const match = /^(\d+(?:\.\d+)?)\s*(s|m|h|d)?$/i.exec(value.trim());
    if (!match) return null;
    const factor = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[(match[2] ?? 's').toLowerCase()];
    return Number(match[1]) * factor;
  };
  const waitDueAt = (args, text) => {
    if (typeof args.when === 'string' && Number.isFinite(Date.parse(args.when))) return new Date(Date.parse(args.when)).toISOString();
    const ms = delayMs(args.delay);
    if (ms !== null) return new Date(Date.now() + ms).toISOString();
    const iso = /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\b/.exec(text)?.[0];
    return iso ?? null;
  };
  const waitId = (args, text) => args.id ?? /\b((?:wakeup|wake|cron|task)_[A-Za-z0-9_-]+)\b/i.exec(text)?.[1] ?? null;
  function recordWait(session, kind, args, text) {
    harness.transaction((s) => {
      const project = Object.values(s.projects).find((item) => item.orchestrator === session);
      if (!project) return;
      const entry = {
        kind,
        id: waitId(args, text),
        dueAt: kind === 'wakeup' ? waitDueAt(args, text) : null,
        reason: typeof args.reason === 'string' ? args.reason.slice(0, 500) : null,
        prompt: typeof args.prompt === 'string' ? args.prompt.slice(0, 1000) : null,
        createdAt: new Date().toISOString(),
      };
      project.waits = [...(project.waits ?? []).filter((wait) => !entry.id || wait.id !== entry.id), entry].slice(-WAIT_LIMIT);
    });
  }
  function removeWait(session, predicate) {
    harness.transaction((s) => {
      const project = Object.values(s.projects).find((item) => item.orchestrator === session);
      if (project) project.waits = (project.waits ?? []).filter((wait) => !predicate(wait));
    });
  }
  function clearWakeups(session) {
    removeWait(session, (wait) => wait.kind === 'wakeup');
  }
  async function statusFor(session) {
    const info = await identity(session);
    reconcileGoal(harness, session, info);
    return withKiloGoal(harness.command(session, 'status'), info);
  }
  async function goalBlenderAction(sessionID, args) {
    const info = await identity(sessionID);
    reconcileGoal(harness, sessionID, info);
    const p = stateFor(sessionID);
    if (!p) deny('register the project with blender_workflow prepare before starting /goal-blender');
    const action = args.action ?? 'status';
    if (action === 'status') return JSON.stringify(harness.command(sessionID, 'status'), null, 2);
    if (action === 'start' || action === 'resume') {
      if (p.goalConflict) deny(`goal conflict: ${p.goalConflict.reason}; run /goal clear, close any open change, and reregister`);
      if (p.complete) deny('the mission is complete; reregister before starting another mission');
      const result = harness.command(sessionID, 'goal-active', { source: 'goal-blender', mode: action === 'resume' ? 'resume' : 'start' });
      result.handoff = 'End this turn now. The mission loop starts the next turn; call status and nextStep there.';
      return JSON.stringify(result, null, 2);
    }
    if (action === 'pause' || action === 'stop' || action === 'clear') {
      if (action === 'clear' && p.complete) deny('the mission is complete; reregister instead of clearing it');
      const reason = action === 'clear'
        ? 'Cleared by /goal-blender'
        : action === 'stop' ? 'Stopped by /goal-blender' : 'Paused by /goal-blender';
      const result = action === 'clear'
        ? harness.command(sessionID, 'goal-inactive', { clear: true, reason })
        : harness.command(sessionID, 'goal-inactive', { reason });
      const abortedChildren = await abortChildren(p, reason);
      if (action === 'clear') result.openChange = Boolean(p.change);
      result.abortedChildren = abortedChildren;
      return JSON.stringify(result, null, 2);
    }
    if (action === 'complete') {
      if (typeof args.evidence !== 'string' || !args.evidence.trim()) deny('completion requires evidence');
      return JSON.stringify(harness.command(sessionID, 'goal-complete', { reason: args.evidence.trim().slice(0, 2000) }), null, 2);
    }
    deny('goal_blender action must be start, status, pause, stop, resume, complete, or clear');
  }
  async function continueGoalBlender(sessionID) {
    if (continuations.has(sessionID) || questionPending.has(sessionID)) return;
    const project = stateFor(sessionID);
    if (!project || !project.goalActive || project.goalSource !== 'goal-blender' || project.complete || project.goalConflict) return;
    if ((project.goalMeta?.autoTurns ?? 0) >= MAX_AUTO_TURNS) return;
    const waiting = harness.transaction((s) => {
      const current = Object.values(s.projects).find((item) => item.orchestrator === sessionID);
      if (!current) return false;
      const expired = expiredWakeups(current);
      if (expired.length) current.waits = (current.waits ?? []).filter((wait) => !expired.includes(wait));
      return activeWaits(current).length > 0;
    });
    if (waiting) return;
    if (await lastTurnAborted(sessionID)) {
      const reason = 'Stopped by the user (session aborted); resume with /goal-blender resume.';
      await abortChildren(project, reason);
      harness.transaction((s) => {
        const current = Object.values(s.projects).find((item) => item.orchestrator === sessionID);
        if (!current || current.complete) return;
        current.goalActive = false;
        current.goalSource = null;
        current.paused = { at: new Date().toISOString(), reason };
        if (current.change) current.change.cancelled = { at: new Date().toISOString(), reason };
      });
      return;
    }
    let info;
    try { info = await identity(sessionID); } catch { return; }
    const builtIn = kiloGoal(info);
    if (builtIn && ['active', 'paused', 'blocked'].includes(builtIn.status)) {
      invalidateBuiltInGoal(harness, sessionID, 'Kilo session goal is present; this workspace uses /goal-blender.');
      return;
    }
    continuations.add(sessionID);
    try {
      if (typeof client.session.promptAsync !== 'function') return;
      const counted = harness.transaction((s) => {
        const current = Object.values(s.projects).find((item) => item.orchestrator === sessionID);
        if (!current?.goalMeta) return false;
        current.goalMeta = { ...current.goalMeta, autoTurns: (current.goalMeta.autoTurns ?? 0) + 1, lastTurnAt: new Date().toISOString() };
        return true;
      });
      if (!counted) return;
      await client.session.promptAsync({
        path: { id: sessionID },
        query: { directory },
        body: {
          parts: [{
            type: 'text',
            synthetic: true,
            text: 'HARNESS GOAL CONTINUATION (automatic; no user message). Continue the active /goal-blender mission. Inspect status, make the next safe step, and do not complete without the harness checks.',
          }],
        },
      });
    } catch {} finally {
      continuations.delete(sessionID);
    }
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
    config: async (config) => {
      config.command ??= {};
      config.command['goal-blender'] = {
        description: 'Harness-owned Blender mission. Use instead of /goal. Actions: start, status, pause, stop, resume, complete, clear.',
        template: 'Use goal_blender for the harness-owned Blender mission with arguments: $ARGUMENTS. Do not call the built-in goal or goal_report tools.',
      };
    },
    tool: {
      goal_blender: {
        description: 'Harness-owned Blender mission lifecycle. Use instead of the built-in goal tool. Actions: start, status, pause, stop, resume, complete, clear.',
        args: {
          action: z.enum(['start', 'status', 'pause', 'stop', 'resume', 'complete', 'clear']),
          evidence: z.string().optional(),
        },
        async execute(args, context) {
          const session = await identity(context.sessionID);
          if (session.parentID) deny('goal_blender belongs to the root orchestrator');
          return goalBlenderAction(context.sessionID, args);
        },
      },
      blender_workflow: {
        description: 'Mandatory Blender workflow gate. capabilities, status, bootstrap-document, bootstrap-commit, intake, download, media-request, media-complete, media-fail, prepare, reregister, launch, stop, begin, extend, finalize, document, ticket, grader-ticket, grader-fail, self-review, review, commit, approval, checkpoint, recover, abandon, escalate, preserve, reclaim, forget. payload is a JSON object or JSON string. Follow status.nextStep for the exact next call. Project documents and commits are harness-owned; never invoke Blender or legacy scripts from the shell.',
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
    async 'command.execute.before'(input, output) {
      if (input.command === 'goal-blender') {
        const raw = String(input.arguments ?? '').trim();
        const [action = 'status', ...rest] = raw ? raw.split(/\s+/) : [];
        const text = await goalBlenderAction(input.sessionID, { action, evidence: rest.join(' ').trim() || undefined });
        output.parts = [{ type: 'text', text }];
        return;
      }
      if (input.command === 'goal') {
        const action = String(input.arguments ?? '').trim().split(/\s+/)[0];
        if (['pause', 'clear'].includes(action)) return;
        invalidateBuiltInGoal(harness, input.sessionID, 'Built-in /goal was used; this workspace requires /goal-blender.');
        output.parts = [{
          type: 'text',
          text: 'Built-in /goal is disabled in this workspace. Use /goal-blender. The Blender registration is invalidated; run /goal clear, close any open change, then reregister.',
        }];
      }
    },
    async 'chat.message'(input, output) {
      const parts = output.parts ?? [];
      const text = parts.filter((part) => part.type === 'text' && part.text).map((part) => part.text).join('\n').trim();
      if (/^\/goal(?:\s|$)/.test(text) && !/^\/goal-blender(?:\s|$)/.test(text)
        && !/^\/goal\s+(?:pause|clear)\b/.test(text)) {
        invalidateBuiltInGoal(harness, input.sessionID, 'Built-in /goal was used; this workspace requires /goal-blender.');
      }
      if (!input.sessionID || parts.some((part) => part.type === 'text' && part.synthetic)) return;
      clearWakeups(input.sessionID);
      harness.transaction((s) => {
        const project = Object.values(s.projects).find((item) => item.orchestrator === input.sessionID);
        if (project?.goalMeta) project.goalMeta = { ...project.goalMeta, autoTurns: 0 };
      });
    },
    event: async ({ event }) => {
      if (event.type !== 'session.idle') return;
      await continueGoalBlender(event.properties.sessionID);
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
          if (!child.role) {
            const detail = modelDiagnostics(child.expected, child.observed, harness.globalFallback());
            deny(`worker runtime model does not match configured worker, backup, or global fallback; observed ${detail.observed}; expected ${detail.expected}. Stop this worker and dispatch a fresh one with the configured tier.`);
          }
          reconcileGoal(harness, session.parentID, await identity(session.parentID));
          harness.authorize(session.parentID, args.token, args.operation, args.payload);
          harness.bindWorkerByToken(session.parentID, input.sessionID, args.token);
          return;
        }
        if (args.operation === 'apply') deny('orchestrator delegates apply operations to blender-worker; save and seal stay orchestrator-owned');
        reconcileGoal(harness, input.sessionID, session);
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
      if (tool.startsWith('mediamcp_')) {
        if (session.parentID) deny('media tools belong to the root orchestrator');
        if (MEDIA_GENERATION_TOOLS.has(tool)) {
          if (!p) deny('media generation requires a registered project, a checkpointed initial scene, an open bounded change, and a media-request');
          const request = p.media?.requests?.find((item) => item.status === 'requested');
          if (!request) deny('media generation requires an open media-request; call blender_workflow media-request first');
          if (request.tool !== tool) deny(`open media request ${request.id} requires ${request.tool}`);
          harness.mediaStart(input.sessionID, request.id);
          return;
        }
        if (MEDIA_READ.has(tool)) return;
        deny('unknown Media MCP tool');
      }
      if (session.parentID && harness.transaction((s) => Object.values(s.projects).some((p) => p.orchestrator === session.parentID))) {
        const child = await childAssignment(input.sessionID);
        if (child?.worker) {
          if (ORCHESTRATOR_ONLY.has(tool) || ['write', 'edit', 'apply_patch', 'bash', 'task', 'agent_manager', 'question', 'goal', 'goal_report', 'goal_blender'].includes(tool)
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
            if (typeof image !== 'string') deny('grader look requires an exact frozen evidence image; call blender_look {image:"<assigned evidence path>"}');
            const full = path.resolve(harness.root, image);
            const relative = full.startsWith(harness.root + path.sep) ? path.relative(harness.root, full).replaceAll('\\', '/') : null;
            if (!relative || !Object.hasOwn(assignmentState.p.change.evidence, relative)) deny('grader look limited to frozen evidence image');
          }
        } else if (!READ_ONLY.has(tool) && !tool.startsWith('context7_')) deny('grader tool outside read-only scope');
        return;
      }
      if (tool === 'question') {
        const harnessQuestion = harness.transaction((s) => {
          const text = args.questions?.[0]?.question;
          const reference = s.references?.[input.sessionID];
          return Boolean(text && (
            reference?.question === text
            || (s.challenge?.session === input.sessionID && s.challenge.question === text)
            || Object.values(s.projects).some((project) => project.orchestrator === input.sessionID && project.change?.approvalQuestion === text)
          ));
        });
        if (harnessQuestion && args.questions?.some((question) => question.custom === true || question.multiple === true)) {
          deny('harness questions require custom:false and multiple:false so the runtime answer is recorded; re-ask with the exact labels');
        }
        questions.set(input.callID, structuredClone(args));
        questionPending.add(input.sessionID);
      }
      if (tool === 'goal' || tool === 'goal_report') {
        if (tool === 'goal' && ['pause', 'clear'].includes(args.action)) return;
        invalidateBuiltInGoal(harness, input.sessionID, `${tool} is disabled; this workspace uses /goal-blender.`);
        deny('The built-in goal tools are disabled in this workspace. Use /goal-blender (goal_blender) instead. The Blender registration is now invalidated; run /goal clear, close any open change, then reregister.');
      }
      if (!p) {
        if (ORCHESTRATOR_ONLY.has(tool)) deny('scheduler and process tools require a registered active goal');
        if (tool.startsWith('blender_') && !BLENDER_READ.has(tool) && tool !== 'blender_workflow') deny('production tool requires a registered project; run blender_workflow prepare and complete its registration question first');
        if (['write', 'edit', 'apply_patch'].includes(tool)) {
          const files = editPaths(tool, args).map(relative);
          if (files.some((f) => path.resolve(harness.root, f).startsWith(harness.home))) deny('harness state is runtime-owned; never write it directly');
          const blocked = files.filter((f) => /^Blender\/[^/]+\//.test(f));
          if (blocked.length) deny(`project files are harness-owned: ${blocked.join(', ')}. Before registration use blender_workflow bootstrap-document for markdown and bootstrap-commit for the exact scaffold; scaffold the folder with node .kilo/blender-project-harness/tools/harness/cli.mjs scaffold. Do not write project files directly.`);
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
      if (['schedule_wakeup', 'cancel_wakeup', 'cron_create', 'cron_delete'].includes(tool)) {
        waitCalls.set(input.callID, { tool, args, session: input.sessionID });
        return;
      }
      if (tool === 'background_process') {
        const command = args.command ?? '';
        if (typeof command !== 'string' || !command.trim()) deny('background process requires one command');
        if (unsafeBlenderShell(command)) deny('launch and stop Blender through blender_workflow launch/stop');
        if (args.workdir && path.resolve(args.workdir) !== harness.root) deny('background process workdir must be the workspace root');
        if (/^git (?:add|commit)\b/i.test(command)) deny('production commits use blender_workflow commit');
        guardShell(harness, input.sessionID, p.project, command, args);
        return;
      }
      if (tool === 'blender_workflow' || tool === 'goal_blender' || tool === 'question' || READ_ONLY.has(tool) || BLENDER_READ.has(tool) || tool.startsWith('context7_')) return;
      if (tool === 'task') {
        if (args.background) deny('production delegation must be foreground');
        if (args.subagent_type === 'blender-worker') {
          if (!p.goalActive || !args.prompt?.trim()) deny('worker delegation requires an active goal and a task prompt');
          if (/HARNESS_GRADER:/.test(args.prompt)) deny('worker task cannot carry a grader marker');
          const cfg = harness.workerConfig();
          const token = args.prompt.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i)?.[0] ?? p.change?.pending ?? null;
          if (token) {
            const task = p.tasks?.find((item) => item.token === token);
            const missing = [];
            if (!args.prompt.includes(p.scene)) missing.push(`authoritative scene ${p.scene}`);
            if (!args.prompt.includes(token)) missing.push(`one-time token ${token}`);
            if (task?.taskDoc && !args.prompt.includes(task.taskDoc)) missing.push(`task document ${task.taskDoc}`);
            if (missing.length) deny(`worker prompt is missing ${missing.join(', ')}. Use the exact workerPrompt returned by ticket/status.nextStep`);
          }
          const key = `worker:${token ?? `${input.sessionID}:${p.change?.id ?? 'none'}`}`;
          const plan = chooseModelPlan(key, cfg, harness.globalFallback());
          if (!plan) deny(`all configured model tiers failed before child start (${modelChain(cfg, harness.globalFallback()).map((item) => item.tier).join(' -> ')}); mark tooling failure instead of retrying`);
          applyModel(args, plan);
          if (token) harness.setModelTier(input.sessionID, token, plan.tier, 'worker');
          taskPlans.set(input.callID, { ...plan, kind: 'worker', prompt: args.prompt, session: input.sessionID });
          return;
        }
        if (args.subagent_type !== 'blender-grader' || !/HARNESS_GRADER:[a-f0-9-]{36}/.test(args.prompt ?? '')) deny('production delegation requires foreground assigned grader');
        if (!/saved scene SHA-256 [a-f0-9]{64}/.test(args.prompt ?? '') || !/Evidence key: [a-f0-9]{64}/.test(args.prompt ?? '')) {
          deny('grader task must use the exact grader-ticket prompt including the saved scene SHA-256 and evidence key');
        }
        if (args.task_id || args.taskId) deny('grader tickets require a fresh task; omit task_id. Resumed sessions keep an old grader token and cannot satisfy the current assignment.');
        const token = args.prompt.match(/HARNESS_GRADER:([a-f0-9-]{36})/)[1];
        if (!p.change?.inspected || !Object.values(p.change.graders).some((g) => g.token === token)) deny('grader ticket missing');
        const graderName = Object.entries(p.change.graders).find(([, g]) => g.token === token)?.[0];
        const cfg = p.records.roster.find((g) => g.name === graderName);
        if (!cfg) deny('grader model configuration missing');
        const key = `grader:${p.change.round}:${graderName}`;
        const plan = chooseModelPlan(key, cfg, harness.globalFallback());
        if (!plan) deny(`all configured model tiers failed before child start; mark the grader as a tooling block instead of retrying`);
        applyModel(args, plan);
        harness.setModelTier(input.sessionID, token, plan.tier, 'grader');
        taskPlans.set(input.callID, { ...plan, kind: 'grader' });
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
        if (names.some((f) => f === `${p.project}/Documents/MEDIA.md`)) deny('the media ledger is harness-owned; use media-request, media-complete, media-fail, or intake');
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
        questionPending.delete(input.sessionID);
        if (args && !output.metadata?.dismissed && output.metadata?.answers) harness.question(input.sessionID, args, output.metadata.answers);
      }
      if (tool === 'goal' || tool === 'goal_report') {
        if (successful(output) && !(tool === 'goal' && ['pause', 'clear'].includes(input.args?.action))) {
          invalidateBuiltInGoal(harness, input.sessionID, `${tool} succeeded; this workspace uses /goal-blender.`);
        }
        return;
      }
      if (waitCalls.has(input.callID)) {
        const call = waitCalls.get(input.callID); waitCalls.delete(input.callID);
        if (successful(output)) {
          const text = [output.output, output.metadata ? JSON.stringify(output.metadata) : ''].filter(Boolean).join('\n');
          if (call.tool === 'schedule_wakeup') recordWait(call.session, 'wakeup', call.args, text);
          else if (call.tool === 'cron_create') recordWait(call.session, 'cron', call.args, text);
          else if (call.tool === 'cancel_wakeup' && call.args.action !== 'list') {
            removeWait(call.session, (wait) => wait.kind === 'wakeup' && (!call.args.id || wait.id === call.args.id || !wait.id));
          } else if (call.tool === 'cron_delete') {
            removeWait(call.session, (wait) => wait.kind === 'cron' && (!call.args.id || wait.id === call.args.id || !wait.id));
          }
        }
      }
      const p = stateFor(input.sessionID);
      if (!p) return;
      if (tool === 'blender_look' && input.args.image) {
        const imageResult = output.content?.some((c) => c.type === 'image') || output.attachments?.some((a) => a.mime?.startsWith('image/'));
        harness.inspect(input.sessionID, path.resolve(harness.root, input.args.image), Boolean(successful(output) && imageResult));
      }
      if (tool === 'task' && taskArgs.has(input.callID)) {
        const args = taskArgs.get(input.callID); taskArgs.delete(input.callID);
        const plan = taskPlans.get(input.callID); taskPlans.delete(input.callID);
        const child = output.metadata?.sessionId ?? output.metadata?.sessionID ?? output.output?.match(/task(?:_id| id)[=:"\s]+(ses_[A-Za-z0-9]+)/)?.[1];
        const token = args?.prompt?.match(/HARNESS_GRADER:([a-f0-9-]{36})/)?.[1];
        if (!child || !successful(output)) {
          if (!child && plan) {
            const next = recordModelStartFailure(plan);
            if (next) {
              output.output = `${output.output ?? 'Task did not start'}\n\nModel tier ${plan.tier} failed before a child session. Retry the same task; next tier: ${next.tier}.`;
              return;
            }
          }
          if (token) harness.failGraderByToken(input.sessionID, token, output.output ?? 'grader task failed before child session');
          else deny('grader task result lacks child session ID');
        } else {
          if (plan) modelAttempts.delete(plan.key);
          harness.collectGrader(input.sessionID, child);
        }
      } else if (tool === 'task' && taskPlans.get(input.callID)?.kind === 'worker') {
        const plan = taskPlans.get(input.callID); taskPlans.delete(input.callID);
        const child = output.metadata?.sessionId ?? output.metadata?.sessionID ?? output.output?.match(/task(?:_id| id)[=:"\s]+(ses_[A-Za-z0-9]+)/)?.[1];
        if (successful(output) && child) {
          if (plan) modelAttempts.delete(plan.key);
          harness.bindWorker(input.sessionID, child, plan.prompt ?? input.args?.prompt ?? '');
          const token = (plan.prompt ?? input.args?.prompt ?? '').match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i)?.[0];
          const text = typeof output.output === 'string' ? output.output : '';
          if (token && /\bBLOCKED\b/.test(text)) {
            const releasable = harness.transaction((s) => ['issued', 'authorized'].includes(s.tickets[token]?.state));
            if (releasable) harness.failWorkerByToken(input.sessionID, token, 'worker returned BLOCKED before executing the ticket');
          }
        } else {
          if (!child && plan) {
            const next = recordModelStartFailure(plan);
            if (next) {
              output.output = `${output.output ?? 'Task did not start'}\n\nModel tier ${plan.tier} failed before a child session. Retry the same task; next tier: ${next.tier}.`;
              return;
            }
          }
          const token = (plan.prompt ?? input.args?.prompt ?? '').match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i)?.[0];
          if (token) harness.failWorkerByToken(input.sessionID, token, output.output ?? 'worker task failed before completion');
        }
      }
      if (successful(output) && typeof output.output === 'string') output.output += `\n\nWorkflow: ${JSON.stringify(await statusFor(input.sessionID))}`;
    },
    async 'experimental.chat.system.transform'(input, output) {
      if (harness.developmentMode(input.sessionID)) return;
      if (!input.sessionID) return;
      const p = stateFor(input.sessionID);
      if (p) output.system.push(`Runtime workflow state: ${JSON.stringify(await statusFor(input.sessionID))}. Use blender_workflow; never bypass missing gates. Use /goal-blender, never the built-in goal or goal_report; using /goal invalidates the registration.`);
    },
    async 'experimental.session.compacting'(input, output) {
      if (harness.developmentMode(input.sessionID)) return;
      const p = stateFor(input.sessionID);
      if (p) output.context.push(`Durable Blender workflow: ${JSON.stringify(await statusFor(input.sessionID))}. Continue the active /goal-blender mission; do not repeat mission start or begin.`);
    },
  };
}

export async function server(context) { return createHooks(new Harness(context.worktree), context.client, context.directory); }
