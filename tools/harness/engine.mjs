import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { instanceStatus, launchProject, stopProject } from './blender.mjs';
import { describeDocumentFormats, documentOutline, documentSection, isBootstrapDocument, isBootstrapFile, validateDocument } from './documents.mjs';

export const digest = (data) => crypto.createHash('sha256').update(data).digest('hex');
export const normalizeGoal = (value) => typeof value === 'string' ? value.replace(/\r\n?/g, '\n').trim() : value;
const CHECKPOINT_EVERY = 20;
const CHANGE_WINDOW_MS = 900000;
const TICKET_TTL_MS = 10 * 60000;
const STRICT_MAX_OBJECTS = 20;
const TASKSTRACKER_DOCUMENT = 'Documents/TASKSTRACKER.md';
const LEGACY_TASKS_DOCUMENT = 'Documents/TASKS.md';
const canonical = (value) => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])])) : value;
export const stable = (value) => JSON.stringify(canonical(value));
export const deny = (message) => {
  throw new Error(`Workflow gate: ${message}. Next: call blender_workflow {action:"status"} and follow nextStep; never bypass the harness.`);
};
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const DOCS = ['README.md', 'Documents/REQUIREMENTS.md', 'Documents/WORKFLOW.md', 'Documents/REVIEW.md', 'Documents/ASSETS.md', 'Documents/DECISIONS.md'];

export function contained(root, relative, missing = false) {
  if (typeof relative !== 'string' || !relative || path.isAbsolute(relative) || relative.includes(':') || relative.includes('\0')) deny('relative path required');
  const full = path.resolve(root, relative);
  if (!full.startsWith(path.resolve(root) + path.sep)) deny('path escapes boundary');
  let current = root;
  for (const part of path.relative(root, full).split(path.sep)) {
    current = path.join(current, part);
    if (!fs.existsSync(current)) { if (missing) continue; deny(`missing path: ${relative}`); }
    if (fs.lstatSync(current).isSymbolicLink()) deny(`linked path rejected: ${relative}`);
  }
  return full;
}

function documentPath(root, requested) {
  if (typeof requested !== 'string' || !requested.trim()) deny('document path required');
  const absolute = path.isAbsolute(requested) ? path.resolve(requested) : path.resolve(root, requested);
  const clean = path.relative(root, absolute).replaceAll('\\', '/');
  if (!clean || clean.startsWith('..') || path.isAbsolute(clean)) deny('document path outside project');
  return { full: contained(root, clean, true), clean };
}

export function git(root, args, { binary = false, allowExitOne = false } = {}) {
  const result = spawnSync('git', args, { cwd: root, encoding: binary ? undefined : 'utf8', windowsHide: true, timeout: 30000, maxBuffer: 128 * 1024 * 1024 });
  if (result.error || (result.status !== 0 && !(allowExitOne && result.status === 1))) deny(`git ${args[0]} failed: ${result.error?.message ?? result.stderr?.toString().trim()}`);
  return binary ? result.stdout : result.stdout;
}
const gitText = (root, args) => git(root, args).trim();
function field(text, key) {
  const matches = [...text.matchAll(new RegExp(`^${key}:[ \\t]*([^\\r\\n]*)`, 'gm'))];
  if (matches.length !== 1) deny(`record needs exactly one ${key}`);
  return matches[0][1].trim();
}
function date(value) {
  const parsed = new Date(`${value}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

export class Harness {
  constructor(root, { stateRoot } = {}) {
    this.root = fs.realpathSync(root);
    this.home = stateRoot ?? path.join(os.homedir(), '.local', 'state', 'blender-workflow-harness', digest(this.root.toLowerCase()));
    fs.mkdirSync(this.home, { recursive: true, mode: 0o700 });
    if (fs.lstatSync(this.home).isSymbolicLink()) deny('linked state directory');
    this.file = path.join(this.home, 'state.json');
    this.lock = path.join(this.home, 'state.lock');
  }

  transaction(fn) {
    let fd;
    try { fd = fs.openSync(this.lock, 'wx', 0o600); }
    catch {
      let owner;
      try { owner = readJson(this.lock); } catch { deny('state locked; inspect owner before manual recovery'); }
      if (!Number.isInteger(owner?.pid) || owner.pid <= 0) deny('state lock owner is invalid; inspect before manual recovery');
      try { process.kill(owner.pid, 0); deny('state locked by a live writer; inspect owner before manual recovery'); }
      catch (error) {
        if (error?.message?.startsWith('Workflow gate:')) throw error;
        if (error?.code === 'EPERM') deny('state lock owner is live; inspect owner before manual recovery');
        try { fs.unlinkSync(this.lock); } catch { deny('state lock owner exited; manual recovery required'); }
        try { fd = fs.openSync(this.lock, 'wx', 0o600); } catch { deny('state lock changed during recovery; retry'); }
      }
    }
    try {
      fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, created: new Date().toISOString() }));
      const state = fs.existsSync(this.file) ? readJson(this.file) : { version: 1, projects: {}, tickets: {}, challenge: null };
      if (state.version !== 1) deny('unsupported state version');
      const result = fn(state);
      const temporary = `${this.file}.${crypto.randomUUID()}.tmp`;
      fs.writeFileSync(temporary, JSON.stringify(state, null, 2), { mode: 0o600 });
      fs.renameSync(temporary, this.file);
      return result;
    } finally { fs.closeSync(fd); fs.unlinkSync(this.lock); }
  }

  projectPath(project) {
    if (!/^Blender\/[A-Za-z0-9][A-Za-z0-9 _-]*$/.test(project ?? '')) deny('project must be Blender/<Name>');
    return contained(this.root, project);
  }
  hash(name) { return digest(fs.readFileSync(contained(this.root, name))); }
  taskDocument(p) {
    const tracker = `${p.project}/${TASKSTRACKER_DOCUMENT}`;
    const legacy = `${p.project}/${LEGACY_TASKS_DOCUMENT}`;
    return fs.existsSync(path.join(this.root, ...tracker.split('/'))) || !fs.existsSync(path.join(this.root, ...legacy.split('/'))) ? tracker : legacy;
  }
  head() { return gitText(this.root, ['rev-parse', 'HEAD']); }
  snapshot(project) {
    this.projectPath(project);
    const files = git(this.root, ['ls-files', '--others', '--cached', '--exclude-standard', '-z', '--', project]).split('\0').filter(Boolean);
    const result = {};
    for (const name of files) {
      const full = contained(this.root, name, true);
      if (fs.existsSync(full)) result[name] = gitText(this.root, ['hash-object', `--path=${name}`, full]);
    }
    return result;
  }
  assertCommitted(project, snapshot) {
    const names = git(this.root, ['ls-tree', '-r', '--name-only', '-z', 'HEAD', '--', project]).split('\0').filter(Boolean);
    const committed = Object.fromEntries(names.map((name) => [name, gitText(this.root, ['rev-parse', `HEAD:${name}`])]));
    if (!names.length || stable(committed) !== stable(snapshot) || gitText(this.root, ['status', '--porcelain', '--untracked-files=all', '--', project])) deny('commit missing or stale; commit exact scaffold/checkpoint first');
  }

  records(project, goal) {
    const base = this.projectPath(project);
    const docs = Object.fromEntries(DOCS.map((name) => [name, fs.readFileSync(contained(base, name), 'utf8')]));
    for (const [name, text] of Object.entries(docs)) {
      try { validateDocument(name, text); } catch (error) { deny(error.message); }
    }
    const req = docs['Documents/REQUIREMENTS.md'];
    const confirmation = field(req, 'Confirmation');
    if (field(req, 'Status') !== 'Confirmed' || !date(field(req, 'Confirmed')) || !/[\p{L}\p{N}]/u.test(confirmation) || /^(TBD|Pending|Unset|<.*>)$/i.test(confirmation)) deny('requirements not confirmed');
    const workflow = field(docs['Documents/WORKFLOW.md'], 'Mode');
    const review = field(docs['Documents/REVIEW.md'], 'Mode');
    if (!['Fully Autonomous', 'Partially Autonomous'].includes(workflow) || !date(field(docs['Documents/WORKFLOW.md'], 'Selected'))) deny('workflow not selected');
    if (!['Off', 'All', 'Single'].includes(review) || !date(field(docs['Documents/REVIEW.md'], 'Selected'))) deny('review not selected');
    if (!/^Documents\/Goals\/\d+-[a-z0-9-]+\.md$/.test(goal ?? '')) deny('invalid goal path');
    const goalText = fs.readFileSync(contained(base, goal), 'utf8');
    try { validateDocument(goal, goalText); } catch (error) { deny(error.message); }
    if (goalText.includes('{{') || goalText.trim().length < 100) deny('goal prompt not filled');
    let roster = [], maxParallel = 1, maxRounds = 2;
    if (review !== 'Off') {
      const config = readJson(contained(this.root, 'config.json'));
      const cfg = config.blender_subagents?.graders;
      if (config.blender_graders || config.workers || !cfg || cfg.enabled !== true || cfg.agent !== 'blender-grader' || !Array.isArray(cfg.graders) || !cfg.graders.length) deny('grader config missing, legacy, or disabled');
      const names = new Set();
      const graderSteps = this.agentSteps('blender-grader');
      for (const g of cfg.graders) {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(g.name ?? '') || names.has(g.name) || ['focus', 'provider', 'model', 'variant'].some((k) => typeof g[k] !== 'string' || !g[k].trim()) || !Number.isInteger(g.max_steps) || g.max_steps < 1 || g.max_steps > 12 || !Number.isInteger(g.max_minutes) || g.max_minutes < 1) deny('invalid grader roster');
        if (graderSteps && g.max_steps > graderSteps) deny('invalid grader roster');
        names.add(g.name);
      }
      if (!Number.isInteger(cfg.max_parallel) || cfg.max_parallel < 1 || cfg.max_parallel > names.size || !Number.isInteger(cfg.max_rounds) || cfg.max_rounds < 1 || cfg.max_rounds > 4) deny('invalid grader limits');
      roster = cfg.graders; maxParallel = cfg.max_parallel; maxRounds = cfg.max_rounds;
      if (review === 'Single') {
        roster = roster.filter((g) => g.name === field(docs['Documents/REVIEW.md'], 'Single grader'));
        if (roster.length !== 1) deny('unknown Single grader');
      }
    }
    const specs = Object.fromEntries(['Documents/REQUIREMENTS.md', 'Documents/WORKFLOW.md', 'Documents/REVIEW.md', goal].map((name) => [`${project}/${name}`, this.hash(`${project}/${name}`)]));
    return { workflow, review, roster, maxParallel, maxRounds, specs, goalText };
  }

  agentSteps(name) {
    const file = contained(this.root, `.kilo/agent/${name}.md`, true);
    if (!fs.existsSync(file)) return null;
    const steps = Number(/^steps:\s*(\d+)\s*$/m.exec(fs.readFileSync(file, 'utf8'))?.[1]);
    return Number.isInteger(steps) ? steps : null;
  }
  workerConfig() {
    const file = contained(this.root, 'config.json', true);
    if (!fs.existsSync(file)) deny('worker config missing; copy config.example.json and confirm it before delegation');
    const cfg = readJson(file).blender_subagents?.workers;
    if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg) || cfg.agent !== 'blender-worker'
      || ['provider', 'model', 'variant'].some((k) => typeof cfg[k] !== 'string' || !cfg[k].trim())) {
      deny('invalid worker config; validate blender_subagents.workers before delegation');
    }
    if (!Number.isInteger(cfg.max_minutes) || cfg.max_minutes < 1 || !Number.isInteger(cfg.max_steps) || cfg.max_steps < 1
      || !Number.isInteger(cfg.max_failed_attempts) || ![1, 2].includes(cfg.max_failed_attempts) || cfg.max_parallel !== 1) {
      deny('invalid worker limits; max_parallel must be 1');
    }
    const steps = this.agentSteps('blender-worker');
    if (steps && cfg.max_steps > steps) deny('worker max_steps exceeds agent steps ceiling');
    return { ...cfg };
  }
  owner(state, session) {
    const projects = Object.values(state.projects).filter((p) => p.orchestrator === session);
    if (projects.length !== 1) deny('register exactly one project for orchestrator session');
    return projects[0];
  }
  fresh(p) {
    const now = this.records(p.project, p.goal);
    if (stable(now) !== stable(p.records)) deny('spec, modes, goal, or roster changed; explicit re-registration required');
    const c = p.change;
    if (c?.sealed && this.hash(p.scene) !== c.sceneHash) deny('scene changed after sealing');
    for (const [name, hash] of Object.entries(c?.evidence ?? {})) if (this.hash(name) !== hash) deny(`stale evidence: ${name}`);
    for (const [name, hash] of Object.entries(c?.reports ?? {})) if (this.hash(name) !== hash) deny(`report changed after completion: ${name}`);
    if (c?.manifestHash && this.hash(c.manifestPath) !== c.manifestHash) deny('frozen review manifest changed');
  }
  writeTaskLedger(p) {
    const escape = (value) => String(value ?? '').replaceAll('|', '\\|').replace(/[\r\n]+/g, ' ').slice(0, 160);
    const folder = (task) => task.taskDoc ? `[${task.id}](Tasks/${task.id}/TASK.md)` : escape(task.id);
    const rows = (p.tasks ?? []).map((task) => {
      const objects = Array.isArray(task.objects) ? task.objects.length : 0;
      return `| ${folder(task)} | ${escape(task.kind ?? 'operation')} | ${escape(task.change)} | ${escape(task.operation)} | ${objects} | ${escape(task.worker)} | ${escape(task.child ?? '')} | ${escape(task.state)} | ${escape(task.created)} | ${escape(task.finished ?? '')} | ${escape(task.result ?? '')} |`;
    });
    const text = [
      `# Task Tracker — ${p.project.slice('Blender/'.length)}`,
      '',
      'Status: Active',
      `Last updated: ${new Date().toISOString()}`,
      '',
      '## Tasks',
      '',
      '| Task | Kind | Change | Operation | Objects | Assigned | Child | State | Created | Finished | Result |',
      '|---|---|---|---|---|---|---|---|---|---|---|',
      ...(rows.length ? rows : ['| — | — | — | — | — | — | — | — | — | — | — |']),
      '',
    ].join('\n');
    const full = contained(this.root, this.taskDocument(p), true);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, text);
  }
  ensureTaskLedger(p) {
    p.tasks ??= [];
    p.taskSeq ??= 0;
    const full = contained(this.root, this.taskDocument(p), true);
    if (!fs.existsSync(full)) this.writeTaskLedger(p);
  }
  documentLedger(session, args = {}) {
    return this.transaction((s) => {
      if (Object.keys(args).some((key) => key !== 'project')) deny('document ledger accepts project only');
      const p = this.owner(s, session);
      if (args.project && args.project !== p.project) deny('document ledger project mismatch');
      this.ensureTaskLedger(p);
      return {
        project: p.project, path: this.taskDocument(p), status: p.complete ? 'Complete' : 'Active',
        tasks: (p.tasks ?? []).map(({ token: _token, ...task }) => task),
      };
    });
  }
  taskDocPath(task) { return `Documents/Tasks/${task.id}/TASK.md`; }
  taskSummaryPath(task) { return `Documents/Tasks/${task.id}/SUMMARY.md`; }
  taskFiles(p, c) {
    return (p.tasks ?? []).filter((task) => task.change === c.id).flatMap((task) => [task.taskDoc, task.summaryDoc]).filter(Boolean);
  }
  writeTaskDocument(p, task) {
    const base = this.projectPath(p.project);
    const relative = this.taskDocPath(task);
    const full = contained(base, relative, true);
    const paths = Array.isArray(task.paths) ? task.paths : [];
    const objects = Array.isArray(task.objects) ? task.objects : [];
    const text = [
      `# ${task.id} — ${task.kind ?? 'operation'}`,
      '',
      `- Change: ${task.change}`,
      `- Operation: ${task.operation}`,
      `- State: ${task.state}`,
      `- Assigned: ${task.worker}`,
      `- Child session: ${task.child ?? ''}`,
      `- Created: ${task.created}`,
      `- Finished: ${task.finished ?? ''}`,
      `- Deadline: ${task.deadline ? new Date(task.deadline).toISOString() : ''}`,
      `- Token SHA-256: ${task.tokenHash}`,
      '',
      '## Objects',
      '',
      ...(objects.length ? objects.map((name) => `- ${name}`) : ['- —']),
      '',
      '## Paths',
      '',
      ...(paths.length ? paths.map((name) => `- ${name}`) : ['- —']),
      '',
      '## Operation Results',
      '',
      ...((task.operationResults ?? []).length
        ? task.operationResults.map((item) => `- ${item.index ?? '—'}: ${item.operation ?? '—'} ${item.ok ? 'ok' : `failed: ${item.error ?? 'unknown error'}`}`)
        : ['- —']),
      '',
    ].join('\n');
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, text);
    task.taskDoc = `${p.project}/${relative}`;
  }
  writeTaskSummary(p, task) {
    const base = this.projectPath(p.project);
    const relative = this.taskSummaryPath(task);
    const full = contained(base, relative, true);
    const text = [
      `# ${task.id} — Summary`,
      '',
      `- Change: ${task.change}`,
      `- Operation: ${task.operation}`,
      `- State: ${task.state}`,
      `- Child session: ${task.child ?? ''}`,
      `- Created: ${task.created}`,
      `- Finished: ${task.finished ?? ''}`,
      `- Result: ${task.result ?? ''}`,
      '',
      '## Operation Results',
      '',
      ...((task.operationResults ?? []).length
        ? task.operationResults.map((item) => `- ${item.index ?? '—'}: ${item.operation ?? '—'} ${item.ok ? 'ok' : `failed: ${item.error ?? 'unknown error'}`}`)
        : ['- —']),
      '',
    ].join('\n');
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, text);
    task.summaryDoc = `${p.project}/${relative}`;
  }
  recordTaskIssued(p, token, operation, payload) {
    this.ensureTaskLedger(p);
    const operations = operation === 'apply' && Array.isArray(payload?.operations) ? payload.operations : [payload];
    const taskObjects = (item) => {
      if (!item || typeof item !== 'object') return [];
      if (item.operation === 'shared_material') return Array.isArray(item.objects) ? item.objects : [];
      return [item.name, item.new_name, item.dof?.focus_object];
    };
    const objects = [...new Set(operations.flatMap(taskObjects).filter((name) => typeof name === 'string'))];
    const task = {
      id: `T${String(++p.taskSeq).padStart(3, '0')}`, kind: 'operation', change: p.change.id,
      operation: operation === 'apply' && operations.length > 1 ? `apply x${operations.length}` : operation,
      objects, paths: p.change.paths ? [...p.change.paths] : [], token, tokenHash: digest(token).slice(0, 12),
      worker: operation === 'apply' ? 'blender-worker' : 'orchestrator', child: '',
      state: 'issued', created: new Date().toISOString(), finished: '', result: '',
      deadline: p.change.deadline ?? null, operationResults: [],
    };
    p.tasks.push(task);
    this.writeTaskDocument(p, task);
    this.writeTaskLedger(p);
    return task;
  }
  recordGraderTask(p, token, name, report) {
    this.ensureTaskLedger(p);
    const task = {
      id: `G${String(++p.taskSeq).padStart(3, '0')}`, kind: 'grader', change: p.change.id,
      operation: `grader:${name}`, objects: [], paths: [report], token, tokenHash: digest(token).slice(0, 12),
      worker: name, child: '', state: 'issued', created: new Date().toISOString(), finished: '', result: '',
      deadline: p.change.deadline ?? null, operationResults: [],
    };
    p.tasks.push(task);
    this.writeTaskDocument(p, task);
    this.writeTaskLedger(p);
    return task;
  }
  recordTaskFinished(p, token, result) {
    const task = p.tasks?.find((item) => item.token === token);
    if (!task) return;
    task.state = result.ok ? 'done' : 'failed';
    task.finished = new Date().toISOString();
    task.operationResults = Array.isArray(result.operationResults) ? result.operationResults : [];
    task.result = result.ok ? (result.completed ? `ok (${result.completed} ops)` : 'ok') : `${result.completed ? `failed after ${result.completed} ops: ` : ''}${String(result.error ?? 'failed')}`.slice(0, 300);
    this.writeTaskDocument(p, task);
    this.writeTaskSummary(p, task);
    this.writeTaskLedger(p);
  }
  updateManifest(p, extra = {}) {
    const c = p.change;
    if (!c?.manifestPath) return;
    const full = contained(this.root, c.manifestPath);
    const manifest = readJson(full);
    Object.assign(manifest, extra, { tasks: c.graders, operation_tasks: (p.tasks ?? []).filter((task) => task.change === c.id).map(({ token: _token, ...task }) => task), verdict: c.verdict ?? null });
    const text = JSON.stringify(manifest, null, 2) + '\n';
    fs.writeFileSync(full, text);
    c.manifestHash = digest(text);
  }
  bootstrapDocument(session, args) {
    return this.transaction((s) => {
      if (Object.keys(args).some((key) => !['project', 'path', 'content'].includes(key))) deny('bootstrap-document accepts project, path and content only');
      const base = this.projectPath(args.project);
      const existing = s.projects[args.project];
      if (existing && (existing.orchestrator !== session || !existing.reregistering || existing.change)) deny('project already registered; use reregister before editing registration documents');
      if (s.challenge?.project === args.project && s.challenge.session !== session) deny('another session owns the pending registration');
      const full = contained(base, args.path, true);
      const clean = path.relative(base, full).replaceAll('\\', '/');
      if (!isBootstrapDocument(clean)) deny('bootstrap-document writes project markdown outside review artifacts only');
      try { validateDocument(clean, args.content); } catch (error) { deny(error.message); }
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, args.content);
      if (s.challenge?.project === args.project) s.challenge = null;
      return { project: args.project, path: clean, sha256: digest(args.content), next: 'Commit the exact scaffold with bootstrap-commit, then call prepare.' };
    });
  }
  bootstrapCommit(session, args) {
    return this.transaction((s) => {
      if (Object.keys(args).some((key) => !['project', 'message'].includes(key))) deny('bootstrap-commit accepts project and message only');
      this.projectPath(args.project);
      const existing = s.projects[args.project];
      if (existing && (existing.orchestrator !== session || !existing.reregistering || existing.change)) deny('project already registered; use the harness commit action inside a bounded change');
      if (s.challenge?.project === args.project && s.challenge.session !== session) deny('another session owns the pending registration');
      if (typeof args.message !== 'string' || !args.message.trim() || args.message.length > 200 || /[\r\n]/.test(args.message)) deny('one bounded commit message required');
      if (gitText(this.root, ['diff', '--cached', '--name-only'])) deny('index must be clean before bootstrap-commit');
      const snapshot = this.snapshot(args.project);
      if (existing?.reregistering && existing.scene && snapshot[existing.scene] !== existing.snapshot?.[existing.scene]) {
        deny('scene cannot change during re-registration; restore the checkpointed scene');
      }
      const entries = Object.keys(snapshot);
      const files = existing?.reregistering
        ? entries.filter((name) => name === existing.scene || isBootstrapFile(name.slice(args.project.length + 1)))
        : entries;
      if (!files.length) deny('no scaffold files found');
      const blocked = files.filter((name) => name !== existing?.scene && !isBootstrapFile(name.slice(args.project.length + 1)));
      if (blocked.length) deny(`bootstrap-commit only accepts scaffold documentation/metadata; remove or move: ${blocked.join(', ')}`);
      for (const name of files.filter((name) => name.endsWith('.md'))) {
        try { validateDocument(name.slice(args.project.length + 1), fs.readFileSync(contained(this.root, name), 'utf8')); }
        catch (error) { deny(error.message); }
      }
      git(this.root, ['add', '--', ...files]);
      if (!gitText(this.root, ['diff', '--cached', '--name-only'])) deny('no scaffold changes to commit');
      git(this.root, ['commit', '-m', args.message.trim()]);
      return { project: args.project, commit: this.head(), files: files.length, next: 'Call prepare and answer its exact registration question.' };
    });
  }
  prepare(session, args) {
    return this.transaction((s) => {
      if (Object.keys(args).some((k) => !['project', 'goal', 'scene'].includes(k))) deny('prepare accepts project, goal and scene only');
      const records = this.records(args.project, args.goal);
      const prior = s.projects[args.project];
      if (prior?.escalation?.maxRounds) records.maxRounds = Math.max(records.maxRounds, prior.escalation.maxRounds);
      if (!/^[A-Za-z0-9 _-]+\.blend$/.test(args.scene ?? '')) deny('scene must be project-root .blend filename');
      contained(this.projectPath(args.project), args.scene, true);
      const reRegister = Boolean((prior?.escalation?.requested || prior?.reregistering) && prior.orchestrator === session && !prior.change);
      if (s.challenge && Date.now() - s.challenge.created > 600000) s.challenge = null;
      if (s.challenge) {
        const c = s.challenge;
        if (c.session !== session) deny(`registration for ${c.project} is pending in another session; finish it there or wait 10 minutes for it to expire before preparing again`);
        const unchanged = c.project === args.project && c.goal === args.goal && c.scene === args.scene && this.head() === c.checkpoint && stable(this.snapshot(args.project)) === stable(c.snapshot) && stable(records) === stable(c.records);
        if (unchanged) return { question: c.question, labels: ['Confirm registration', 'Cancel'], details: { project: c.project, workflow: c.records.workflow, review: c.records.review, scene: c.scene, goal: c.goal } };
        s.challenge = null;
      }
      if (prior && !reRegister) deny('project already registered; use status to continue it, reregister a paused project, or escalate only after a capped review');
      if (Object.values(s.projects).some((p) => p.project === args.project && p.orchestrator !== session)) deny('project owned by another orchestrator');
      if (Object.values(s.projects).some((p) => p.orchestrator === session && p.project !== args.project)) deny('orchestrator already owns another project');
      const snapshot = this.snapshot(args.project);
      this.assertCommitted(args.project, snapshot);
      const question = `Register ${args.project}, scene ${args.scene}, goal ${args.goal}, workflow ${records.workflow}, review ${records.review}? HARNESS REGISTER ${crypto.randomUUID()}`;
      s.challenge = { ...args, records, session, question, snapshot, created: Date.now(), checkpoint: this.head(), reRegister, explicitReregister: Boolean(prior?.reregistering) };
      return { question, labels: ['Confirm registration', 'Cancel'], details: { project: args.project, workflow: records.workflow, review: records.review, scene: args.scene, goal: args.goal } };
    });
  }
  question(session, args, answers) {
    return this.transaction((s) => {
      const q = args.questions?.length === 1 ? args.questions[0] : null;
      if (!q || q.multiple === true || q.custom === true || !Array.isArray(answers) || answers.length !== 1 || !Array.isArray(answers[0]) || answers[0].length !== 1 || !q.options?.some((o) => o.label === answers[0][0])) return;
      if (s.challenge?.session === session && q.question === s.challenge.question) {
        const c = s.challenge;
        if (stable(q.options.map((o) => o.label)) !== stable(['Confirm registration', 'Cancel'])) deny('registration options changed');
        if (Date.now() - c.created > 600000) deny('registration expired');
        if (answers[0][0] !== 'Confirm registration') { s.challenge = null; return; }
        const current = this.records(c.project, c.goal);
        const prior = s.projects[c.project];
        if (c.reRegister && prior?.escalation?.maxRounds) current.maxRounds = Math.max(current.maxRounds, prior.escalation.maxRounds);
        if (stable(this.snapshot(c.project)) !== stable(c.snapshot) || stable(current) !== stable(c.records) || this.head() !== c.checkpoint) deny('registration facts changed');
        const existing = s.projects[c.project];
        if (c.reRegister) {
          if (!existing || existing.orchestrator !== session || existing.change || (!existing.escalation?.requested && !existing.reregistering)) deny('explicit re-registration is no longer valid');
          Object.assign(existing, { scene: `${c.project}/${c.scene}`, goal: c.goal, records: c.records, snapshot: c.snapshot, checkpoint: c.checkpoint, goalActive: false, change: null, complete: false, escalation: null, reregistering: false, lastRender: null });
        } else {
          s.projects[c.project] = { project: c.project, orchestrator: session, scene: `${c.project}/${c.scene}`, goal: c.goal, records: c.records, snapshot: c.snapshot, checkpoint: c.checkpoint, goalActive: false, change: null, history: [], complete: false, escalation: null };
        }
        s.challenge = null;
      } else {
        const p = Object.values(s.projects).find((p) => p.orchestrator === session && p.change?.approvalQuestion === q.question);
        if (!p) return;
        this.fresh(p);
        if (stable(q.options.map((o) => o.label)) !== stable(['Approve change', 'Request revision', 'Pause'])) deny('approval options changed');
        if (answers[0][0] === 'Approve change' && p.change.verdict !== 'PASS') deny('failed review cannot be approved; request revision or pause');
        p.change.approval = ['Approve change', 'Request revision'].includes(answers[0][0]) ? { label: answers[0][0], evidence: p.change.evidenceKey } : null;
      }
    });
  }
  wire(action, payload = {}) {
    return `blender_workflow {action:"${action}",payload:${JSON.stringify(JSON.stringify(payload))}}`;
  }
  nextStep(p, state) {
    const preparePayload = { project: p.project, goal: p.goal, scene: path.basename(p.scene) };
    if (p.escalation) return { phase: 'reregister', actor: 'orchestrator', action: 'prepare', command: this.wire('prepare', preparePayload), reason: 'Complete the exact registration question again with the escalated review cap.' };
    if (p.complete) return { phase: 'complete', actor: 'orchestrator', action: 'goal_report', command: 'goal_report {status:"complete",reason:<evidence>}', reason: 'The goal has a clean checkpoint and applicable PASS; report completion.' };
    if (!p.goalActive) return { phase: 'goal', actor: 'orchestrator', action: 'goal', command: 'goal {action:"start"|"resume",objective:<registered goal prompt>}', reason: 'Start or resume the registered goal before production work.' };
    const c = p.change;
    if (!c) {
      const prior = p.history.at(-1);
      const revision = Boolean(prior && (!['PASS', 'BOOTSTRAP', 'WIP', 'DOCUMENT'].includes(prior.verdict) || prior.approval === 'Request revision'));
      if (revision && prior.chain >= p.records.maxRounds) return { phase: 'escalate', actor: 'orchestrator', action: 'escalate', command: this.wire('escalate', { reason: '<why another bounded round is necessary>', max_rounds: 4 }), reason: 'The review cap is exhausted; escalate explicitly before another revision.' };
      return { phase: revision ? 'revision-begin' : 'begin', actor: 'orchestrator', action: 'begin', command: this.wire('begin', { outcome: '<one observable outcome>', objects: ['<exact object names>'], paths: ['<exact project-relative paths>'], ...(revision ? { revision: true } : {}) }), reason: revision ? 'The prior review did not pass; open a bounded revision with revision:true.' : 'Open one bounded change after the clean checkpoint.' };
    }
    if (c.pending) {
      const ticket = state?.tickets?.[c.pending];
      const operation = ticket?.operation ?? '<operation>';
      const payload = ticket?.payload ?? {};
      if (operation === 'apply') return { phase: 'apply', actor: 'blender-worker', action: 'blender_harness_execute', command: `blender_harness_execute {token:"${c.pending}",operation:"apply",payload:${JSON.stringify(JSON.stringify(payload))}}`, reason: 'Pass this one-shot apply ticket to blender-worker; the orchestrator must not execute it.' };
      return { phase: operation, actor: 'orchestrator', action: 'blender_harness_execute', command: `blender_harness_execute {token:"${c.pending}",operation:"${operation}",payload:"{}"}`, reason: `Execute the pending ${operation} ticket.` };
    }
    if (c.wip) return { phase: 'checkpoint', actor: 'orchestrator', action: 'checkpoint', command: this.wire('checkpoint', {}), reason: 'The WIP commit is preserved; checkpoint it before another begin.' };
    if (c.bootstrap && !c.saved) return { phase: 'bootstrap-save', actor: 'orchestrator', action: 'ticket', command: this.wire('ticket', { operation: 'save', payload: {} }), reason: 'Save the initial scene to the declared project-root .blend; never apply, seal, or grade the bootstrap save.' };
    if (c.bootstrap && c.saved && !c.operations) {
      return this.head() === c.base
        ? { phase: 'bootstrap-commit', actor: 'orchestrator', action: 'commit', command: this.wire('commit', { message: '<bounded bootstrap message>' }), reason: 'Close the bootstrap save with the harness commit, then checkpoint; never seal or grade the initial scene.' }
        : { phase: 'bootstrap-checkpoint', actor: 'orchestrator', action: 'checkpoint', command: this.wire('checkpoint', {}), reason: 'The bootstrap commit exists; checkpoint it before beginning scene work.' };
    }
    if (!c.sealed && c.operations >= CHECKPOINT_EVERY && (c.failure || Date.now() > c.deadline)) return { phase: 'wip', actor: 'orchestrator', action: 'commit', command: this.wire('commit', { message: 'wip: preserve failed or expired change', mode: 'wip' }), reason: 'The apply budget is exhausted and the change cannot be repaired; preserve it with a WIP commit, then checkpoint and begin a fresh change.' };
    if (!c.sealed && (c.failure || Date.now() > c.deadline)) return { phase: 'recover', actor: 'orchestrator', action: 'recover', command: this.wire('recover', { reopen: true }), reason: 'The change failed or its window expired; reopen it to repair, or commit {mode:"wip"} to preserve it.' };
    if (!c.sealed && c.reopen && !c.documentOnly) return { phase: 'apply', actor: 'blender-worker', action: 'ticket', command: this.wire('ticket', { operation: 'apply', payload: '<operation or {operations:[...]}>' }), reason: 'The change was reopened; issue a repair apply batch and delegate it to blender-worker.' };
    if (!c.sealed && c.documentOnly && c.operations === 0) {
      return this.head() === c.base
        ? { phase: 'commit', actor: 'orchestrator', action: 'commit', command: this.wire('commit', { message: '<one bounded document message>' }), reason: 'This is a document-only change; commit it without sealing or review, then checkpoint.' }
        : { phase: 'checkpoint', actor: 'orchestrator', action: 'checkpoint', command: this.wire('checkpoint', {}), reason: 'The document-only commit is ready; checkpoint it before another begin.' };
    }
    if (!c.sealed && c.operations === 0) return { phase: 'apply', actor: 'blender-worker', action: 'ticket', command: this.wire('ticket', { operation: 'apply', payload: '<operation or {operations:[...]}>' }), reason: 'Seal requires at least one apply ticket; issue one operation or a batch of up to 10 and delegate it to blender-worker.' };
    if (!c.sealed && c.strict && !c.readyToSeal) return { phase: 'apply', actor: 'blender-worker', action: 'ticket', command: this.wire('ticket', { operation: 'apply', payload: '<operation or {operations:[...]}>' }), reason: `Continue milestone "${c.milestone ?? c.outcome}", extend exact scope, or call finalize before sealing.` };
    if (!c.sealed && c.strict && (!c.wipRender || c.wipRender.operations !== c.operations)) return { phase: 'wip', actor: 'orchestrator', action: 'ticket', command: this.wire('ticket', { operation: 'wip', payload: {} }), reason: 'Render a WIP frame for the current apply state, then inspect it with blender_look.' };
    if (!c.sealed && c.strict && (!c.wipLook || c.wipLook.operations !== c.operations)) return { phase: 'wip-inspect', actor: 'orchestrator', action: 'blender_look', command: `blender_look {image:"${c.wipRender.path}"}`, reason: 'Inspect the exact WIP render before sealing the current apply state.' };
    if (!c.sealed) return { phase: 'seal', actor: 'orchestrator', action: 'ticket', command: this.wire('ticket', { operation: 'seal', payload: {} }), reason: 'Save and seal the changed scene, then inspect the returned render.' };
    if (!c.inspected) return { phase: 'inspect', actor: 'orchestrator', action: 'blender_look', command: `blender_look {image:"${c.renderPath}"}`, reason: 'Inspect the exact sealed render before review.' };
    if (!c.verdict) {
      if (p.records.review === 'Off') return { phase: 'self-review', actor: 'orchestrator', action: 'self-review', command: this.wire('self-review', { notes: '<what the sealed render proves>' }), reason: 'Record the required self-review after inspecting the sealed render.' };
      const missing = p.records.roster.find((g) => !c.graders[g.name]?.verdict)?.name ?? '<grader>';
      return { phase: 'grader-ticket', actor: 'orchestrator', action: 'grader-ticket', command: this.wire('grader-ticket', { name: missing }), reason: 'Dispatch every configured grader, then aggregate their reports.' };
    }
    if (c.verdict === 'BLOCKED' && c.blockingKind === 'tooling') {
      const blocked = p.records.roster.find((g) => c.graders[g.name]?.verdict === 'BLOCKED')?.name ?? '<grader>';
      return { phase: 'retry-grader', actor: 'orchestrator', action: 'grader-ticket', command: this.wire('grader-ticket', { name: blocked }), reason: 'This is a tooling/evidence block, not a design failure. Retry the blocked grader; do not open a scene revision.' };
    }
    if (p.records.workflow === 'Partially Autonomous' && !c.approval) return { phase: 'approval', actor: 'orchestrator', action: 'approval', command: this.wire('approval', {}), reason: 'Pause the goal and ask the exact approval question before committing this change.' };
    if (this.head() === c.base) return { phase: 'commit', actor: 'orchestrator', action: 'commit', command: this.wire('commit', { message: '<one bounded conventional message>' }), reason: 'Commit exactly the reviewed change and its harness artifacts.' };
    return { phase: 'checkpoint', actor: 'orchestrator', action: 'checkpoint', command: this.wire('checkpoint', {}), reason: 'Verify the exact scoped commit and close the change before another begin.' };
  }
  status(p, state) {
    const c = p.change;
    const step = this.nextStep(p, state);
    return { project: p.project, scene: p.scene, checkpoint: p.checkpoint, lastCommit: p.lastCommit ?? null, goalActive: p.goalActive, complete: p.complete, blender: instanceStatus(this.home),
       change: c ? { id: c.id, created: c.created ?? null, outcome: c.outcome, milestone: c.milestone ?? null, requirements: c.requirements ?? [], final: Boolean(c.final), strict: Boolean(c.strict), readyToSeal: Boolean(c.readyToSeal), paths: c.paths, saved: Boolean(c.saved), sealed: c.sealed, inspected: c.inspected, verdict: c.verdict, blockingKind: c.blockingKind ?? null, round: c.round, sceneHash: c.sceneHash, evidenceKey: c.evidenceKey, operations: c.operations, documentOnly: Boolean(c.documentOnly), appliesRemaining: Math.max(0, CHECKPOINT_EVERY - c.operations), deadlineRemainingMs: Math.max(0, c.deadline - Date.now()), failure: Boolean(c.failure), reopen: Boolean(c.reopen), wip: Boolean(c.wip), wipRender: c.wipRender ?? null, wipLook: c.wipLook ?? null, commits: c.commits ?? [], pending: c.pending ? 'operation in progress' : null, pendingTask: c.pending ? (p.tasks?.find((task) => task.token === c.pending)?.id ?? null) : null, approved: Boolean(c.approval), graders: c.graders } : null,
       next: step.reason, nextStep: step };
  }
  reregisterStatus(p) {
    const base = { project: p.project, scene: p.scene, checkpoint: p.checkpoint, goalActive: p.goalActive, complete: p.complete, blender: instanceStatus(this.home), change: null, reregistering: p.reregistering };
    try { this.records(p.project, p.goal); }
    catch (error) {
      return { ...base, next: `Fix the registration documents before preparing: ${error.message}`, nextStep: { phase: 'reregister-document', actor: 'orchestrator', action: 'bootstrap-document', command: this.wire('bootstrap-document', { project: p.project, path: '<invalid registration document>', content: '<complete format from capabilities.documentFormats>' }), reason: 'Fix registration documents through bootstrap-document while reregistering.' } };
    }
    try { this.assertCommitted(p.project, this.snapshot(p.project)); }
    catch {
      return { ...base, next: 'Commit the updated registration documents with bootstrap-commit.', nextStep: { phase: 'reregister-commit', actor: 'orchestrator', action: 'bootstrap-commit', command: this.wire('bootstrap-commit', { project: p.project, message: 'docs: update project registration' }), reason: 'Registration only accepts committed records.' } };
    }
    return { ...base, next: 'Call prepare and answer the new registration question.', nextStep: { phase: 'reregister-prepare', actor: 'orchestrator', action: 'prepare', command: this.wire('prepare', { project: p.project, goal: p.goal, scene: path.basename(p.scene) }), reason: 'The updated records are committed; confirm the new registration.' } };
  }
  bootstrapStatus(session, project, state) {
    if (!/^Blender\/[A-Za-z0-9][A-Za-z0-9 _-]*$/.test(project ?? '')) deny('project must be Blender/<Name>');
    if (!fs.existsSync(path.join(this.root, ...project.split('/')))) {
      const name = project.slice('Blender/'.length);
      return { project, registered: false, next: 'Scaffold the project folder with the workspace CLI.', nextStep: { phase: 'scaffold', actor: 'orchestrator', action: 'scaffold', command: `node tools/harness/cli.mjs scaffold --name "${name}"`, reason: 'The project folder does not exist yet.' } };
    }
    this.projectPath(project);
    const existing = Object.values(state.projects).find((p) => p.project === project);
    if (existing) {
      if (existing.orchestrator !== session) return { project, registered: true, next: 'Project is registered to another orchestrator session.', nextStep: { phase: 'owned', actor: 'other-session', action: null, command: null, reason: 'Do not take over a registered project.' } };
      return this.status(existing, state);
    }
    const challenge = state.challenge;
    if (challenge?.project === project) {
      if (challenge.session !== session) return { project, registered: false, next: 'Another session is registering this project; wait for it to finish or expire.', nextStep: { phase: 'registration-pending', actor: 'other-session', action: null, command: null, reason: 'Do not create a second registration challenge.' } };
      return { project, registered: false, next: 'Answer the exact pending registration question, then start or resume the goal.', nextStep: { phase: 'registration', actor: 'orchestrator', action: 'question', command: 'question {questions:[<returned registration question>]}', reason: 'Only the runtime answer grants registration.' } };
    }
    const base = this.projectPath(project);
    const goalsDirectory = path.join(base, 'Documents', 'Goals');
    const goals = fs.existsSync(goalsDirectory)
      ? fs.readdirSync(goalsDirectory).filter((name) => /^\d+-[a-z0-9-]+\.md$/.test(name)).sort()
      : [];
    const goal = goals.length === 1 ? `Documents/Goals/${goals[0]}` : null;
    if (!goal && goals.length) {
      return { project, registered: false, next: 'Select one existing goal path and call prepare.', nextStep: { phase: 'prepare', actor: 'orchestrator', action: 'prepare', command: this.wire('prepare', { project, goal: `Documents/Goals/${goals[0]}`, scene: '<project-root>.blend' }), reason: 'Registration accepts one existing goal; remove or archive extra goal documents.' } };
    }
    if (!goal) {
      return { project, registered: false, next: 'Create and fill Documents/Goals/01-<slug>.md through bootstrap-document.', nextStep: { phase: 'goal-document', actor: 'orchestrator', action: 'bootstrap-document', command: this.wire('bootstrap-document', { project, path: 'Documents/Goals/01-<slug>.md', content: '<filled goal markdown>' }), reason: 'Registration requires exactly one current goal document.' } };
    }
    try { this.records(project, goal); }
    catch (error) {
      return { project, registered: false, next: `Fix the project records through bootstrap-document: ${error.message}`, nextStep: { phase: 'bootstrap-document', actor: 'orchestrator', action: 'bootstrap-document', command: this.wire('bootstrap-document', { project, path: '<invalid project document>', content: '<complete format from capabilities.documentFormats>' }), reason: 'Document format and confirmed records must pass before registration.' } };
    }
    try { this.assertCommitted(project, this.snapshot(project)); }
    catch (error) {
      return { project, registered: false, next: 'Commit the exact scaffold documents and filled goal with bootstrap-commit.', nextStep: { phase: 'bootstrap-commit', actor: 'orchestrator', action: 'bootstrap-commit', command: this.wire('bootstrap-commit', { project, message: 'docs: scaffold <project>' }), reason: 'Registration only accepts a clean committed scaffold.' } };
    }
    return { project, registered: false, next: 'Call prepare and answer its exact registration question.', nextStep: { phase: 'prepare', actor: 'orchestrator', action: 'prepare', command: this.wire('prepare', { project, goal, scene: '<project-root>.blend' }), reason: 'The scaffold is committed and valid.' } };
  }
  documentRead(session, args, parentSession = null) {
    return this.transaction((s) => {
      if (Object.keys(args).some((key) => !['project', 'path', 'section'].includes(key))) deny('document read accepts project, path and section only');
      if (typeof args.path !== 'string' || !args.path.trim()) deny('document read requires a project-relative path');
      if (args.section !== undefined && typeof args.section !== 'string') deny('document section must be a heading string');
      const assignment = this.graderAssignment(s, session);
      const owned = Object.values(s.projects).find((p) => p.orchestrator === session);
      const parentOwned = parentSession ? Object.values(s.projects).find((p) => p.orchestrator === parentSession) : null;
      const registered = Object.values(s.projects).find((p) => p.project === args.project);
      if (registered && registered.orchestrator !== session && registered.orchestrator !== parentSession && !assignment) deny('document read requires the owning session');
      const p = assignment?.p ?? owned ?? parentOwned ?? registered ?? null;
      const project = p?.project ?? args.project;
      if (!project) deny('document read requires project before registration');
      if (p && args.project && args.project !== p.project) deny('document read project mismatch');
      const base = this.projectPath(project);
      const { full, clean } = documentPath(base, args.path);
      if (!/\.md$/i.test(clean)) deny('document read accepts project markdown only');
      if (assignment) {
        const allowed = new Set([...Object.keys(assignment.p.records.specs),
          `${assignment.p.project}/README.md`, `${assignment.p.project}/Documents/ASSETS.md`,
          `${assignment.p.project}/Documents/DECISIONS.md`, `${assignment.p.project}/Documents/REVIEW.md`,
          `${assignment.p.project}/${TASKSTRACKER_DOCUMENT}`, `${assignment.p.project}/${LEGACY_TASKS_DOCUMENT}`, `${assignment.p.project}/Documents/README.md`, assignment.g.report]);
        if (!allowed.has(`${project}/${clean}`)) deny('grader document read outside assigned spec documents');
      }
      if (!fs.existsSync(full)) deny(`project document missing: ${clean}`);
      const content = fs.readFileSync(full, 'utf8');
      const outline = documentOutline(clean, content);
      const result = { project, path: clean, ...outline };
      if (!outline.valid) result.next = 'Invalid document structure; fix the diagnostics through blender_document write using capabilities.documentFormats.';
      if (!args.section) return result;
      const section = documentSection(clean, content, args.section);
      if (!section) deny(`document section not found: ${args.section}; available: ${outline.sections.map((item) => item.heading).join(', ')}`);
      return { ...result, section };
    });
  }
  documentWrite(session, args) {
    const assignment = this.transaction((s) => this.graderAssignment(s, session));
    if (!assignment) {
      const { project: _project, ...documentArgs } = args;
      return this.command(session, 'document', documentArgs);
    }
    return this.transaction((s) => {
      const current = this.graderAssignment(s, session);
      if (!current) deny('grader document assignment missing');
      const { p, g } = current;
      if (Object.keys(args).some((key) => !['project', 'path', 'content'].includes(key))) deny('grader document write accepts project, path and content only');
      if (args.project && args.project !== p.project) deny('grader document write project mismatch');
      if (g.verdict || Date.now() > g.deadline) deny('grader document write outside the assigned pass budget');
      if (typeof args.path !== 'string' || typeof args.content !== 'string' || args.content.length > 1_000_000) deny('grader report path and bounded markdown content required');
      const base = this.projectPath(p.project);
      const { full, clean } = documentPath(base, args.path);
      if (`${p.project}/${clean}` !== g.report) deny('grader may write only its assigned report path');
      try { validateDocument(clean, args.content); } catch (error) { deny(error.message); }
      const verdicts = [...args.content.matchAll(/^- Verdict: (PASS|CHANGES_REQUIRED|BLOCKED)\s*$/gm)];
      if (verdicts.length !== 1) deny('grader report requires exactly one - Verdict: PASS|CHANGES_REQUIRED|BLOCKED line');
      if (!args.content.includes(p.change.sceneHash) || !args.content.includes(p.change.evidenceKey)) deny('grader report must cite the assigned scene hash and evidence key');
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, args.content);
      return { project: p.project, path: g.report, verdict: verdicts[0][1], bytes: args.content.length, next: 'Return the report facts; the orchestrator validates and aggregates.' };
    });
  }
  reviewPaths(p, c) {
    return [c.renderPath, ...Object.keys(c.reports), `${p.project}/Documents/Reviews/${c.round}/manifest.json`, `${p.project}/Documents/Reviews/README.md`, `${p.project}/Documents/REVIEW.md`];
  }
  commitProgress(p, c, task) {
    const expectedHead = c.commits?.at(-1) ?? c.base;
    if (this.head() !== expectedHead) deny('apply commit must directly follow the prior change commit');
    const files = [...new Set([...c.paths, p.scene, this.taskDocument(p), task.taskDoc, task.summaryDoc])]
      .filter((name) => typeof name === 'string' && fs.existsSync(path.join(this.root, ...name.split('/'))));
    git(this.root, ['add', '--', ...files]);
    if (!gitText(this.root, ['diff', '--cached', '--name-only'])) deny('no apply files changed');
    git(this.root, ['commit', '-m', `apply: ${task.id} ${String(c.outcome).slice(0, 120)}`]);
    c.commits ??= [];
    c.commits.push(this.head());
    p.lastCommit = this.head();
  }
  autoCommit(p, c, message, { review = true } = {}) {
    const expectedHead = c.commits?.at(-1) ?? c.base;
    if (this.head() !== expectedHead) deny('commit must directly follow the prior change commit');
    if (gitText(this.root, ['diff', '--cached', '--name-only'])) deny('index must be clean before the scoped commit');
    const artifacts = review ? this.reviewPaths(p, c) : [];
    const declared = new Set(c.paths);
    const taskDocument = this.taskDocument(p);
    const tracked = new Set(git(this.root, ['ls-files', '-z', '--', p.project]).split('\0').filter(Boolean));
    const files = [...new Set([...c.paths, p.scene, taskDocument, ...this.taskFiles(p, c), ...artifacts])]
      .filter((name) => typeof name === 'string' && (
        fs.existsSync(path.join(this.root, ...name.split('/')))
        || (declared.has(name) && name !== p.scene && name !== taskDocument && tracked.has(name))
      ));
    git(this.root, ['add', '--', ...files]);
    if (!gitText(this.root, ['diff', '--cached', '--name-only'])) deny('no review files changed');
    git(this.root, ['commit', '-m', message]);
    c.commits ??= [];
    c.commits.push(this.head());
    p.lastCommit = this.head();
    return p.lastCommit;
  }
  command(session, action, args = {}) {
    return this.transaction((s) => {
      if (action === 'status') {
        const projects = Object.values(s.projects).filter((p) => p.orchestrator === session);
        if (projects.length === 1) return projects[0].reregistering ? this.reregisterStatus(projects[0]) : this.status(projects[0], s);
        if (projects.length > 1) deny('session owns multiple projects; inspect workspace state before continuing');
        if (args.project) return this.bootstrapStatus(session, args.project, s);
        const pending = s.challenge?.session === session
          ? 'Answer the pending registration question, then start or resume the goal'
          : s.challenge ? `Another session is registering ${s.challenge.project}; wait for it to finish or expire`
            : 'Complete and commit scaffold docs, then call prepare and answer its registration question';
        return { project: null, scene: null, checkpoint: this.head(), goalActive: false, complete: false, change: null, blender: instanceStatus(this.home), next: pending, nextStep: { phase: 'unregistered', actor: 'orchestrator', action: 'status', command: 'blender_workflow {action:"status",payload:"{\\"project\\":\\"Blender/<Name>\\"}"}', reason: pending } };
      }
      const p = this.owner(s, session);
      if (action === 'pause') {
        if (Object.keys(args).some((key) => key !== 'reason') || typeof args.reason !== 'string' || !args.reason.trim() || args.reason.length > 1000) deny('pause requires one bounded reason');
        if (p.change) deny('close the open change with commit/checkpoint or WIP before pausing the project');
        p.goalActive = false;
        p.paused = { at: new Date().toISOString(), reason: args.reason.trim() };
        return this.status(p, s);
      }
      if (action === 'reregister') {
        if (Object.keys(args).some((key) => key !== 'reason') || typeof args.reason !== 'string' || !args.reason.trim() || args.reason.length > 1000) deny('reregister requires one bounded reason');
        if (p.reregistering) return this.reregisterStatus(p);
        if (p.change) deny('checkpoint or preserve the open change before re-registration');
        p.reregistering = { requested: Date.now(), reason: args.reason.trim() };
        p.goalActive = false;
        p.complete = false;
        p.escalation = null;
        p.lastRender = null;
        return this.reregisterStatus(p);
      }
      this.fresh(p);
      const c = p.change;
      if (action === 'goal-active') {
        if (p.complete || (args.objective !== undefined && normalizeGoal(args.objective) !== normalizeGoal(p.records.goalText))) deny('goal must match registered prompt');
        p.goalActive = true;
      } else if (action === 'goal-complete') {
        const last = p.history.at(-1);
        if (!p.goalActive || c || !last || !['PASS', 'DOCUMENT'].includes(last.verdict) || last.approval === 'Request revision' || this.hash(p.scene) !== last.sceneHash || !p.lastRender || this.hash(p.lastRender.path) !== p.lastRender.hash) deny('completion requires active goal, checkpoint, inspected render, unchanged scene and applicable PASS');
        if (p.history.some((item) => item.strict) && !last.final) deny('completion requires a final full-spec change after milestone reviews');
        this.assertCommitted(p.project, this.snapshot(p.project)); p.complete = true;
      } else if (action === 'escalate') {
        const prior = p.history.at(-1);
        if (c || p.complete || p.escalation || !prior || prior.verdict === 'BOOTSTRAP' || prior.chain < p.records.maxRounds || typeof args.reason !== 'string' || !args.reason.trim() || args.reason.length > 1000) deny('explicit escalation requires a completed capped review and a bounded reason');
        const maxRounds = args.max_rounds ?? p.records.maxRounds;
        if (!Number.isInteger(maxRounds) || maxRounds < 1 || maxRounds > 4 || maxRounds < p.records.maxRounds) deny('escalation may extend max_rounds up to 4');
        p.escalation = { requested: Date.now(), reason: args.reason, maxRounds };
      } else if (action === 'begin') {
         if (c || p.complete || p.escalation || !p.goalActive) deny('one open logical change per project; prior checkpoint and active goal required');
        if (typeof args.outcome !== 'string' || !args.outcome.trim() || args.outcome.length > 1000 || !Array.isArray(args.objects) || args.objects.length > 200 || args.objects.some((n) => typeof n !== 'string' || !/^[\x20-\x7e]{1,100}$/.test(n))) deny('bounded outcome and exact object names required');
        if (args.final !== undefined && typeof args.final !== 'boolean') deny('final must be boolean');
        const milestone = args.final === true ? 'final' : args.milestone === undefined ? null : args.milestone;
        if (milestone !== null && (typeof milestone !== 'string' || !milestone.trim() || milestone.length > 200)) deny('milestone must be a bounded non-empty string');
        if (args.requirements !== undefined && (!Array.isArray(args.requirements) || args.requirements.length > 50 || args.requirements.some((item) => typeof item !== 'string' || !item.trim()))) deny('requirements must be an array of non-empty strings');
        if (!Array.isArray(args.paths) || !args.paths.length || args.paths.length > 100) deny('exact project-relative file paths required');
        const paths = [...new Set(args.paths.map((name) => {
          const full = contained(this.projectPath(p.project), name, true);
          const clean = path.relative(this.projectPath(p.project), full).replaceAll('\\', '/');
          if (/\.(?:py|js|mjs|ts|cmd|ps1|exe|dll|blend\d*)$/i.test(clean) && `${p.project}/${clean}` !== p.scene) deny('production scope cannot add executable files');
          return `${p.project}/${clean}`;
        }))];
        if (stable(this.snapshot(p.project)) !== stable(p.snapshot)) deny('project changed since checkpoint');
        this.assertCommitted(p.project, p.snapshot);
        if (gitText(this.root, ['diff', '--cached', '--name-only'])) deny('index must be clean');
        const prior = p.history.at(-1);
         if (args.revision && !prior) deny('revision requires a prior completed review');
         if (args.revision && prior?.verdict === 'PASS' && prior.approval !== 'Request revision') deny('revision requires a failed review or recorded revision request');
         if (args.revision) {
           const review = `${p.project}/Documents/Reviews/${prior.round}/REVIEW.md`;
           if (!git(this.root, ['ls-files', '--', review]).trim()) deny('revision requires the committed verdict document from the prior round');
         }
         if (prior?.verdict !== undefined && !['PASS', 'BOOTSTRAP', 'WIP', 'DOCUMENT'].includes(prior.verdict) && !args.revision) deny('failed review permits correction only');
        const chain = args.revision ? (prior?.chain ?? 0) + 1 : 1;
        if (chain > p.records.maxRounds || prior?.approval === 'Request revision' && !args.revision) deny('review cap reached or user requested revision; explicit user escalation required');
        this.ensureTaskLedger(p);
        const sceneExists = fs.existsSync(path.join(this.root, p.scene));
        const strict = milestone !== null || args.requirements !== undefined;
        if (strict && args.objects.length > STRICT_MAX_OBJECTS) deny(`strict milestone changes are capped at ${STRICT_MAX_OBJECTS} objects; split the milestone`);
        p.change = {
          id: crypto.randomUUID(), created: Date.now(), outcome: args.outcome, milestone: milestone?.trim() ?? null,
          requirements: args.requirements ? [...new Set(args.requirements.map((item) => item.trim()))] : [],
          final: args.final === true, strict, objects: [...new Set(args.objects)], paths, base: this.head(), chain, operations: 0,
          deadline: Date.now() + CHANGE_WINDOW_MS, sealed: false, inspected: false, readyToSeal: !strict,
          wipRender: null, wipLook: null, commits: [], graders: {}, reports: {}, bootstrap: !sceneExists,
          documentOnly: paths.every((name) => /\.md$/i.test(name)), sceneHash: sceneExists ? this.hash(p.scene) : null,
        };
      } else if (action === 'extend') {
        if (!c || c.sealed || c.pending || c.documentOnly || c.readyToSeal) deny('extend requires an unsealed, unfinished scene change with no pending operation');
        if (args.objects !== undefined && (!Array.isArray(args.objects) || args.objects.length > 200 || args.objects.some((name) => typeof name !== 'string' || !/^[\x20-\x7e]{1,100}$/.test(name)))) deny('extend objects must be exact printable names');
        if (!Array.isArray(args.paths) || !args.paths.length || args.paths.length > 100) deny('extend requires exact project-relative paths');
        const added = [...new Set(args.paths.map((name) => {
          const full = contained(this.projectPath(p.project), name, true);
          const clean = path.relative(this.projectPath(p.project), full).replaceAll('\\', '/');
          if (/\.(?:py|js|mjs|ts|cmd|ps1|exe|dll|blend\d*)$/i.test(clean) && `${p.project}/${clean}` !== p.scene) deny('production scope cannot add executable files');
          return `${p.project}/${clean}`;
        }))];
        c.objects = [...new Set([...c.objects, ...(args.objects ?? [])])];
        c.paths = [...new Set([...c.paths, ...added])];
      } else if (action === 'finalize') {
        if (!c || c.sealed || c.pending || c.documentOnly) deny('finalize requires an unsealed scene change with no pending operation');
        if (!c.operations) deny('finalize requires at least one successful apply');
        c.readyToSeal = true;
      } else if (action === 'document') {
        if (!c || c.pending) deny('open change with no pending operation required');
        if (typeof args.path !== 'string' || !args.path.trim() || typeof args.content !== 'string' || args.content.length > 1_000_000) deny('document path and bounded markdown content required');
        const full = contained(this.projectPath(p.project), args.path, true);
        const clean = path.relative(this.projectPath(p.project), full).replaceAll('\\', '/');
        if (!/\.md$/i.test(clean) || clean.startsWith('Documents/Reviews/')) deny('document action writes project markdown outside runtime review artifacts only');
        if (!c.paths.includes(`${p.project}/${clean}`)) deny('document path must be declared in the open change paths');
        if (Object.hasOwn(p.records.specs, `${p.project}/${clean}`) || `${p.project}/${clean}` === `${p.project}/Documents/REVIEW.md`) deny('registration documents are frozen after registration; restore the committed version and stop for explicit re-registration');
        if (clean === TASKSTRACKER_DOCUMENT || clean === LEGACY_TASKS_DOCUMENT || clean.startsWith('Documents/Tasks/')) deny('the task tracker is harness-owned; it updates on ticket issue and completion');
        try { validateDocument(clean, args.content); } catch (error) { deny(error.message); }
        fs.mkdirSync(path.dirname(full), { recursive: true });
        fs.writeFileSync(full, args.content);
      } else if (action === 'self-review') {
        if (!c?.inspected || p.records.review !== 'Off' || !args.notes?.trim()) deny('inspect sealed render before self-review');
        c.verdict = 'PASS'; c.notes = args.notes;
        const name = `${p.project}/Documents/Reviews/${c.round}/REVIEW.md`;
        const text = `# Orchestrator Self-review\n\nVerdict: PASS\nScene SHA-256: ${c.sceneHash}\nEvidence key: ${c.evidenceKey}\n\n${args.notes}\n`;
        fs.writeFileSync(contained(this.root, name, true), text, { flag: 'wx' });
        c.reports[name] = digest(text);
        this.updateManifest(p);
      } else if (action === 'grader-ticket') {
        if (!c?.inspected || p.records.review === 'Off') deny('sealed inspection required before grader dispatch');
        const g = p.records.roster.find((g) => g.name === args.name);
        if (!g) deny('unknown grader');
        const toolingBlocked = c.verdict === 'BLOCKED' && c.blockingKind === 'tooling';
        if (c.verdict && !toolingBlocked) deny('review already aggregated; begin a revision before re-dispatching graders');
        if (toolingBlocked) { c.verdict = null; c.blockingKind = null; }
        const existing = c.graders[g.name];
        const attempt = existing ? (existing.attempt ?? 1) : 0;
        const retryable = existing && (existing.error || existing.kind === 'tooling' || existing.verdict === 'BLOCKED' || (!existing.verdict && Date.now() > existing.deadline));
        if (existing && !retryable) deny('grader already dispatched');
        if (retryable && attempt >= 2) deny('grader retry budget exhausted; aggregate the round as blocked');
        if (Object.values(c.graders).filter((g) => !g.verdict && !g.error && Date.now() <= g.deadline).length >= p.records.maxParallel) deny('grader parallel limit reached');
        const token = crypto.randomUUID();
        const report = existing?.report ?? `${p.project}/Documents/Reviews/${c.round}/${g.name}/REPORT.md`;
        fs.mkdirSync(path.dirname(contained(this.root, report, true)), { recursive: true });
        const full = contained(this.root, report, true);
        if (fs.existsSync(full)) fs.rmSync(full);
        const deadline = Date.now() + g.max_minutes * 60000;
        c.graders[g.name] = { token, report, attempt: attempt + 1, deadline, steps: 0 };
        const task = this.recordGraderTask(p, token, g.name, report);
        this.updateManifest(p);
        const absolute = (name) => path.join(this.root, ...name.split('/'));
        const evidenceFiles = Object.keys(c.evidence ?? {});
        for (const name of evidenceFiles) {
          if (!fs.existsSync(absolute(name)) || this.hash(name) !== c.evidence[name]) deny(`frozen evidence missing or changed: ${name}`);
        }
        const evidenceLines = evidenceFiles.map((name) => `- ${absolute(name)} (sha256 ${c.evidence[name]})`);
        const manifestPath = absolute(c.manifestPath);
        if (!fs.existsSync(manifestPath)) deny('frozen review manifest missing');
        const reportPath = absolute(report);
        const dirty = gitText(this.root, ['status', '--porcelain', '--', p.project]) ? 'dirty' : 'clean';
        const prompt = [
          `HARNESS_GRADER:${token}`,
          `Round: ${c.round}`,
          `Project root: ${this.root}`,
          `Grader name / focus: ${g.name} / ${g.focus}`,
          `Milestone: ${c.milestone ?? c.outcome}`,
          `Requirements to grade: ${c.requirements?.length ? c.requirements.join(', ') : 'all requirements in the spec'}`,
          `Final full-spec review: ${c.final ? 'yes' : 'no'}`,
          `Spec: ${Object.keys(p.records.specs).map(absolute).join(', ')}`,
          `Target: base ${c.base}, saved scene SHA-256 ${c.sceneHash}, project ${dirty}`,
          `Evidence key: ${c.evidenceKey}`,
          'Evidence files (read these exact paths):',
          ...evidenceLines,
          `Manifest: ${manifestPath}`,
          `Report path: ${reportPath}`,
          `Prior round: ${p.history.at(-1)?.round ?? 'none'}`,
          'Live inspection: not allowed',
          'User prompt: <verbatim user words for permitted live Blender calls>',
          'Prior findings / dispositions: <orchestrator-supplied re-review context or none>',
          `Budget: ${g.max_minutes} minutes, ${g.max_steps} steps`,
          `Deadline UTC / rounds already used: ${new Date(deadline).toISOString()}`,
          'Stop: missing evidence/spec, out-of-folder path, scene edit request, budget reached',
          'Output: verdict, findings, <= 20 lines',
        ].join('\n');
        return { token, marker: `HARNESS_GRADER:${token}`, grader: g, report, reportPath, evidenceFiles: evidenceLines, prompt, taskId: task.id,
          sceneHash: c.sceneHash, evidenceKey: c.evidenceKey, evidence: c.evidence, round: c.round, goal: `${p.project}/${p.goal}` };
      } else if (action === 'review') {
        if (!c?.inspected || p.records.review === 'Off' || c.verdict) deny('sealed inspection required once before review');
        if (!args.notes?.trim() || !args.reason?.trim() || !args.dispositions?.trim()) deny('review requires notes, correction/no-correction reasoning, and finding dispositions');
        for (const roster of p.records.roster) {
          const g = c.graders[roster.name];
          if (g && !g.verdict && (g.error || Date.now() > g.deadline)) {
            g.verdict = 'BLOCKED';
            g.error ??= `grader deadline exceeded before collection: ${roster.name}`;
          }
        }
        if (p.records.roster.some((g) => !c.graders[g.name]?.verdict)) deny('required grader reports incomplete');
        const verdicts = Object.values(c.graders).map((g) => g.verdict);
        c.verdict = verdicts.every((v) => v === 'PASS') ? 'PASS' : verdicts.includes('BLOCKED') ? 'BLOCKED' : 'CHANGES_REQUIRED';
        c.blockingKind = c.verdict === 'BLOCKED' ? 'tooling' : null;
        const name = `${p.project}/Documents/Reviews/${c.round}/REVIEW.md`;
        const text = [
          '# Review aggregate',
          `Verdict: ${c.verdict}`,
          `Scene SHA-256: ${c.sceneHash}`,
          `Evidence key: ${c.evidenceKey}`,
          '',
          '## Inspection notes',
          args.notes.trim(),
          '',
          '## Reason',
          args.reason.trim(),
          '',
          '## Finding dispositions',
          args.dispositions.trim(),
          '',
          '## Grader verdicts',
          ...Object.entries(c.graders).map(([grader, g]) => `- ${grader}: ${g.verdict}${g.error ? ` (${g.error})` : ''}`),
          '',
        ].join('\n');
        fs.writeFileSync(contained(this.root, name, true), text);
        c.reports[name] = digest(text); c.notes = args.notes; c.reason = args.reason; c.dispositions = args.dispositions;
        this.updateManifest(p);
        if (p.records.workflow === 'Fully Autonomous' && c.verdict !== 'BLOCKED') this.autoCommit(p, c, `review: ${c.round} ${c.verdict}`);
      } else if (action === 'commit') {
        if (!c || c.pending) deny('open change with no pending operation required');
        if (typeof args.message !== 'string' || !args.message.trim() || args.message.length > 200 || /[\r\n]/.test(args.message)) deny('one bounded commit message required');
        if (args.mode !== undefined && args.mode !== 'wip') deny('commit mode must be wip when provided');
        const bootstrap = Boolean(c.bootstrap && c.saved && !c.sealed && !c.operations);
        const documentOnly = Boolean(c.documentOnly && c.operations === 0 && this.hash(p.scene) === c.sceneHash);
        if (args.mode === 'wip') {
          if (!c.failure && Date.now() <= c.deadline) deny('WIP commit requires a failed or expired change');
          if (c.verdict) deny('reviewed changes use the normal commit path');
          this.autoCommit(p, c, args.message.trim(), { review: false });
          c.wip = true;
          c.verdict = 'WIP';
        } else {
          if (!bootstrap && !documentOnly && !c.verdict) deny('complete review before committing the change');
          this.autoCommit(p, c, args.message.trim(), { review: !bootstrap && !documentOnly });
        }
      } else if (action === 'approval') {
        if (!c?.verdict || p.records.workflow !== 'Partially Autonomous') deny('complete review before approval');
        c.approvalQuestion ??= `${c.outcome} Review verdict: ${c.verdict}. Approve change or request revision? HARNESS CHANGE ${c.id} ${c.evidenceKey}`;
        return { question: c.approvalQuestion, labels: ['Approve change', 'Request revision', 'Pause'], outcome: c.outcome, verdict: c.verdict };
      } else if (action === 'checkpoint') {
        if (!c) deny('no open change to checkpoint');
        const bootstrap = Boolean(c.bootstrap && c.saved && !c.sealed && !c.operations);
        const wip = Boolean(c.wip);
        const documentOnly = Boolean(c.documentOnly && c.operations === 0 && this.hash(p.scene) === c.sceneHash);
        const failedReview = c.verdict && !['PASS', 'WIP'].includes(c.verdict);
        if (c.verdict === 'BLOCKED' && c.blockingKind === 'tooling') deny('retry the tooling-blocked grader before checkpoint');
        const partialApprovalRequired = p.records.workflow === 'Partially Autonomous' && !documentOnly && (!c.approval || c.approval.evidence !== c.evidenceKey);
        if (!bootstrap && !wip && !documentOnly && (!c.verdict || !c.inspected || c.pending || (failedReview && p.records.workflow === 'Partially Autonomous' && c.approval?.label !== 'Request revision') || partialApprovalRequired)) deny('review and runtime-captured approval required before checkpoint');
        if (this.head() === c.base) deny('commit missing; commit exact scoped files first');
        if (!c.strict && gitText(this.root, ['rev-parse', 'HEAD^']) !== c.base) deny('checkpoint must be exactly one commit after change base');
        const changed = c.strict
          ? gitText(this.root, ['diff', '--name-only', `${c.base}..HEAD`]).split(/\r?\n/).filter(Boolean)
          : git(this.root, ['diff-tree', '--no-commit-id', '--name-only', '-r', '-z', 'HEAD']).split('\0').filter(Boolean);
        const reviewed = bootstrap || wip || documentOnly ? [] : this.reviewPaths(p, c);
        const allowed = new Set([...c.paths, p.scene, this.taskDocument(p), ...reviewed, ...this.taskFiles(p, c)]);
        const taskPrefix = `${p.project}/Documents/Tasks/`;
        if (!changed.length || changed.some((name) => !allowed.has(name) && !name.startsWith(taskPrefix))) deny('commit contains files outside bounded change');
        for (const name of [p.scene, ...reviewed]) {
          if (!gitText(this.root, ['ls-files', '--error-unmatch', '--', name])) deny('required deliverable missing from checkpoint');
        }
        const snapshot = this.snapshot(p.project); this.assertCommitted(p.project, snapshot);
        p.history.push({ id: c.id, round: c.round ?? null, verdict: bootstrap ? 'BOOTSTRAP' : wip ? 'WIP' : documentOnly ? 'DOCUMENT' : c.verdict, commit: this.head(), sceneHash: c.sceneHash, chain: c.chain, strict: Boolean(c.strict), final: Boolean(c.final), approval: c.approval?.label ?? null });
        p.checkpoint = this.head(); p.snapshot = snapshot;
        if (!bootstrap && !wip && !documentOnly && c.verdict === 'PASS') p.lastRender = { path: c.renderPath, hash: this.hash(c.renderPath) };
        p.change = null;
      } else deny(`unknown action: ${action}`);
      return this.status(p, s);
    });
  }

  launch(session) {
    const p = this.transaction((s) => {
      const owner = this.owner(s, session);
      this.fresh(owner);
      if (owner.complete || !owner.goalActive) deny('launch requires the registered project with an active goal');
      if (!owner.change) this.assertCommitted(owner.project, this.snapshot(owner.project));
      return { project: owner.project, scene: owner.scene };
    });
    return launchProject({ root: this.root, home: this.home, project: p.project, scene: p.scene, session });
  }
  stop(session) {
    const p = this.transaction((s) => {
      const owner = this.owner(s, session);
      return { project: owner.project };
    });
    return stopProject({ root: this.root, home: this.home, project: p.project });
  }
  issue(session, operation, payload) {
    return this.transaction((s) => {
      const p = this.owner(s, session); this.fresh(p);
      const c = p.change;
        if (!c || c.sealed || c.pending || !p.goalActive || (operation === 'apply' && (c.failure || Date.now() > c.deadline || c.operations >= CHECKPOINT_EVERY))) deny('open bounded change required; save/seal remains available after budget or failure');
      if (operation === 'apply' && c.bootstrap) deny('bootstrap change accepts save only; save the scene, commit, checkpoint, then begin a scene change');
      if (operation === 'apply' && c.documentOnly) deny('document-only changes cannot apply scene operations; begin a scene change');
      if (operation === 'seal' && c.bootstrap) deny('bootstrap save cannot be sealed or graded; commit the saved scene and call checkpoint, then begin a scene change');
      if (operation === 'seal' && c.documentOnly) deny('document-only changes commit without sealing or review');
      if (operation === 'wip' && (c.bootstrap || c.documentOnly || !c.operations || c.sealed)) deny('WIP render requires an unsealed scene change with at least one apply');
      if (operation === 'seal' && c.strict && !c.readyToSeal) deny('finalize the declared milestone before sealing');
      if (operation === 'seal' && c.strict && (!c.wipLook || c.wipLook.operations !== c.operations)) deny('seal requires a WIP render and blender_look receipt from the current apply state');
      if (operation === 'seal' && c.operations === 0 && !c.failure && Date.now() <= c.deadline) deny('seal requires at least one apply operation; document-only changes commit without sealing');
      if (!['apply', 'save', 'seal', 'wip'].includes(operation)) deny('unknown operation');
      const token = crypto.randomUUID();
      s.tickets[token] = { session, project: p.project, change: c.id, operation, payload, created: Date.now(), state: 'issued' };
      c.pending = token;
      const task = this.recordTaskIssued(p, token, operation, payload);
      return { token, operation, payload, taskId: task.id };
    });
  }
  authorize(session, token, operation, payload) {
    return this.transaction((s) => {
      const t = s.tickets[token];
      if (!t || t.session !== session || t.state !== 'issued' || t.operation !== operation || stable(t.payload) !== stable(payload) || Date.now() - t.created > TICKET_TTL_MS) deny('missing, stale, forged or replayed operation ticket');
      t.state = 'authorized';
    });
  }
  consume(token, operation, payload) {
    return this.transaction((s) => {
      const t = s.tickets[token];
      if (!t || t.state !== 'authorized' || t.operation !== operation || stable(t.payload) !== stable(payload) || Date.now() - t.created > TICKET_TTL_MS) deny('Kilo hook authorization missing or stale');
      const p = s.projects[t.project]; this.fresh(p);
      if (p.change?.id !== t.change || p.change.pending !== token) deny('ticket change mismatch');
      if (operation === 'apply' && (Date.now() > p.change.deadline || p.change.operations >= CHECKPOINT_EVERY)) deny('apply budget exhausted; seal, review, commit and checkpoint before more edits');
      t.state = 'running'; t.pid = process.pid;
      return { project: p.project, scene: p.scene, goal: p.goal, previousRound: p.history.at(-1)?.round ?? null, change: structuredClone(p.change), records: p.records,
        operationTasks: (p.tasks ?? []).filter((task) => task.change === p.change.id).map(({ token: _token, ...task }) => task) };
    });
  }
  finish(token, result) {
    return this.transaction((s) => {
      const t = s.tickets[token];
      if (!t || t.state !== 'running') deny('operation receipt has no running ticket');
      const p = s.projects[t.project], c = p.change;
      t.state = result.ok ? 'done' : 'failed'; delete c.pending;
       if (!result.ok) {
         c.failure = result.completed ? `Failed after ${result.completed} completed operation(s): ${result.error}` : result.error;
         c.deadline = 0;
         if (result.completed) { c.saved = true; c.sceneHash = this.hash(p.scene); }
         if (result.round) c.failedRounds = [...new Set([...(c.failedRounds ?? []), result.round])];
         this.recordTaskFinished(p, token, result);
         return;
       }
        if (t.operation === 'apply') { delete c.failure; delete c.reopen; c.operations++; c.deadline = Date.now() + CHANGE_WINDOW_MS; c.saved = true; c.sceneHash = this.hash(p.scene); }
       else if (t.operation === 'save') { c.saved = true; c.sceneHash = this.hash(p.scene); }
       else if (t.operation === 'wip') {
         c.saved = true; c.sceneHash = this.hash(p.scene);
         c.wipRender = { path: result.renderPath, hash: this.hash(result.renderPath), at: new Date().toISOString(), operations: c.operations };
         c.wipLook = null;
         delete c.failure; delete c.reopen; c.deadline = Date.now() + CHANGE_WINDOW_MS;
       } else {
        c.sealed = true; c.saved = true; c.sceneHash = this.hash(p.scene);
        delete c.failure; delete c.reopen; c.deadline = Date.now() + CHANGE_WINDOW_MS;
        c.round = result.round; c.renderPath = result.renderPath; c.evidence = result.evidence;
        c.evidenceKey = digest(stable({ scene: c.sceneHash, specs: p.records.specs, evidence: c.evidence }));
        c.manifestPath = `${p.project}/Documents/Reviews/${c.round}/manifest.json`;
        c.manifestHash = this.hash(c.manifestPath);
      }
      this.recordTaskFinished(p, token, result);
      if (t.operation === 'apply' && c.strict) {
        const task = p.tasks?.find((item) => item.token === token);
        if (task) this.commitProgress(p, c, task);
      }
      if (t.operation === 'seal' && c.manifestPath) this.updateManifest(p);
      return this.status(p, s);
    });
  }
  graderAssignment(state, child) {
    for (const p of Object.values(state.projects)) {
      for (const [name, g] of Object.entries(p.change?.graders ?? {})) if (g.child === child) return { p, name, g };
    }
    return null;
  }
  bindWorker(orchestrator, child, prompt = '') {
    return this.transaction((s) => {
      const p = this.owner(s, orchestrator);
      const tokens = [...String(prompt).matchAll(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi)].map((match) => match[0]);
      const task = p.tasks?.find((item) => tokens.includes(item.token)) ?? p.tasks?.find((item) => item.token === p.change?.pending);
      if (!task || task.operation === 'save' || task.operation === 'seal' || task.operation === 'wip') return;
      task.child = child;
      this.writeTaskDocument(p, task);
      this.writeTaskLedger(p);
    });
  }
  bindGrader(orchestrator, child, prompt, model) {
    return this.transaction((s) => {
      const p = this.owner(s, orchestrator); this.fresh(p);
      const c = p.change;
      if (!c?.inspected) deny('grader child requires inspected frozen evidence');
      const match = prompt.match(/HARNESS_GRADER:([a-f0-9-]{36})/);
      const entry = Object.entries(c.graders).find(([, g]) => g.token === match?.[1]);
      if (!entry || (entry[1].child && entry[1].child !== child)) deny('grader assignment missing or already owned');
      const cfg = p.records.roster.find((g) => g.name === entry[0]);
      if (model.providerID !== cfg.provider || model.modelID !== cfg.model || model.variant !== cfg.variant) deny('grader runtime model does not match configured roster');
      entry[1].child = child;
      const task = p.tasks?.find((item) => item.token === entry[1].token);
      if (task) {
        task.child = child;
        task.state = 'running';
        this.writeTaskDocument(p, task);
        this.writeTaskLedger(p);
      }
      this.updateManifest(p);
    });
  }
  failGraderByToken(orchestrator, token, error) {
    return this.transaction((s) => {
      const p = this.owner(s, orchestrator); this.fresh(p);
      const entry = Object.entries(p.change?.graders ?? {}).find(([, g]) => g.token === token);
      if (!entry) return;
      const g = entry[1];
      if (g.verdict) return;
      g.verdict = 'BLOCKED'; g.error = String(error ?? 'grader task failed'); g.kind = 'tooling';
      const task = p.tasks?.find((item) => item.token === token);
      if (task) this.recordTaskFinished(p, token, { ok: false, error: g.error });
      this.updateManifest(p);
    });
  }
  graderStep(child, tool, args) {
    return this.transaction((s) => {
      const assignment = this.graderAssignment(s, child);
      if (!assignment) deny('grader session has no bound assignment');
      const { p, g, name } = assignment;
      this.fresh(p);
      const cfg = p.records.roster.find((v) => v.name === name);
      const reportWrite = tool === 'blender_document' && args?.action === 'write';
      if (g.verdict || Date.now() > g.deadline || (!reportWrite && ++g.steps > cfg.max_steps)) deny('grader pass budget exhausted');
      this.updateManifest(p);
      return { project: p.project, report: g.report, sceneHash: p.change.sceneHash, evidenceKey: p.change.evidenceKey };
    });
  }
  collectGrader(orchestrator, child) {
    return this.transaction((s) => {
      const assignment = this.graderAssignment(s, child);
      if (!assignment || assignment.p.orchestrator !== orchestrator) deny('completed task has no assigned grader');
      const { p, g } = assignment; this.fresh(p);
      const fail = (error) => {
        g.verdict = 'BLOCKED'; g.error = error; g.kind = 'tooling';
        const task = p.tasks?.find((item) => item.token === g.token);
        if (task) this.recordTaskFinished(p, g.token, { ok: false, error });
        this.updateManifest(p); return this.status(p, s);
      };
      const full = contained(this.root, g.report, true);
      if (!fs.existsSync(full)) return fail(`grader report missing: ${g.report}`);
      const text = fs.readFileSync(full, 'utf8');
      const verdicts = [...text.matchAll(/^- Verdict: (PASS|CHANGES_REQUIRED|BLOCKED)\s*$/gm)];
      if (verdicts.length !== 1 || !text.includes(p.change.sceneHash) || !text.includes(p.change.evidenceKey)) return fail(`grader report invalid: ${g.report}`);
      if (verdicts[0][1] === 'PASS' && /\|\s*(blocker|major)\s*\|/i.test(text)) return fail(`PASS report contains blocker/major finding: ${g.report}`);
      g.verdict = verdicts[0][1];
      g.kind = g.verdict === 'BLOCKED' ? 'tooling' : 'review';
      p.change.reports[g.report] = digest(text);
      const task = p.tasks?.find((item) => item.token === g.token);
      if (task) this.recordTaskFinished(p, g.token, { ok: g.verdict !== 'BLOCKED', error: g.verdict === 'BLOCKED' ? 'grader returned BLOCKED' : undefined });
      this.updateManifest(p);
      return this.status(p, s);
    });
  }
  inspect(session, image, succeeded) {
    if (!succeeded) return;
    return this.transaction((s) => {
      const p = this.owner(s, session); this.fresh(p);
      const c = p.change;
      if (typeof image !== 'string') return;
      const candidates = [path.resolve(image), path.resolve(this.root, p.project, image)];
      const full = candidates.find((candidate) => candidate.startsWith(this.root + path.sep) && fs.existsSync(candidate));
      if (!full) return;
      const relative = path.relative(this.root, full).replaceAll('\\', '/');
      if (c.wipRender && relative === c.wipRender.path && c.wipRender.hash === this.hash(relative)) {
        c.wipLook = { path: relative, hash: this.hash(relative), at: new Date().toISOString(), operations: c.operations };
        return;
      }
      if (!c.sealed || relative !== c.renderPath || c.evidence?.[c.renderPath] !== this.hash(relative)) return;
      c.inspected = true;
    });
  }

  recover(session, args = {}) {
    return this.transaction((s) => {
      if (Object.keys(args).some((key) => key !== 'reopen') || (args.reopen !== undefined && args.reopen !== true)) deny('recover accepts reopen:true only');
      const p = this.owner(s, session);
      this.fresh(p);
      if (args.reopen) {
        const c = p.change;
        if (!c || c.sealed || c.pending || c.bootstrap) deny('reopen requires an unsealed reviewable change with no pending operation');
        if (c.operations >= CHECKPOINT_EVERY) deny('apply budget is exhausted; commit {mode:"wip"} and checkpoint before a fresh change');
        if (!c.failure && Date.now() <= c.deadline) deny('change has no failure or expired window to reopen');
        delete c.failure;
        c.reopen = true;
        c.deadline = Date.now() + CHANGE_WINDOW_MS;
        return this.status(p, s);
      }
      const token = p.change?.pending, t = s.tickets[token];
      if (!t || (t.state === 'running' && (!t.pid || (() => { try { process.kill(t.pid, 0); return true; } catch { return false; } })())) || t.state !== 'running' && Date.now() - t.created <= TICKET_TTL_MS) deny('no expired/dead operation; never release a live writer');
      const writerStarted = t.state === 'running';
      t.state = 'abandoned'; delete p.change.pending;
      const task = p.tasks?.find((item) => item.token === token);
      if (task) {
        task.state = 'abandoned';
        task.finished = new Date().toISOString();
        task.result = writerStarted ? 'abandoned after writer start' : 'expired before execution';
        this.writeTaskLedger(p);
      }
      if (writerStarted) {
        p.change.failure = 'Abandoned operation; inspect live scene, save and reseal before proceeding';
        p.change.deadline = 0;
      }
      return this.status(p, s);
    });
  }
}
