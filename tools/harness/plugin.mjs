import path from 'node:path';
import { z } from 'zod';
import { Harness, contained, deny, git, stable } from './engine.mjs';
import { operationCode } from './blender-operations.mjs';

const READ_ONLY = new Set(['read', 'glob', 'grep', 'list', 'webfetch', 'websearch', 'skill', 'todowrite', 'todoread', 'board_read', 'board_post', 'agent_manager_models', 'kilo_local_recall']);
const BLENDER_READ = new Set(['blender_get_addon_status', 'blender_get_scene_info', 'blender_look', 'blender_search_assets', 'blender_disable_telemetry', 'blender_record_trajectory_feedback']);
const GRADER_BLENDER_READ = new Set(['blender_look']);
const PUBLIC_ACTIONS = new Set(['status', 'begin', 'self-review', 'review', 'approval', 'checkpoint', 'grader-ticket', 'recover', 'escalate']);
const successful = (output) => output && !output.isError && !output.metadata?.error && !/^Error\b/.test(output.output ?? '');
const BOOTSTRAP_DOC = /^(?:README\.md|Documents\/(?:README|REQUIREMENTS|WORKFLOW|REVIEW|ASSETS|DECISIONS|Goals\/README|References\/README|Reviews\/README)\.md|Documents\/Goals\/\d+-[a-z0-9-]+\.md|Documents\/References\/[A-Za-z0-9._-]+\.md)$/;

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
    const first = messages.data.find((m) => m.info?.role === 'user' && m.parts?.some((p) => p.type === 'text' && p.text?.includes('HARNESS_GRADER:')));
    const user = first?.info;
    const prompt = first?.parts?.filter((p) => p.type === 'text' && !p.synthetic && !p.ignored).map((p) => p.text).join('\n');
    if (user?.agent !== 'blender-grader' || !prompt?.includes('HARNESS_GRADER:')) deny('only assigned grader children allowed during production');
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
  function bootstrapDoc(name) {
    const match = /^Blender\/[^/]+\/(.+)$/.exec(name);
    return Boolean(match) && BOOTSTRAP_DOC.test(match[1]);
  }
  function canCommit(p) {
    harness.fresh(p);
    const c = p.change;
    if (!c?.verdict || !c.inspected || (p.records.workflow === 'Partially Autonomous' && !c.approval)) deny('finish review and required approval before committing');
    const staged = git(harness.root, ['diff', '--cached', '--name-only', '-z']).split('\0').filter(Boolean);
    const allowed = new Set([...c.paths, p.scene, c.renderPath, ...Object.keys(c.reports), `${p.project}/Documents/Reviews/${c.round}/manifest.json`, `${p.project}/Documents/Reviews/README.md`]);
    if (!staged.length || staged.some((name) => !allowed.has(name))) deny('index empty or contains unrelated files');
  }
  return {
    tool: {
      blender_workflow: {
        description: 'Mandatory Blender workflow gate. prepare, status, begin, ticket, grader-ticket, self-review, review, approval, checkpoint, recover, escalate. payload is JSON. Runtime owns approvals/evidence; never edit state.',
        args: { action: z.string(), payload: z.string().default('{}') },
        async execute(args, context) {
          const session = await identity(context.sessionID);
          if (session.parentID) deny('workflow control belongs to root orchestrator');
          const payload = JSON.parse(args.payload);
          if (!payload || typeof payload !== 'object' || Array.isArray(payload)) deny('payload must be JSON object');
          let result;
          if (args.action === 'prepare') result = harness.prepare(context.sessionID, payload);
          else if (args.action === 'ticket') {
            const p = stateFor(context.sessionID);
            if (!p) deny('no registered project for this session; call blender_workflow prepare and complete its registration question first');
            if (payload.operation === 'apply') operationCode(payload.payload, p.change?.objects ?? []);
            else if (stable(payload.payload) !== '{}') deny('save/seal payload must be empty object');
            result = harness.issue(context.sessionID, payload.operation, payload.payload);
          } else {
            if (!PUBLIC_ACTIONS.has(args.action)) deny('internal workflow action unavailable');
            result = args.action === 'recover' ? harness.recover(context.sessionID) : harness.command(context.sessionID, args.action, payload);
          }
          return JSON.stringify(result, null, 2);
        },
      },
    },
    async 'tool.execute.before'(input, output) {
      const tool = input.tool.replace(/^functions\./, '');
      const args = output.args ?? {};
      if (/execute_blender_code|import_asset|generate_3d/.test(tool)) deny('raw Blender mutation disabled; use ticketed harness_execute');
      if (tool === 'blender_harness_execute') {
        const session = await identity(input.sessionID);
        if (session.parentID) deny('only orchestrator may mutate Blender');
        harness.authorize(input.sessionID, args.token, args.operation, args.payload);
        return;
      }
      const p = stateFor(input.sessionID);
      const session = await identity(input.sessionID);
      if (session.parentID && harness.transaction((s) => Object.values(s.projects).some((p) => p.orchestrator === session.parentID))) {
        await childAssignment(input.sessionID);
        const assignment = harness.graderStep(input.sessionID, tool, args);
        if (['write', 'edit', 'apply_patch'].includes(tool)) {
          if (editPaths(tool, args).some((f) => relative(f) !== assignment.report)) deny('grader may write only assigned report');
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
          const registered = new Set(harness.transaction((s) => Object.keys(s.projects)));
          const blocked = files.filter((f) => f.startsWith('Blender/') && (!bootstrapDoc(f) || registered.has(f.split('/').slice(0, 2).join('/'))));
          if (blocked.length) deny(`production files require a registered project: ${blocked.join(', ')}. Before registration, write only scaffold documentation (README.md; Documents/REQUIREMENTS.md, WORKFLOW.md, REVIEW.md, ASSETS.md, DECISIONS.md; Documents/Goals/<NN>-<slug>.md). Commit those files, call blender_workflow prepare, and complete its registration question before scene, asset, render, evidence, and manifest writes. Do not bypass this with shell redirection or temp-file copies.`);
        }
        if (tool === 'bash' && /start-blender\.(?:cmd|ps1)|blender(?:\.exe)?(?:\s|$)/i.test(args.command ?? '') && !/ListBlender|--version/.test(args.command)) deny('register the committed project before launching Blender: finish and commit scaffold docs, then call blender_workflow prepare and complete its registration question');
        return;
      }
      if (tool === 'blender_workflow' || tool === 'question' || READ_ONLY.has(tool) || BLENDER_READ.has(tool) || tool.startsWith('context7_')) return;
      if (tool === 'goal') {
        if (args.action === 'start' && args.objective !== p.records.goalText) deny('goal objective must equal registered prompt');
        harness.fresh(p); return;
      }
      if (tool === 'goal_report') {
        if (args.status === 'complete') {
          if (p.change || p.history.at(-1)?.verdict !== 'PASS' || !p.lastRender || harness.hash(p.lastRender.path) !== p.lastRender.hash) deny('completion blocked by missing checkpoint/PASS/render');
          harness.assertCommitted(p.project, harness.snapshot(p.project));
        }
        return;
      }
      if (tool === 'task') {
        if (args.subagent_type !== 'blender-grader' || args.background || !/HARNESS_GRADER:[a-f0-9-]{36}/.test(args.prompt ?? '')) deny('production delegation requires foreground assigned grader');
        const token = args.prompt.match(/HARNESS_GRADER:([a-f0-9-]{36})/)[1];
        if (!p.change?.inspected || !Object.values(p.change.graders).some((g) => g.token === token)) deny('grader ticket missing');
        taskArgs.set(input.callID, args); return;
      }
      if (['write', 'edit', 'apply_patch'].includes(tool)) {
        const c = p.change;
        if (!c) deny('no open bounded change; call blender_workflow begin with one outcome, exact object names, and exact project-relative paths before writing project files');
        const allowed = new Set(c.paths);
        if (c.round) { allowed.add(`${p.project}/Documents/Reviews/${c.round}/REVIEW.md`); allowed.add(`${p.project}/Documents/Reviews/README.md`); }
        if (editPaths(tool, args).some((f) => !allowed.has(relative(f)) || /\.blend$|\/manifest\.json$|\/_evidence\/|\/REPORT\.md$|\.(png|jpg|exr)$/i.test(f))) deny('write outside the declared change scope or targets runtime-owned evidence/report paths; add the exact path to blender_workflow begin paths, or stop writing it');
        harness.fresh(p);
        return;
      }
      if (tool === 'bash') {
        const command = args.command ?? '';
        if (args.workdir && path.resolve(args.workdir) !== harness.root) deny('production Git/launch commands require workspace root');
        if (/[;&|`\r\n$<>]/.test(command)) deny('production shell accepts one literal command only');
        if (/^git status(?: --short)?(?: --branch)?$/.test(command) || /^git diff(?: --stat| --check| --cached| --name-only)*$/.test(command) || /^git log --oneline -10$/.test(command)) return;
        if (/^git add -- /.test(command)) {
          if (!p.change?.verdict || (p.records.workflow === 'Partially Autonomous' && !p.change.approval)) deny('review/approval required before staging');
          const tokens = [...command.slice('git add -- '.length).matchAll(/"([^"]+)"|'([^']+)'|(\S+)/g)].map((m) => m[1] ?? m[2] ?? m[3]);
          const c = p.change;
          const allowed = new Set([...c.paths, p.scene, c.renderPath, ...Object.keys(c.reports), `${p.project}/Documents/Reviews/${c.round}/manifest.json`, `${p.project}/Documents/Reviews/README.md`]);
          if (!tokens.length || tokens.some((name) => !allowed.has(relative(name)))) deny('stage exact scoped files only');
          return;
        }
        if (/^git commit -m (?:"[^"\r\n]+"|'[^'\r\n]+')$/.test(command)) { canCommit(p); return; }
        const launch = /^(?:\.\\|\.\/)?tools[\\/]start-blender\.cmd "(Blender[\\/][A-Za-z0-9 _-]+)"$/.exec(command);
        if (launch && launch[1].replaceAll('\\', '/') === p.project && !p.change) { harness.assertCommitted(p.project, harness.snapshot(p.project)); return; }
        deny('production shell route denied; use guarded tools or scoped Git checkpoint');
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
