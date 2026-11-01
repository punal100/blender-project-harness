import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { Harness, contained, deny, git, normalizeGoal, stable } from './engine.mjs';
import { describeDocumentFormats } from './documents.mjs';
import { OPERATION_NAMES, PRIMITIVES, operationCode } from './blender-operations.mjs';

const READ_ONLY = new Set(['read', 'glob', 'grep', 'list', 'webfetch', 'websearch', 'skill', 'todowrite', 'todoread', 'board_read', 'board_post', 'agent_manager_models', 'kilo_local_recall']);
const BLENDER_READ = new Set(['blender_get_addon_status', 'blender_get_scene_info', 'blender_look', 'blender_search_assets', 'blender_disable_telemetry', 'blender_record_trajectory_feedback']);
const GRADER_BLENDER_READ = new Set(['blender_look']);
const WORKER_BLENDER_READ = new Set(['blender_get_addon_status', 'blender_get_scene_info', 'blender_look']);
const PUBLIC_ACTIONS = new Set(['status', 'launch', 'stop', 'begin', 'bootstrap-document', 'bootstrap-commit', 'document', 'self-review', 'review', 'commit', 'approval', 'checkpoint', 'grader-ticket', 'recover', 'escalate']);
const BLENDER_SHELL = /start-blender(?:-log)?\.(?:cmd|ps1)|start_blender_mcp\.py|new-blender-project\.(?:cmd|ps1)|blender(?:\.exe)?(?:\s|$)/i;
const successful = (output) => output && !output.isError && !output.metadata?.error && !/^Error\b/.test(output.output ?? '');
const BOOTSTRAP_DOCUMENTS = [
  'README.md',
  'Documents/README.md',
  'Documents/REQUIREMENTS.md',
  'Documents/WORKFLOW.md',
  'Documents/REVIEW.md',
  'Documents/ASSETS.md',
  'Documents/DECISIONS.md',
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
    { name: 'prepare', actor: 'orchestrator', phase: 'before registration', payload: '{project,goal,scene}' },
    { name: 'launch|stop', actor: 'orchestrator', phase: 'active goal', payload: '{}' },
    { name: 'begin', actor: 'orchestrator', phase: 'active goal', payload: '{outcome,objects,paths,revision?}' },
    { name: 'ticket', actor: 'orchestrator', phase: 'open change', payload: '{operation,payload}' },
    { name: 'document', actor: 'orchestrator', phase: 'open change', payload: '{path,content}' },
    { name: 'self-review|review|grader-ticket', actor: 'orchestrator', phase: 'sealed change', payload: 'see docs' },
    { name: 'commit|checkpoint|approval', actor: 'orchestrator', phase: 'reviewed change', payload: 'see docs' },
    { name: 'recover|escalate', actor: 'orchestrator', phase: 'recovery', payload: 'see docs' },
  ],
  limits: { appliesBeforeCheckpoint: 20, hardApplyCap: 40, minutesPerChange: 15, maxRounds: 'configured 1-4' },
  commitPolicy: 'Project documents are created with bootstrap-document/document. Commits use bootstrap-commit/commit; manual project git add or git commit is blocked.',
  documentPolicy: 'Use blender_document action read for structured title/field/section access and action write for declared writes. Registration documents (REQUIREMENTS, WORKFLOW, REVIEW, and the active goal) are frozen after registration; stop for explicit re-registration. Direct read/edit is permitted but discouraged; review reports are written only through the document tool.',
  documentTool: { actions: ['read', 'write'], read: '{project?,path,section?}', write: '{project?,path,content}' },
});

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
    if (user?.agent === 'blender-worker') return { worker: true, info };
    if (user?.agent !== 'blender-grader' || !prompt?.includes('HARNESS_GRADER:')) deny('only assigned worker or grader children allowed during production');
    const existing = harness.transaction((s) => harness.graderAssignment(s, session));
    const assistant = messages.data.findLast((m) => m.info?.role === 'assistant' && !m.info.summary)?.info;
    if (!assistant) deny('grader runtime model metadata unavailable');
    if (!existing) harness.bindGrader(info.parentID, session, prompt, { providerID: assistant.providerID, modelID: assistant.modelID, variant: assistant.variant });
    return info;
  }
  function stateFor(session) {
    return harness.transaction((s) => Object.values(s.projects).find((p) => p.orchestrator === session) ?? null);
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
        description: 'Mandatory Blender workflow gate. capabilities, status, bootstrap-document, bootstrap-commit, prepare, launch, stop, begin, document, ticket, grader-ticket, self-review, review, commit, approval, checkpoint, recover, escalate. payload is JSON. Follow status.nextStep for the exact next call. Project documents and commits are harness-owned; never invoke Blender or legacy scripts from the shell.',
        args: { action: z.string(), payload: z.string().default('{}') },
        async execute(args, context) {
          const session = await identity(context.sessionID);
          if (session.parentID) deny('workflow control belongs to root orchestrator');
          const payload = JSON.parse(args.payload);
          if (!payload || typeof payload !== 'object' || Array.isArray(payload)) deny('payload must be JSON object');
          let result;
          if (args.action === 'capabilities') result = capabilities();
          else if (args.action === 'bootstrap-document') result = harness.bootstrapDocument(context.sessionID, payload);
          else if (args.action === 'bootstrap-commit') result = harness.bootstrapCommit(context.sessionID, payload);
          else if (args.action === 'prepare') result = harness.prepare(context.sessionID, payload);
          else if (args.action === 'ticket') {
            const p = stateFor(context.sessionID);
            if (!p) deny('no registered project for this session; call blender_workflow prepare and complete its registration question first');
            if (payload.operation === 'apply') operationCode(payload.payload, p.change?.objects ?? []);
            else if (stable(payload.payload) !== '{}') deny('save/seal payload must be empty object');
            result = harness.issue(context.sessionID, payload.operation, payload.payload);
          } else {
            if (!PUBLIC_ACTIONS.has(args.action)) deny('internal workflow action unavailable');
            result = args.action === 'recover' ? harness.recover(context.sessionID)
              : args.action === 'launch' ? await harness.launch(context.sessionID)
                : args.action === 'stop' ? await harness.stop(context.sessionID)
                  : harness.command(context.sessionID, args.action, payload);
          }
          return JSON.stringify(result, null, 2);
        },
      },
      blender_document: {
        description: 'Structured project-document access. action read returns title, metadata fields, section index and format diagnostics; pass section to read one section. action write creates or updates a declared document or the assigned grader report and rejects invalid format/structure. Use this instead of raw full-file reads and direct edits.',
        args: { action: z.string(), payload: z.string().default('{}') },
        async execute(args, context) {
          const payload = JSON.parse(args.payload);
          if (!payload || typeof payload !== 'object' || Array.isArray(payload)) deny('payload must be JSON object');
          if (args.action === 'read') return JSON.stringify(harness.documentRead(context.sessionID, payload, (await identity(context.sessionID)).parentID ?? null), null, 2);
          if (args.action === 'write') return JSON.stringify(harness.documentWrite(context.sessionID, payload), null, 2);
          deny('document action must be read or write');
        },
      },
    },
    async 'tool.execute.before'(input, output) {
      const tool = input.tool.replace(/^functions\./, '');
      const args = output.args ?? {};
      if (/execute_blender_code|import_asset|generate_3d/.test(tool)) deny('raw Blender mutation disabled; use ticketed harness_execute');
      if (tool === 'blender_harness_execute') {
        const session = await identity(input.sessionID);
        if (session.parentID) {
          const child = await childAssignment(input.sessionID);
          if (!child?.worker || args.operation !== 'apply') deny('worker may execute assigned apply operations only');
          harness.authorize(session.parentID, args.token, args.operation, args.payload);
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
      const p = stateFor(input.sessionID);
      const session = await identity(input.sessionID);
      if (session.parentID && harness.transaction((s) => Object.values(s.projects).some((p) => p.orchestrator === session.parentID))) {
        const child = await childAssignment(input.sessionID);
        if (child?.worker) {
          if (['write', 'edit', 'apply_patch', 'bash', 'task', 'agent_manager', 'question', 'goal', 'goal_report'].includes(tool)
            || (tool.startsWith('blender_') && !WORKER_BLENDER_READ.has(tool))
            || (!READ_ONLY.has(tool) && !WORKER_BLENDER_READ.has(tool) && !tool.startsWith('context7_'))) deny('worker child is read-only and cannot use this tool');
          return;
        }
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
        if (tool.startsWith('blender_') && !BLENDER_READ.has(tool) && tool !== 'blender_workflow') deny('production tool requires a registered project; run blender_workflow prepare and complete its registration question first');
        if (['write', 'edit', 'apply_patch'].includes(tool)) {
          const files = editPaths(tool, args).map(relative);
          if (files.some((f) => path.resolve(harness.root, f).startsWith(harness.home))) deny('harness state is runtime-owned; never write it directly');
          const blocked = files.filter((f) => /^Blender\/[^/]+\//.test(f));
          if (blocked.length) deny(`project files are harness-owned: ${blocked.join(', ')}. Before registration use blender_workflow bootstrap-document for markdown and bootstrap-commit for the exact scaffold; scaffold the folder with node tools/harness/cli.mjs scaffold. Do not write project files directly.`);
        }
        if (tool === 'bash') {
          const command = args.command ?? '';
          if (BLENDER_SHELL.test(command) && !/--version/.test(command)) deny('launch and stop Blender through blender_workflow launch/stop; shell Blender commands and legacy scripts are retired');
          if (/^git add\b/.test(command) && /(?:^|[\s"'])Blender[\\/][^\\/"']+[\\/]/i.test(command)) deny('project commits use blender_workflow bootstrap-commit before registration and commit after registration');
          if (/^git commit\b/.test(command)) {
            const staged = git(harness.root, ['diff', '--cached', '--name-only']).split(/\r?\n/).filter(Boolean);
            if (staged.some((name) => name.startsWith('Blender/'))) deny('project commits use blender_workflow bootstrap-commit before registration and commit after registration');
          }
        }
        return;
      }
      if (tool === 'blender_workflow' || tool === 'question' || READ_ONLY.has(tool) || BLENDER_READ.has(tool) || tool.startsWith('context7_')) return;
      if (tool === 'goal') {
        if (args.action === 'start' && normalizeGoal(args.objective) !== normalizeGoal(p.records.goalText)) deny('goal objective must equal registered prompt');
        harness.fresh(p); return;
      }
      if (tool === 'goal_report') {
        if (args.status === 'complete') {
          if (p.change || p.history.at(-1)?.verdict !== 'PASS' || !p.lastRender || harness.hash(p.lastRender.path) !== p.lastRender.hash) deny('completion blocked by missing checkpoint/PASS/render');
          harness.assertCommitted(p.project, harness.snapshot(p.project));
        } else if (args.status === 'blocked') {
          try { harness.assertCommitted(p.project, harness.snapshot(p.project)); }
          catch { deny('commit the exact project files before ending a blocked turn: stage only the current change paths, scene, render, reports, manifest, and review index, then commit once'); }
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
        if (!c) deny('no open bounded change; call blender_workflow begin with one outcome, exact object names, and exact project-relative paths before writing project files');
        const allowed = new Set(c.paths);
        if (c.round) { allowed.add(`${p.project}/Documents/Reviews/${c.round}/REVIEW.md`); allowed.add(`${p.project}/Documents/Reviews/README.md`); }
        const files = editPaths(tool, args);
        if (files.some((f) => !allowed.has(relative(f)) || /\.blend$|\/manifest\.json$|\/_evidence\/|\/REPORT\.md$|\.(png|jpg|exr)$/i.test(f))) deny('write outside the declared change scope or targets runtime-owned evidence/report paths; add the exact path to blender_workflow begin paths, or stop writing it');
        if (files.some((f) => relative(f).startsWith(`${p.project}/`) && /\.md$/i.test(f) && !fs.existsSync(path.resolve(harness.root, f)))) deny('new documents require blender_document write or blender_workflow document after declaring the exact path');
        harness.fresh(p);
        return;
      }
      if (tool === 'bash') {
        const command = args.command ?? '';
        if (BLENDER_SHELL.test(command) && !/--version/.test(command)) deny('launch and stop Blender through blender_workflow launch/stop; shell Blender commands and legacy scripts are retired');
        if (args.workdir && path.resolve(args.workdir) !== harness.root) deny('production Git/launch commands require workspace root');
        if (/[;&|`\r\n$<>]/.test(command)) deny('production shell accepts one literal command only');
        if (/^git status(?: --short)?(?: --branch)?$/.test(command) || /^git diff(?: --stat| --check| --cached| --name-only)*$/.test(command) || /^git log --oneline -10$/.test(command)) return;
        if (/^git (?:add|commit)\b/.test(command)) deny('production commits use blender_workflow commit with one bounded message');
        deny('production shell route denied; use guarded tools or the harness commit action');
      }
      deny(`unclassified production tool: ${tool}`);
    },
    async 'tool.execute.after'(input, output) {
      const tool = input.tool.replace(/^functions\./, '');
      if (tool === 'question') {
        const args = questions.get(input.callID); questions.delete(input.callID);
        if (args && !output.metadata?.dismissed && output.metadata?.answers) harness.question(input.sessionID, args, output.metadata.answers);
      }
      const p = stateFor(input.sessionID);
      if (!p) return;
      if (tool === 'goal' && successful(output)) harness.command(input.sessionID, 'goal-active', { objective: input.args.action === 'start' ? input.args.objective : undefined });
      if (tool === 'goal_report' && input.args.status === 'complete' && successful(output)) harness.command(input.sessionID, 'goal-complete');
      if (tool === 'blender_look' && input.args.image) {
        const imageResult = output.content?.some((c) => c.type === 'image') || output.attachments?.some((a) => a.mime?.startsWith('image/'));
        harness.inspect(input.sessionID, path.resolve(harness.root, input.args.image), Boolean(successful(output) && imageResult));
      }
      if (tool === 'task' && taskArgs.has(input.callID)) {
        taskArgs.delete(input.callID);
        const child = output.metadata?.sessionId ?? output.metadata?.sessionID ?? output.output?.match(/task(?:_id| id)[=:"\s]+(ses_[A-Za-z0-9]+)/)?.[1];
        if (!child) deny('grader task result lacks child session ID');
        harness.collectGrader(input.sessionID, child);
      }
      if (successful(output) && typeof output.output === 'string') output.output += `\n\nWorkflow: ${JSON.stringify(harness.command(input.sessionID, 'status'))}`;
    },
    async 'experimental.chat.system.transform'(input, output) {
      if (!input.sessionID) return;
      const p = stateFor(input.sessionID);
      if (p) output.system.push(`Runtime workflow state: ${JSON.stringify(harness.command(input.sessionID, 'status'))}. Use blender_workflow; never bypass missing gates.`);
    },
    async 'experimental.session.compacting'(input, output) {
      const p = stateFor(input.sessionID);
      if (p) output.context.push(`Durable Blender workflow: ${JSON.stringify(harness.command(input.sessionID, 'status'))}. Continue current phase; do not repeat goal start or begin.`);
    },
  };
}

export async function server(context) { return createHooks(new Harness(context.worktree), context.client); }
