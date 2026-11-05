import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { instanceStatus, launchProject, stopProject } from './blender.mjs';
import { describeDocumentFormats, documentOutline, documentSection, isBootstrapDocument, isBootstrapFile, validateDocument } from './documents.mjs';
import {
  appendAssetRow,
  appendIntakeRow,
  appendReferenceRow,
  copyIntake,
  createIntakeDocument,
  inspectIntakeFile,
  MAX_INTAKE_FILE_BYTES,
  planIntake,
  referenceSourceDocument,
  sourceDocument,
} from './intake.mjs';
import { downloadToStaging } from './download.mjs';
import { configPath } from './workspace.mjs';

export const digest = (data) => crypto.createHash('sha256').update(data).digest('hex');
export const normalizeGoal = (value) => typeof value === 'string' ? value.normalize('NFC').replace(/\r\n?/g, '\n').trim() : value;
const CHECKPOINT_EVERY = 20;
const ASSET_USING_OPERATIONS = new Set(['import_asset', 'link_library', 'import_audio', 'image_reference', 'image_texture', 'world_hdri', 'pack_assets']);
const documentOnlyPath = (name) => /\.md$/i.test(name) || /(?:^|\/)scripts\/[^/]+\.(?:py|pyw)$/i.test(name);
const nonScenePath = (name) => documentOnlyPath(name) || /(?:^|\/)(?:assets|Documents\/References)\//i.test(name);
const checkAssetsStrict = (payload) => {
  const operations = Array.isArray(payload?.operations) ? payload.operations : [payload];
  return operations.some((operation) => operation?.operation === 'check_assets' && operation.strict === true);
};
const CHANGE_WINDOW_MS = 900000;
const TICKET_TTL_MS = 10 * 60000;
const MAX_CHANGE_OBJECTS = 20;
const MAX_CHANGE_SCENES = 32;
const GRADER_STEP_CEILING = 24;
const MAX_DOWNLOADS_PER_PROJECT = 20;
const MAX_MEDIA_REQUESTS = 20;
const MAX_MEDIA_ATTEMPTS = 2;
export const MEDIA_GENERATION_TOOLS = new Set(['mediamcp_generate_image', 'mediamcp_edit_image', 'mediamcp_generate_video']);
export const MEDIA_OPEN_STATUSES = new Set(['requested', 'generating', 'generated', 'intaken']);
const MEDIA_KIND_TO_INTAKE = new Map([
  ['image', 'reference'],
  ['texture', 'texture'],
  ['hdri', 'hdri'],
]);
const TASKSTRACKER_DOCUMENT = 'Documents/TASKSTRACKER.md';
const validSceneName = (name) => typeof name === 'string' && /^[\x20-\x7e]{1,100}$/.test(name) && name.trim().length > 0;
const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
  && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const sceneNamesFromOperations = (payload) => {
  const operations = Array.isArray(payload?.operations) ? payload.operations : [payload];
  const names = [];
  for (const operation of operations) {
    if (!operation || typeof operation !== 'object') continue;
    if (validSceneName(operation.scene)) names.push(operation.scene);
    if (['create_scene', 'duplicate_scene'].includes(operation.operation) && validSceneName(operation.name)) names.push(operation.name);
    if (['switch_scene', 'delete_scene'].includes(operation.operation) && validSceneName(operation.name)) names.push(operation.name);
  }
  return [...new Set(names)];
};
const EXTERNAL_BINARY_EXTENSIONS = new Set(['.glb', '.gltf', '.fbx', '.obj', '.usd', '.usdz', '.blend', '.png', '.jpg', '.jpeg', '.webp', '.tif', '.tiff', '.bmp', '.hdr', '.exr', '.wav', '.mp3', '.ogg', '.flac', '.zip', '.7z', '.rar']);
export const externalBinaryPolicy = (root, project, names) => {
  for (const name of names) {
    const relative = name.startsWith(`${project}/`) ? name.slice(project.length + 1) : name;
    if (!relative.startsWith('assets/external/')) continue;
    if (!EXTERNAL_BINARY_EXTENSIONS.has(path.extname(relative).toLowerCase())) continue;
    let directory = path.dirname(path.join(root, ...name.split('/')));
    let source = null;
    while (directory.startsWith(path.join(root, ...project.split('/'), 'assets', 'external'))) {
      const candidate = path.join(directory, 'SOURCE.md');
      if (fs.existsSync(candidate)) { source = fs.readFileSync(candidate, 'utf8'); break; }
      const parent = path.dirname(directory);
      if (parent === directory) break;
      directory = parent;
    }
    if (!source || !/Redistribution allowed:\s*yes\b/i.test(source)) {
      deny(`external binary is not cleared for commit: ${name}`);
    }
  }
};
const sceneInspectionsComplete = (change) => {
  const renders = change?.renders ?? {};
  const names = Object.keys(renders);
  if (!names.length) return Boolean(change?.inspected);
  return names.every((name) => {
    const inspection = change?.inspections?.[name];
    return inspection && inspection.hash === change.evidence?.[renders[name]];
  });
};
const canonical = (value) => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])])) : value;
export const stable = (value) => JSON.stringify(canonical(value));
export const deny = (message) => {
  throw new Error(`Workflow gate: ${message}. Next: call blender_workflow {action:"status"} and follow nextStep; never bypass the harness.`);
};
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const DOCS = ['README.md', 'Documents/REQUIREMENTS.md', 'Documents/WORKFLOW.md', 'Documents/REVIEW.md', 'Documents/ASSETS.md', 'Documents/DECISIONS.md'];

function modelFields(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) deny(`${label} must be an object`);
  const fields = ['provider', 'model', 'variant'];
  if (fields.some((key) => typeof value[key] !== 'string' || !value[key].trim())) deny(`${label} requires provider, model and reasoning variant`);
  return Object.fromEntries(fields.map((key) => [key, value[key].trim()]));
}

function modelChoice(value, label, { requireBackup = false } = {}) {
  const choice = modelFields(value, label);
  if (value.backup !== undefined) {
    choice.backup = modelFields(value.backup, `${label}.backup`);
  } else {
    if (requireBackup) deny(`${label} requires a backup provider, model and reasoning variant`);
    choice.backup = null;
  }
  return choice;
}

const modelKey = (value) => String(value ?? '').trim().toLowerCase().replace(/[\s_-]+/g, '');
const modelNameKey = (value) => modelKey(String(value ?? '').split('/').pop());
const variantKey = (value) => {
  const key = modelKey(value);
  return ({ xhigh: 'xhigh', extrahigh: 'xhigh', xh: 'xhigh', max: 'max', maximum: 'max' })[key] ?? key;
};
function modelEntryMatches(entry, runtime) {
  if (!entry || !runtime) return false;
  if (modelKey(entry.provider) !== modelKey(runtime.providerID)) return false;
  if (modelNameKey(entry.model) !== modelNameKey(runtime.modelID)) return false;
  const observed = variantKey(runtime.variant);
  return !observed || variantKey(entry.variant) === observed;
}
export function modelRole(choice, runtime) {
  if (!choice || !runtime) return null;
  if (modelEntryMatches(choice, runtime)) return 'primary';
  if (modelEntryMatches(choice.backup, runtime)) return 'backup';
  return null;
}
export function modelDiagnostics(choice, runtime) {
  const entry = (value) => value ? `${value.provider}/${value.model}/${value.variant}` : null;
  return {
    observed: runtime ? `${runtime.providerID}/${runtime.modelID}/${runtime.variant ?? '(unset)'}` : 'unavailable',
    expected: [entry(choice), entry(choice?.backup)].filter(Boolean).join(' or '),
  };
}

function modelSummary(choice) {
  if (!choice) return null;
  return {
    provider: choice.provider,
    model: choice.model,
    variant: choice.variant,
    backup: choice.backup ? { provider: choice.backup.provider, model: choice.backup.model, variant: choice.backup.variant } : null,
  };
}

function graderReportVerdict(text, change) {
  const verdicts = [...text.matchAll(/^- Verdict: (PASS|CHANGES_REQUIRED|BLOCKED)\s*$/gm)];
  if (verdicts.length !== 1) return { error: 'verdict' };
  if (!text.includes(change.sceneHash) || !text.includes(change.evidenceKey)) return { error: 'hashes' };
  const verdict = verdicts[0][1];
  if (verdict === 'PASS' && /\|\s*(blocker|major)\s*\|/i.test(text)) return { error: 'blocker' };
  return { verdict };
}

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

const GIT_TIMEOUT_MS = 30000;
const GIT_ATTEMPTS = 3;
function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
export function transientGitFailure(result) {
  if (['ETIMEDOUT', 'EAGAIN', 'EBUSY', 'EMFILE', 'ENFILE', 'ENOMEM'].includes(result?.error?.code)) return true;
  return /index\.lock|Unable to create .*\.lock|File exists/i.test(result?.stderr?.toString?.() ?? '');
}
function headHash(root) {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 5000 });
  return result.status === 0 ? result.stdout.trim() : '';
}
export function git(root, args, { binary = false, allowExitOne = false } = {}) {
  const headBefore = args[0] === 'commit' ? headHash(root) : '';
  let result;
  for (let attempt = 1; attempt <= GIT_ATTEMPTS; attempt += 1) {
    result = spawnSync('git', args, { cwd: root, encoding: binary ? undefined : 'utf8', windowsHide: true, timeout: GIT_TIMEOUT_MS, maxBuffer: 128 * 1024 * 1024 });
    const failed = result.error || (result.status !== 0 && !(allowExitOne && result.status === 1));
    if (!failed) return binary ? result.stdout : result.stdout;
    if (attempt > 1 && args[0] === 'commit' && /nothing to commit|no changes added to commit/i.test(result.stderr?.toString() ?? '')) return binary ? Buffer.alloc(0) : '';
    if (!transientGitFailure(result) || attempt === GIT_ATTEMPTS) break;
    if (headBefore) {
      const headAfter = headHash(root);
      if (headAfter && headAfter !== headBefore) return binary ? Buffer.alloc(0) : '';
    }
    sleepSync(250 * attempt);
  }
  const failure = result.error?.message ?? result.stderr?.toString().trim() ?? `exit ${result.status}`;
  const error = new Error(`Workflow gate: git ${args[0]} failed: ${failure}. Next: call blender_workflow {action:"status"} and follow nextStep; never bypass the harness.`);
  error.gitTransient = transientGitFailure(result);
  throw error;
}
const gitText = (root, args) => git(root, args).trim();
function committableFiles(root, files) {
  if (!files.length) return [];
  const ignored = new Set(git(root, ['check-ignore', '--', ...files], { allowExitOne: true })
    .split(/\r?\n/).filter(Boolean));
  return files.filter((name) => !ignored.has(name));
}
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
    return `${p.project}/${TASKSTRACKER_DOCUMENT}`;
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
    const referenceLines = [...req.matchAll(/^-\s*Reference images \/ links:[ \t]*(.*)$/gm)];
    if (referenceLines.length !== 1) deny('requirements need exactly one "- Reference images / links:" constraint');
    const referenceAnswer = referenceLines[0][1].trim();
    if (!referenceAnswer || /^\(.*\)$/.test(referenceAnswer) || /^(TBD|Pending|Unset|<.*>)$/i.test(referenceAnswer)) deny('reference images/links answer missing; ask explicitly and record paths, links, or "none"');
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
      const file = configPath(this.root);
      if (!fs.existsSync(file)) deny('grader config missing; copy config.example.json and confirm it before registration');
      const config = readJson(file);
      const cfg = config.blender_subagents?.graders;
      if (config.blender_graders || config.workers || !cfg || cfg.enabled !== true || cfg.agent !== 'blender-grader' || !Array.isArray(cfg.graders) || !cfg.graders.length) deny('grader config missing, legacy, or disabled');
      const names = new Set();
      const graderSteps = this.agentSteps('blender-grader');
      for (const g of cfg.graders) {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(g.name ?? '') || names.has(g.name) || typeof g.focus !== 'string' || !g.focus.trim() || !Number.isInteger(g.max_steps) || g.max_steps < 1 || g.max_steps > GRADER_STEP_CEILING || !Number.isInteger(g.max_minutes) || g.max_minutes < 1) deny('invalid grader roster');
        const choice = modelChoice(g, `grader ${g.name ?? '<unknown>'}`, { requireBackup: true });
        g.provider = choice.provider; g.model = choice.model; g.variant = choice.variant;
        if (choice.backup) g.backup = choice.backup; else delete g.backup;
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
  developmentMode(session) {
    const file = configPath(this.root);
    if (!fs.existsSync(file)) return false;
    try {
      const config = readJson(file);
      if (config.development_mode === true) return true;
      return typeof session === 'string'
        && Array.isArray(config.development_sessions)
        && config.development_sessions.includes(session);
    } catch { return false; }
  }

  workerConfig() {
    const file = configPath(this.root);
    if (!fs.existsSync(file)) deny('worker config missing; copy config.example.json and confirm it before delegation');
    const cfg = readJson(file).blender_subagents?.workers;
    if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg) || cfg.agent !== 'blender-worker') {
      deny('invalid worker config; validate blender_subagents.workers before delegation');
    }
    const choice = modelChoice(cfg, 'worker', { requireBackup: true });
    if (!Number.isInteger(cfg.max_minutes) || cfg.max_minutes < 1 || !Number.isInteger(cfg.max_steps) || cfg.max_steps < 1
      || !Number.isInteger(cfg.max_failed_attempts) || ![1, 2].includes(cfg.max_failed_attempts) || cfg.max_parallel !== 1) {
      deny('invalid worker limits; max_parallel must be 1');
    }
    const steps = this.agentSteps('blender-worker');
    if (steps && cfg.max_steps > steps) deny('worker max_steps exceeds agent steps ceiling');
    return { ...cfg, ...choice };
  }
  projectDoctor(project) {
    return this.transaction((state) => {
      const p = state.projects[project];
      if (!p) deny('project is not registered');
      const base = path.join(this.root, ...project.split('/'));
      const tracker = path.join(base, 'Documents', 'TASKSTRACKER.md');
      const tasks = path.join(base, 'Documents', 'Tasks');
      return {
        project, owner: p.orchestrator, goalActive: Boolean(p.goalActive), complete: Boolean(p.complete),
        staleOwnerWindow: Boolean(p.change ? p.change.deadline < Date.now() : false),
        change: p.change ? { id: p.change.id, milestone: p.change.milestone, operations: p.change.operations, deadline: p.change.deadline, verdict: p.change.verdict, blockingKind: p.change.blockingKind ?? null } : null,
        scene: { path: p.scene, exists: fs.existsSync(path.join(this.root, p.scene)) },
        docs: { tracker: fs.existsSync(tracker), tasks: fs.existsSync(tasks) },
        models: {
          worker: (() => { try { return modelSummary(this.workerConfig()); } catch (error) { return { error: String(error.message).slice(0, 300) }; } })(),
          graders: (p.records.roster ?? []).map(({ name, ...choice }) => ({ name, ...modelSummary(choice) })),
        },
        blender: instanceStatus(this.home),
      };
    });
  }
  owner(state, session) {
    const projects = Object.values(state.projects).filter((p) => p.orchestrator === session);
    if (projects.length !== 1) deny('register exactly one project for orchestrator session');
    return projects[0];
  }
  fresh(p, { allowRosterDrift = false } = {}) {
    const now = this.records(p.project, p.goal);
    const frozen = ['specs', 'workflow', 'review', 'goalText'];
    if (frozen.some((key) => stable(now[key]) !== stable(p.records[key]))) deny('spec, modes, or goal changed; explicit re-registration required');
    if (!allowRosterDrift && stable(now.roster) !== stable(p.records.roster)) deny('roster changed; explicit re-registration required');
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
      `Status: ${p.complete ? 'Complete' : 'Active'}`,
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
    const previous = fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null;
    const withoutTimestamp = (value) => String(value ?? '').replace(/^Last updated:[^\r\n]*\r?\n/m, '');
    if (previous !== null && withoutTimestamp(previous) === withoutTimestamp(text)) return;
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, text);
  }
  commitTaskTrackerCompletion(p) {
    this.writeTaskLedger(p);
    const tracker = this.taskDocument(p);
    if (!gitText(this.root, ['status', '--porcelain', '--', tracker])) return null;
    if (gitText(this.root, ['diff', '--cached', '--name-only'])) deny('index must be clean before completion metadata commit');
    git(this.root, ['add', '--', tracker]);
    if (!gitText(this.root, ['diff', '--cached', '--name-only'])) return null;
    git(this.root, ['commit', '-m', 'chore: mark task tracker complete']);
    p.lastCommit = this.head();
    p.checkpoint = this.head();
    return p.lastCommit;
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
        media: this.mediaState(p).requests.map((request) => this.mediaView(request)),
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
      `- Actor: ${task.actor ?? task.worker}`,
      `- Capability: ${task.capability ?? task.operation}`,
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
      `- Actor: ${task.actor ?? task.worker}`,
      `- Capability: ${task.capability ?? task.operation}`,
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
  recordTaskIssued(p, token, operation, payload, deadline = p.change.deadline ?? null) {
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
      worker: operation === 'apply' ? 'blender-worker' : 'orchestrator',
      actor: operation === 'apply' ? 'blender-worker' : 'orchestrator', capability: operation, child: '',
      state: 'issued', created: new Date().toISOString(), finished: '', result: '',
      deadline, operationResults: [],
    };
    p.tasks.push(task);
    this.writeTaskDocument(p, task);
    this.writeTaskLedger(p);
    return task;
  }
  recordGraderTask(p, token, name, report, deadline = p.change.deadline ?? null) {
    this.ensureTaskLedger(p);
    const task = {
      id: `G${String(++p.taskSeq).padStart(3, '0')}`, kind: 'grader', change: p.change.id,
      operation: `grader:${name}`, objects: [], paths: [report], token, tokenHash: digest(token).slice(0, 12),
      worker: name, actor: 'blender-grader', capability: 'grade', child: '', state: 'issued', created: new Date().toISOString(), finished: '', result: '',
      deadline, operationResults: [],
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
  intake(session, args) {
    return this.transaction((s) => {
      const allowed = ['project', 'files', 'folders', 'kind', 'source', 'generated', 'scan', 'media'];
      if (Object.keys(args).some((key) => !allowed.includes(key))) deny('intake accepts project, files, folders, kind, source, generated, scan and media only');
      if (typeof args.project !== 'string' || !/^Blender\/[A-Za-z0-9][A-Za-z0-9 _-]*$/.test(args.project)) deny('intake project must be Blender/<Name>');
      if (args.scan !== undefined && typeof args.scan !== 'boolean') deny('intake scan must be a boolean');
      if (args.media !== undefined && (typeof args.media !== 'string' || !args.media.trim())) deny('intake media must be a media request id');
      if (args.files !== undefined && (!Array.isArray(args.files) || args.files.length > 100 || args.files.some((item) => typeof item !== 'string'))) {
        deny('intake files must be an array of paths');
      }
      if (args.folders !== undefined && (!Array.isArray(args.folders) || args.folders.length > 20 || args.folders.some((item) => typeof item !== 'string'))) {
        deny('intake folders must be an array of paths');
      }
      const projectName = path.basename(args.project);
      const p = Object.values(s.projects).find((item) => item.project === args.project);
      if (p && p.orchestrator !== session) deny('intake requires the owning session');
      const c = p?.change;
      if (args.scan !== true && !p) deny('intake copy requires a registered project; scan first, then register and begin a change');
      if (args.scan !== true && !c) deny('intake copy requires an open bounded change; call begin with the intake document path first');
      if (args.scan !== true && (c.bootstrap || c.sealed || c.pending || c.readyToSeal)) deny('intake copy requires an unsealed, unfinished, non-bootstrap scene change with no pending operation');
      let linked = null;
      if (args.media !== undefined) {
        if (!p) deny('media intake requires a registered project');
        if (!c) deny('media intake requires an open bounded change');
        linked = this.mediaForChange(p, c.id).find((item) => item.id === args.media);
        if (!linked) deny('media request does not belong to the open change');
        if (linked.status !== 'generated') deny(`media request is ${linked.status}; only a generated media item can be intaken`);
      }
      let files = args.files ?? [];
      let folders = args.folders ?? [];
      if (args.scan !== true && c) {
        const generatedRequests = this.mediaForChange(p, c.id).filter((item) => item.status === 'generated');
        if (!linked) {
          const matches = generatedRequests.filter((item) => files.some((file) => path.resolve(this.root, file) === path.resolve(this.root, item.stagedPath)));
          if (matches.length === 1) linked = matches[0];
          else if (matches.length > 1) deny('multiple generated media match the intake files; pass media id');
          else if (generatedRequests.length === 1 && !files.length && !folders.length) linked = generatedRequests[0];
        }
        if (linked && !files.length && !folders.length) files = [linked.stagedPath];
        if (linked && !files.some((file) => path.resolve(this.root, file) === path.resolve(this.root, linked.stagedPath))) {
          deny('media intake must include the staged generated file');
        }
      }
      const generated = args.generated ?? linked?.generated;
      if (args.generated && linked) {
        for (const key of ['tool', 'model', 'prompt', 'seed']) {
          if (args.generated[key] !== undefined && linked.generated[key] !== undefined && stable(args.generated[key]) !== stable(linked.generated[key])) {
            deny(`intake generated.${key} does not match the media request`);
          }
        }
      }
      const source = args.source ?? (linked ? { notes: linked.purpose } : undefined);
      const kind = args.kind ?? (linked ? MEDIA_KIND_TO_INTAKE.get(linked.kind) : 'auto');
      if (linked && args.kind !== undefined && args.kind !== MEDIA_KIND_TO_INTAKE.get(linked.kind)) deny('intake kind does not match the media request');
      const plan = planIntake({
        root: this.root,
        projectName,
        files,
        folders,
        kind,
        source,
        generated,
        home: this.home,
      });
      if (args.scan === true || !c) {
        return {
          project: args.project,
          scan: true,
          entries: plan.entries.map(({ sourcePath, ...entry }) => ({ source: sourcePath, ...entry })),
          rejected: plan.rejected,
          next: c
            ? 'Review the plan, then call intake with scan:false to copy accepted files into the open change.'
            : p
              ? 'Open a bounded change with begin, then call intake with scan:false.'
              : 'Register the project and call begin with the intake document path before copying files.',
        };
      }
      const base = this.projectPath(args.project);
      const result = copyIntake({ projectRoot: base, plan, licenseText: plan.licenseText });
      p.intake = {
        at: new Date().toISOString(),
        copied: result.copied.length,
        duplicates: result.duplicates.length,
        rejected: result.rejected.length,
        licenseCandidates: [...new Set(result.copied.flatMap((entry) => entry.licenseCandidates ?? []))],
        paths: result.copied.map((entry) => entry.stored),
      };
      const paths = new Set(c.paths);
      const addPath = (relative) => paths.add(`${p.project}/${relative}`);
      let linkedStored = null;
      if (linked) {
        const sourceFull = path.resolve(this.root, linked.stagedPath);
        linkedStored = result.copied.find((entry) => path.resolve(entry.sourcePath) === sourceFull)?.stored
          ?? result.duplicates.find((entry) => path.resolve(entry.sourcePath) === sourceFull)?.stored
          ?? null;
        if (!linkedStored) deny('generated media was not copied by intake; inspect rejected files');
        addPath(linkedStored);
        p.intake.paths = [...new Set([...p.intake.paths, linkedStored])];
        linked.status = 'intaken';
        linked.projectPath = `${p.project}/${linkedStored}`;
        linked.intakeSha256 = linked.sha256;
        linked.updatedAt = new Date().toISOString();
        this.writeMediaLedger(p);
      }
      const addDocument = (relative, content, validate = false) => {
        if (validate) {
          try { validateDocument(relative, content); } catch (error) { deny(error.message); }
        }
        const full = path.join(base, ...relative.split('/'));
        fs.mkdirSync(path.dirname(full), { recursive: true });
        fs.writeFileSync(full, content, 'utf8');
        addPath(relative);
        return content;
      };
      const readOrCreate = (relative, create) => {
        const full = path.join(base, ...relative.split('/'));
        return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : create();
      };
      const assetsRelative = 'Documents/ASSETS.md';
      const referencesRelative = 'Documents/References/README.md';
      const intakeRelative = 'Documents/INTAKE.md';
      let assets = null;
      let references = null;
      let intake = readOrCreate(intakeRelative, () => createIntakeDocument(projectName));
      for (const entry of result.copied) {
        addPath(entry.stored);
        const sourceName = plan.source?.url || plan.source?.author || plan.source?.vendor || 'user-supplied';
        if (entry.external) {
          const sourceRelative = path.posix.join(path.posix.dirname(entry.stored), 'SOURCE.md');
          const licenseRelative = path.posix.join(path.posix.dirname(entry.stored), 'LICENSE.txt');
          addDocument(sourceRelative, sourceDocument({
            entry,
            source: plan.source,
            license: plan.source?.license ?? '',
            generated: plan.generated,
          }));
          addPath(licenseRelative);
          assets ??= readOrCreate(assetsRelative, () => `# External Assets — ${projectName}\n\n## Rules\n\nExternal assets are registered by the harness.\n`);
          assets = appendAssetRow(assets, {
            assetId: entry.sha256.slice(0, 12),
            asset: plan.source?.name || plan.source?.asset || entry.name,
            type: entry.kind,
            sourceUrl: plan.source?.url || '',
            author: plan.source?.author || plan.source?.vendor || '',
            license: plan.source?.license || '',
            localPath: entry.stored,
            packaging: plan.source?.packaging || 'none',
            redistributable: plan.source?.redistributable === undefined ? '' : plan.source.redistributable ? 'yes' : 'no',
            sha256: entry.sha256,
            preview: '',
            usedIn: '',
            notes: plan.source?.notes || '',
          });
        }
        if (entry.kind === 'reference') {
          const sidecar = entry.stored.replace(/\.[^/.]+$/, '') + '.md';
          addDocument(sidecar, referenceSourceDocument({ entry, source: plan.source, generated: plan.generated }));
          references ??= readOrCreate(referencesRelative, () => `# References — ${projectName}\n\n## Index\n\n| Reference | Source | What it informs | Notes |\n|---|---|---|---|\n`);
          references = appendReferenceRow(references, {
            reference: entry.stored,
            source: plan.generated ? `generated: ${plan.generated.tool || 'image tool'}` : sourceName,
            informs: plan.source?.notes || 'visual direction',
            notes: plan.generated ? `model ${plan.generated.model || '—'}; prompt ${plan.generated.prompt || '—'}` : 'user-supplied reference',
          });
        }
        intake = appendIntakeRow(intake, {
          time: new Date().toISOString(),
          kind: entry.kind,
          original: entry.name,
          stored: entry.stored,
          bytes: entry.bytes,
          mime: entry.mime,
          width: entry.width,
          height: entry.height,
          sha256: entry.sha256,
          source: plan.generated ? `generated: ${plan.generated.tool || 'image tool'}` : sourceName,
          license: plan.source?.license || (plan.generated ? 'generated' : ''),
          status: 'copied',
        });
      }
      for (const duplicate of result.duplicates) {
        intake = appendIntakeRow(intake, {
          time: new Date().toISOString(),
          kind: duplicate.kind,
          original: duplicate.name,
          stored: duplicate.stored,
          bytes: duplicate.bytes,
          mime: duplicate.mime,
          width: duplicate.width,
          height: duplicate.height,
          sha256: duplicate.sha256,
          source: plan.generated ? `generated: ${plan.generated.tool || 'image tool'}` : (plan.source?.url || plan.source?.author || 'user-supplied'),
          license: plan.source?.license || (plan.generated ? 'generated' : ''),
          status: 'duplicate',
        });
      }
      if (assets !== null) {
        addDocument(assetsRelative, assets, true);
        if (!c.paths.includes(`${p.project}/${assetsRelative}`)) c.paths.push(`${p.project}/${assetsRelative}`);
      }
      if (references !== null) {
        addDocument(referencesRelative, references, true);
        if (!c.paths.includes(`${p.project}/${referencesRelative}`)) c.paths.push(`${p.project}/${referencesRelative}`);
      }
      addDocument(intakeRelative, intake, true);
      for (const relative of paths) if (!c.paths.includes(relative)) c.paths.push(relative);
      c.documentOnly = c.paths.every(documentOnlyPath);
      c.nonSceneOnly = c.paths.every(nonScenePath);
      return {
        project: args.project,
        scan: false,
        copied: result.copied.map(({ sourcePath, target, ...entry }) => entry),
        duplicates: result.duplicates,
        rejected: result.rejected,
        paths: [...paths].filter((name) => name.startsWith(`${p.project}/`)).map((name) => name.slice(p.project.length + 1)),
        media: linked ? this.mediaView(linked) : undefined,
        next: linked
          ? 'Generated media is intaken and recorded. Commit the change to close the media request.'
          : 'Import copied assets with apply operations, record their use, then continue the bounded change.',
      };
    });
  }
  mediaState(p) {
    if (!p.media || typeof p.media !== 'object' || Array.isArray(p.media)) p.media = { requests: [] };
    if (!Array.isArray(p.media.requests)) p.media.requests = [];
    return p.media;
  }
  writeMediaLedger(p) {
    const c = p.change;
    const relative = 'Documents/MEDIA.md';
    const escape = (value) => String(value ?? '').replaceAll('|', '\\|').replace(/[\r\n]+/g, ' ').slice(0, 240);
    const rows = this.mediaState(p).requests.map((request) => [
      request.id,
      request.status,
      request.kind,
      request.tool,
      request.model ?? '',
      request.purpose,
      request.creditEstimate ?? '',
      request.creditActual ?? '',
      (request.attempts ?? []).length,
      request.stagedPath ?? '',
      request.projectPath ?? '',
      request.sha256 ?? '',
      request.changeId?.slice(0, 8) ?? '',
      request.commit?.slice(0, 12) ?? '',
      request.error ?? '',
    ].map(escape).join(' | '));
    const text = [
      `# Media Requests — ${p.project.slice('Blender/'.length)}`,
      '',
      'Status: Active',
      `Last updated: ${new Date().toISOString()}`,
      '',
      '## Requests',
      '',
      '| Request | Status | Kind | Tool | Model | Purpose | Credit estimate | Credit actual | Attempts | Staged path | Project path | SHA-256 | Change | Commit | Error |',
      '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|',
      ...(rows.length ? rows.map((row) => `| ${row} |`) : ['| — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |']),
      '',
      '## Rules',
      '',
      'Media generation requires a registered project, a checkpointed initial scene, an open bounded change, and an open media request. Generated files stay under `.temp` until `intake` copies them into the project. A failed request is recorded here and does not silently disappear.',
      '',
    ].join('\n');
    const full = contained(this.root, `${p.project}/${relative}`, true);
    const previous = fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null;
    if (previous !== text) {
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, text);
    }
    if (c && !c.paths.includes(`${p.project}/${relative}`)) {
      c.paths.push(`${p.project}/${relative}`);
      c.documentOnly = c.paths.every(documentOnlyPath);
      c.nonSceneOnly = c.paths.every(nonScenePath);
    }
  }
  mediaView(request) {
    return {
      id: request.id,
      status: request.status,
      purpose: request.purpose,
      kind: request.kind,
      tool: request.tool,
      model: request.model ?? null,
      prompt: request.prompt ?? null,
      seed: request.seed ?? null,
      creditEstimate: request.creditEstimate ?? null,
      creditActual: request.creditActual ?? null,
      attempts: (request.attempts ?? []).length,
      error: request.error ?? null,
      stagedPath: request.stagedPath ?? null,
      sha256: request.sha256 ?? null,
      bytes: request.bytes ?? null,
      mime: request.mime ?? null,
      width: request.width ?? null,
      height: request.height ?? null,
      projectPath: request.projectPath ?? null,
      intakeSha256: request.intakeSha256 ?? null,
      changeId: request.changeId ?? null,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      committedAt: request.committedAt ?? null,
      commit: request.commit ?? null,
    };
  }
  mediaForChange(p, changeId) {
    return this.mediaState(p).requests.filter((request) => request.changeId === changeId);
  }
  openMedia(p, changeId = null) {
    return this.mediaState(p).requests.find((request) => MEDIA_OPEN_STATUSES.has(request.status)
      && (changeId === null || request.changeId === changeId));
  }
  mediaGate(p, c, { allowIntaken = false } = {}) {
    const requests = this.mediaForChange(p, c.id);
    if (c.mediaRequired && !requests.length) deny('this change requires a media request; call media-request before production work');
    const open = requests.find((request) => request.status === 'requested' || request.status === 'generated'
      || (!allowIntaken && request.status === 'intaken'));
    if (open) deny(`media request ${open.id} is ${open.status}; complete generation and intake before continuing`);
  }
  mediaRequest(p, args) {
    const allowed = ['purpose', 'kind', 'tool', 'model', 'prompt', 'seed', 'creditEstimate'];
    if (Object.keys(args).some((key) => !allowed.includes(key))) deny('media-request accepts purpose, kind, tool, model, prompt, seed and creditEstimate only');
    if (!p.goalActive || !p.change) deny('media-request requires an active goal and an open bounded change');
    const c = p.change;
    if (c.bootstrap) deny('save, commit, and checkpoint the initial scene before requesting media');
    if (!git(this.root, ['ls-tree', '-r', '--name-only', 'HEAD', '--', p.scene]).trim()) deny('save, commit, and checkpoint the initial scene before requesting media');
    if (c.sealed || c.pending || c.readyToSeal) deny('media-request requires an unsealed change with no pending operation');
    const media = this.mediaState(p);
    if (media.requests.length >= MAX_MEDIA_REQUESTS) deny(`media requests are capped at ${MAX_MEDIA_REQUESTS} per project`);
    if (this.openMedia(p)) deny('one open media request at a time; complete, fail, or commit the current request first');
    if (typeof args.purpose !== 'string' || !args.purpose.trim() || args.purpose.length > 500) deny('media-request purpose must be a bounded non-empty string');
    const kind = args.kind ?? 'image';
    if (!MEDIA_KIND_TO_INTAKE.has(kind)) deny('media-request kind must be image, texture, or hdri; video, audio, and model generation are not supported yet');
    if (typeof args.tool !== 'string' || !/^[A-Za-z0-9_.:-]{1,100}$/.test(args.tool)) deny('media-request tool must be a bounded tool name');
    if (!MEDIA_GENERATION_TOOLS.has(args.tool)) deny('media-request tool must be a configured Media MCP generation tool');
    if (args.tool === 'mediamcp_generate_video') deny('video generation is not supported yet; use an image, texture, or hdri request');
    if (args.model !== undefined && (typeof args.model !== 'string' || args.model.length > 100)) deny('media-request model must be a bounded string');
    if (typeof args.prompt !== 'string' || !args.prompt.trim() || args.prompt.length > 4000) deny('media-request prompt must be a bounded non-empty string');
    if (args.seed !== undefined && (!Number.isInteger(args.seed) || args.seed < 1 || args.seed > 100000)) deny('media-request seed must be an integer between 1 and 100000');
    if (args.creditEstimate !== undefined && (typeof args.creditEstimate !== 'string' || args.creditEstimate.length > 120)) deny('media-request creditEstimate must be a bounded string');
    const now = new Date().toISOString();
    const request = {
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      status: 'requested',
      changeId: c.id,
      purpose: args.purpose.trim(),
      kind,
      tool: args.tool,
      model: args.model?.trim() || null,
      prompt: args.prompt.trim(),
      seed: args.seed ?? null,
      creditEstimate: args.creditEstimate?.trim() || null,
      attempts: [],
      generated: {
        tool: args.tool,
        model: args.model?.trim() || undefined,
        prompt: args.prompt.trim(),
        seed: args.seed === undefined ? undefined : String(args.seed),
      },
    };
    media.requests.push(request);
    this.writeMediaLedger(p);
    return {
      request: this.mediaView(request),
      next: `Call ${request.tool} only after explicit user permission, then record the returned file with media-complete.`,
    };
  }
  mediaStart(session, id) {
    return this.transaction((s) => {
      const p = this.owner(s, session);
      this.fresh(p);
      if (!p.goalActive || !p.change) deny('media generation requires an active goal and an open bounded change');
      const request = this.mediaForChange(p, p.change.id).find((item) => item.id === id);
      if (!request) deny('media request does not belong to the open change');
      if (request.status !== 'requested') deny(`media request is ${request.status}; only a requested media item can start generation`);
      request.status = 'generating';
      request.startedAt = new Date().toISOString();
      request.updatedAt = request.startedAt;
      this.writeMediaLedger(p);
      return { request: this.mediaView(request) };
    });
  }
  mediaComplete(p, args) {
    const allowed = ['id', 'path', 'creditActual'];
    if (Object.keys(args).some((key) => !allowed.includes(key))) deny('media-complete accepts id, path and creditActual only');
    if (typeof args.id !== 'string' || !args.id.trim()) deny('media-complete requires a media request id');
    if (typeof args.path !== 'string' || !args.path.trim()) deny('media-complete requires the generated file path');
    if (args.creditActual !== undefined && (typeof args.creditActual !== 'string' || args.creditActual.length > 120)) deny('media-complete creditActual must be a bounded string');
    if (!p.change) deny('media-complete requires an open bounded change');
    const request = this.mediaForChange(p, p.change.id).find((item) => item.id === args.id);
    if (!request) deny('media request does not belong to the open change');
    if (!['requested', 'generating'].includes(request.status)) deny(`media request is ${request.status}; only a requested or generating media item can receive a file`);
    const full = path.resolve(this.root, args.path);
    const relative = path.relative(this.root, full).replaceAll('\\', '/');
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) deny('generated media must be inside the workspace');
    if (!relative.startsWith('.temp/')) deny('generated media must be staged under .temp/; use Media MCP staging and media-complete before intake');
    if (!fs.existsSync(full)) deny('generated media file is missing');
    const stat = fs.lstatSync(full);
    if (stat.isSymbolicLink() || !stat.isFile()) deny('generated media must be a regular file');
    if (stat.size > MAX_INTAKE_FILE_BYTES) deny('generated media exceeds the intake file size limit');
    let metadata;
    try {
      metadata = inspectIntakeFile(full, MEDIA_KIND_TO_INTAKE.get(request.kind));
    } catch (error) {
      deny(`generated media is not a valid ${request.kind} file: ${error.message}`);
    }
    request.status = 'generated';
    request.updatedAt = new Date().toISOString();
    request.stagedPath = relative;
    request.sha256 = this.hash(relative);
    request.bytes = stat.size;
    request.mime = metadata.mime;
    request.width = metadata.width;
    request.height = metadata.height;
    if (args.creditActual !== undefined) request.creditActual = args.creditActual.trim();
    this.writeMediaLedger(p);
    return {
      request: this.mediaView(request),
      next: `Call intake with media:"${request.id}" and generated metadata, then commit the change.`,
    };
  }
  mediaFail(p, args) {
    const allowed = ['id', 'error', 'cancel'];
    if (Object.keys(args).some((key) => !allowed.includes(key))) deny('media-fail accepts id, error and cancel only');
    if (typeof args.id !== 'string' || !args.id.trim()) deny('media-fail requires a media request id');
    if (typeof args.error !== 'string' || !args.error.trim() || args.error.length > 1000) deny('media-fail requires a bounded error');
    if (args.cancel !== undefined && typeof args.cancel !== 'boolean') deny('media-fail cancel must be boolean');
    if (!p.change) deny('media-fail requires an open bounded change');
    const request = this.mediaForChange(p, p.change.id).find((item) => item.id === args.id);
    if (!request) deny('media request does not belong to the open change');
    if (!MEDIA_OPEN_STATUSES.has(request.status)) deny(`media request is already ${request.status}`);
    const now = new Date().toISOString();
    request.attempts ??= [];
    request.attempts.push({ at: now, error: args.error.trim() });
    request.error = args.error.trim();
    request.updatedAt = now;
    if (args.cancel === true || request.attempts.length >= MAX_MEDIA_ATTEMPTS) {
      request.status = 'failed';
      request.closedAt = now;
      this.writeMediaLedger(p);
      return {
        request: this.mediaView(request),
        next: 'The failure is recorded. Commit the change to preserve the failed media record, then continue with the next bounded change.',
      };
    }
    request.status = 'requested';
    delete request.stagedPath;
    delete request.sha256;
    delete request.bytes;
    delete request.mime;
    delete request.width;
    delete request.height;
    this.writeMediaLedger(p);
    return {
      request: this.mediaView(request),
      next: `Retry ${request.tool} once, or call media-fail again to record the final failure.`,
    };
  }
  closeMediaForCommit(p, c, commit) {
    const now = new Date().toISOString();
    for (const request of this.mediaForChange(p, c.id)) {
      if (request.status === 'intaken') {
        request.status = 'committed';
        request.committedAt = now;
        request.commit = commit;
      } else if (request.status === 'failed') {
        request.closedAt ??= now;
        request.commit ??= commit;
      }
    }
  }
  async download(session, args) {
    const allowed = ['project', 'url', 'filename', 'maxBytes'];
    if (Object.keys(args).some((key) => !allowed.includes(key))) deny('download accepts project, url, filename and maxBytes only');
    if (args.project !== undefined && (typeof args.project !== 'string' || !/^Blender\/[A-Za-z0-9][A-Za-z0-9 _-]*$/.test(args.project))) deny('download project must be Blender/<Name>');
    if (typeof args.url !== 'string' || !args.url.trim()) deny('download requires url');
    if (args.filename !== undefined && typeof args.filename !== 'string') deny('download filename must be a string');
    if (args.maxBytes !== undefined && (!Number.isInteger(args.maxBytes) || args.maxBytes < 1)) deny('download maxBytes must be a positive integer');
    if (args.project) this.transaction((s) => {
      const p = Object.values(s.projects).find((item) => item.project === args.project);
      if (p && (p.downloads ?? []).length >= MAX_DOWNLOADS_PER_PROJECT) deny(`downloads are capped at ${MAX_DOWNLOADS_PER_PROJECT} per project`);
    });
    const result = await downloadToStaging({ root: this.root, project: args.project, url: args.url, filename: args.filename, maxBytes: args.maxBytes });
    if (args.project) this.transaction((s) => {
      const p = Object.values(s.projects).find((item) => item.project === args.project);
      if (p) p.downloads = [...(p.downloads ?? []), { at: new Date().toISOString(), url: result.url, path: result.relative, bytes: result.bytes, sha256: result.sha256 }];
    });
    return result;
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
      if (!/^[A-Za-z0-9 _-]+\.blend$/.test(args.scene ?? '')) deny('scene must be a bare project-root .blend filename such as "cozy-room.blend"; begin paths are project-relative such as "Blender/CozyRoom/Documents/DECISIONS.md"');
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
    if (!p.goalActive) {
      if (p.change) return { phase: 'resume-goal', actor: 'orchestrator', action: 'goal', command: 'goal {action:"resume"}', reason: 'The Kilo goal is paused or cleared while a bounded change is open; resume before continuing.' };
      return { phase: 'goal', actor: 'orchestrator', action: 'goal', command: 'goal {action:"start"|"resume",objective:<registered goal prompt>}', reason: 'Start or resume the registered goal before production work.' };
    }
    const c = p.change;
    const media = c ? this.mediaForChange(p, c.id) : [];
    const openMedia = media.find((request) => MEDIA_OPEN_STATUSES.has(request.status));
    if (c?.mediaRequired && !media.length) {
      return {
        phase: 'media-request',
        actor: 'orchestrator',
        action: 'media-request',
        command: this.wire('media-request', {
          purpose: '<what the media informs>',
          kind: 'image',
          tool: 'mediamcp_generate_image',
          model: '<model>',
          prompt: '<prompt>',
          creditEstimate: '<estimate or unknown>',
        }),
        reason: 'This change declared media. Open a media request before calling Media MCP; explicit user permission is still required before spending credits.',
      };
    }
    if (openMedia?.status === 'requested') {
      return {
        phase: 'media-generate',
        actor: 'orchestrator',
        action: openMedia.tool,
        command: `Call ${openMedia.tool} only after explicit user permission, then blender_workflow {action:"media-complete",payload:{id:"${openMedia.id}",path:"<returned path>"}}`,
        reason: `Media request ${openMedia.id} is open. Generate the media, then record the actual file with media-complete.`,
      };
    }
    if (openMedia?.status === 'generating') {
      return {
        phase: 'media-record',
        actor: 'orchestrator',
        action: 'media-complete',
        command: this.wire('media-complete', { id: openMedia.id, path: '<returned path>' }),
        reason: 'Generation has started. Record the returned file with media-complete, or call media-fail with the error.',
      };
    }
    if (openMedia?.status === 'generated') {
      return {
        phase: 'media-intake',
        actor: 'orchestrator',
        action: 'intake',
        command: this.wire('intake', {
          project: p.project,
          media: openMedia.id,
          kind: MEDIA_KIND_TO_INTAKE.get(openMedia.kind),
          generated: openMedia.generated,
        }),
        reason: 'The generated media is staged. Intake it into the open change, then commit the change to close the request.',
      };
    }
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
      const sceneCommitted = git(this.root, ['ls-tree', '-r', '--name-only', 'HEAD', '--', p.scene]).trim() === p.scene;
      return sceneCommitted
        ? { phase: 'bootstrap-checkpoint', actor: 'orchestrator', action: 'checkpoint', command: this.wire('checkpoint', {}), reason: 'The bootstrap commit exists; checkpoint it before beginning scene work.' }
        : { phase: 'bootstrap-commit', actor: 'orchestrator', action: 'commit', command: this.wire('commit', { message: '<bounded bootstrap message>' }), reason: 'Close the bootstrap save with the harness commit, then checkpoint; never seal or grade the initial scene.' };
    }
    if (!c.sealed && c.operations >= CHECKPOINT_EVERY && (c.failure || Date.now() > c.deadline)) return { phase: 'wip', actor: 'orchestrator', action: 'commit', command: this.wire('commit', { message: 'wip: preserve failed or expired change', mode: 'wip' }), reason: 'The apply budget is exhausted and the change cannot be repaired; preserve it with a WIP commit, then checkpoint and begin a fresh change.' };
    if (!c.sealed && (c.failure || Date.now() > c.deadline)) {
      if (c.operations === 0 && !c.pending && !c.failure) return { phase: 'abandon', actor: 'orchestrator', action: 'abandon', command: this.wire('abandon', { reason: 'Empty change expired without applying anything' }), reason: 'This change expired with no applied operations; abandon it, then begin a fresh change.' };
      return { phase: 'recover', actor: 'orchestrator', action: 'recover', command: this.wire('recover', { reopen: true }), reason: 'The change failed or its window expired; reopen it to repair, or commit {mode:"wip"} to preserve it.' };
    }
    if (!c.sealed && c.reopen && !c.documentOnly) return { phase: 'apply', actor: 'blender-worker', action: 'ticket', command: this.wire('ticket', { operation: 'apply', payload: '<operation or {operations:[...]}>' }), reason: 'The change was reopened; issue a repair apply batch and delegate it to blender-worker.' };
    if (!c.sealed && c.nonSceneOnly && c.operations === 0) {
      return this.head() === c.base
        ? { phase: 'commit', actor: 'orchestrator', action: 'commit', command: this.wire('commit', { message: '<one bounded non-scene message>' }), reason: 'This change contains only documentation, source-only scripts, references, or assets; commit it without sealing or review, then checkpoint.' }
        : { phase: 'checkpoint', actor: 'orchestrator', action: 'checkpoint', command: this.wire('checkpoint', {}), reason: 'The non-scene commit is ready; checkpoint it before another begin.' };
    }
    if (!c.sealed && c.operations === 0) return { phase: 'apply', actor: 'blender-worker', action: 'ticket', command: this.wire('ticket', { operation: 'apply', payload: '<operation or {operations:[...]}>' }), reason: 'Seal requires at least one apply ticket; issue one operation or a batch of up to 10 and delegate it to blender-worker.' };
    if (!c.sealed && c.operations > 0 && c.operations % 3 === 0 && (!c.wipRender || c.wipRender.operations !== c.operations)) return { phase: 'wip', actor: 'orchestrator', action: 'ticket', command: this.wire('ticket', { operation: 'wip', payload: {} }), reason: 'Every third apply requires a WIP render for a quick visual check.' };
    if (!c.sealed && c.wipRender?.operations === c.operations && (!c.wipLook || c.wipLook.operations !== c.operations)) return { phase: 'wip-inspect', actor: 'orchestrator', action: 'blender_look', command: `blender_look {image:"${c.wipRender.path}"}`, reason: 'Inspect the exact WIP render before continuing or sealing.' };
    if (!c.sealed && !c.readyToSeal) return { phase: 'apply', actor: 'blender-worker', action: 'ticket', command: this.wire('ticket', { operation: 'apply', payload: '<operation or {operations:[...]}>' }), reason: `Continue milestone "${c.milestone ?? c.outcome}", extend exact scope, or call finalize before sealing.` };
    if (!c.sealed && (!c.wipRender || c.wipRender.operations !== c.operations)) return { phase: 'wip', actor: 'orchestrator', action: 'ticket', command: this.wire('ticket', { operation: 'wip', payload: {} }), reason: 'Render a WIP frame for the current apply state, then inspect it with blender_look.' };
    if (!c.sealed && (!c.wipLook || c.wipLook.operations !== c.operations)) return { phase: 'wip-inspect', actor: 'orchestrator', action: 'blender_look', command: `blender_look {image:"${c.wipRender.path}"}`, reason: 'Inspect the exact WIP render before sealing the current apply state.' };
    if (!c.sealed) return { phase: 'seal', actor: 'orchestrator', action: 'ticket', command: this.wire('ticket', { operation: 'seal', payload: {} }), reason: 'Save and seal the changed scene, then inspect the returned render.' };
    if (!c.inspected) {
      const pendingScene = Object.entries(c.renders ?? {}).find(([name]) => !c.inspections?.[name]);
      const image = pendingScene?.[1] ?? c.renderPath;
      return { phase: 'inspect', actor: 'orchestrator', action: 'blender_look', command: `blender_look {image:"${image}"}`, reason: `Inspect the exact sealed render${pendingScene ? ` for scene ${pendingScene[0]}` : ''} before review.` };
    }
    if (!c.verdict) {
      if (p.records.review === 'Off') return { phase: 'self-review', actor: 'orchestrator', action: 'self-review', command: this.wire('self-review', { notes: '<what the sealed render proves>' }), reason: 'Record the required self-review after inspecting the sealed render.' };
      const pending = p.records.roster.filter((g) => !c.graders[g.name]?.verdict);
      const exhausted = pending.length > 0 && pending.every((g) => {
        const assignment = c.graders[g.name];
        return assignment && (assignment.attempt ?? 0) >= 2 && (!assignment.child || Date.now() > assignment.deadline);
      });
      const expired = pending.length > 0 && pending.every((g) => {
        const assignment = c.graders[g.name];
        return assignment && Date.now() > assignment.deadline;
      });
      if (!pending.length || exhausted || expired) {
        return { phase: 'review', actor: 'orchestrator', action: 'review', command: this.wire('review', { notes: '<inspection notes>', reason: '<why no further grader retry is possible>', dispositions: '<finding dispositions>' }), reason: 'All available grader results are ready; aggregate the round and record any missing or expired grader as a tooling block.' };
      }
      const missing = pending[0].name;
      return { phase: 'grader-ticket', actor: 'orchestrator', action: 'grader-ticket', command: this.wire('grader-ticket', { name: missing }), reason: 'Dispatch every configured grader, then aggregate their reports.' };
    }
    if (c.verdict === 'BLOCKED' && c.blockingKind === 'tooling') {
      const blocked = p.records.roster.find((g) => c.graders[g.name]?.verdict === 'BLOCKED')?.name ?? '<grader>';
      if ((c.graders[blocked]?.attempt ?? 0) >= 2 || c.graders[blocked]?.recovered) {
        return { phase: 'preserve', actor: 'orchestrator', action: 'preserve', command: this.wire('preserve', { reason: '<why the tooling block cannot be resolved now>' }), reason: 'The grader retry budget is exhausted. Preserve the sealed evidence and task records as WIP, then checkpoint and pause or reregister.' };
      }
      return { phase: 'retry-grader', actor: 'orchestrator', action: 'grader-ticket', command: this.wire('grader-ticket', { name: blocked }), reason: 'This is a tooling/evidence block, not a design failure. Retry the blocked grader; do not open a scene revision.' };
    }
    if (p.records.workflow === 'Partially Autonomous' && !c.approval) return { phase: 'approval', actor: 'orchestrator', action: 'approval', command: this.wire('approval', {}), reason: 'Pause the goal and ask the exact approval question before committing this change.' };
    if (c.verdict && this.reviewPending(p, c)) return { phase: 'commit', actor: 'orchestrator', action: 'commit', command: this.wire('commit', { message: '<one bounded conventional message>' }), reason: 'Commit the reviewed change and its harness artifacts.' };
    return { phase: 'checkpoint', actor: 'orchestrator', action: 'checkpoint', command: this.wire('checkpoint', {}), reason: 'Verify the exact scoped commit and close the change before another begin.' };
  }
  status(p, state) {
    const c = p.change;
    const step = this.nextStep(p, state);
    const media = this.mediaState(p).requests;
    const openMedia = this.openMedia(p);
    return { project: p.project, scene: p.scene, checkpoint: p.checkpoint, lastCommit: p.lastCommit ?? null, goalActive: p.goalActive, complete: p.complete, intake: p.intake ?? null, downloads: p.downloads ?? [], media: { open: openMedia ? this.mediaView(openMedia) : null, requests: media.map((request) => this.mediaView(request)) }, assetUse: Boolean(p.assetUse), assetCheck: p.assetCheck ?? null, exports: p.exports ?? [], blender: instanceStatus(this.home),
       models: {
         worker: (() => { try { return modelSummary(this.workerConfig()); } catch (error) { return { error: String(error.message).slice(0, 300) }; } })(),
         graders: (p.records.roster ?? []).map(({ name, ...choice }) => ({ name, ...modelSummary(choice) })),
       },
       change: c ? { id: c.id, created: c.created ?? null, outcome: c.outcome, milestone: c.milestone ?? null, requirements: c.requirements ?? [], scenes: c.scenes ?? [], primaryScene: c.primaryScene ?? null, sceneRequirements: c.sceneRequirements ?? {}, renders: c.renders ?? {}, inspections: c.inspections ?? {}, final: Boolean(c.final), readyToSeal: Boolean(c.readyToSeal), paths: c.paths, mediaRequired: Boolean(c.mediaRequired), saved: Boolean(c.saved), sealed: c.sealed, inspected: c.inspected, verdict: c.verdict, blockingKind: c.blockingKind ?? null, preserved: c.preserved ?? null, round: c.round, sceneHash: c.sceneHash, evidenceKey: c.evidenceKey, operations: c.operations, documentOnly: Boolean(c.documentOnly), nonSceneOnly: Boolean(c.nonSceneOnly), appliesRemaining: Math.max(0, CHECKPOINT_EVERY - c.operations), deadlineRemainingMs: Math.max(0, c.deadline - Date.now()), failure: Boolean(c.failure), reopen: Boolean(c.reopen), wip: Boolean(c.wip), wipRender: c.wipRender ?? null, wipLook: c.wipLook ?? null, commits: c.commits ?? [], pending: c.pending ? 'operation in progress' : null, pendingTask: c.pending ? (p.tasks?.find((task) => task.token === c.pending)?.id ?? null) : null, approved: Boolean(c.approval), graders: c.graders } : null,
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
      return { project, registered: false, next: 'Scaffold the project folder with the workspace CLI.', nextStep: { phase: 'scaffold', actor: 'orchestrator', action: 'scaffold', command: `node .kilo/blender-project-harness/tools/harness/cli.mjs scaffold --name "${name}"`, reason: 'The project folder does not exist yet.' } };
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
          `${assignment.p.project}/${TASKSTRACKER_DOCUMENT}`, `${assignment.p.project}/Documents/README.md`, assignment.g.report]);
        const reportPrefix = 'Documents/Reviews/';
        const reportSuffix = `/${assignment.name}/REPORT.md`;
        const round = clean.startsWith(reportPrefix) && clean.endsWith(reportSuffix)
          ? clean.slice(reportPrefix.length, clean.length - reportSuffix.length)
          : '';
        const ownPriorReport = Boolean(round) && !round.includes('/');
        const reference = `${project}/Documents/References/`;
        if (!allowed.has(`${project}/${clean}`) && !ownPriorReport && !`${project}/${clean}`.startsWith(reference)) deny('grader document read outside assigned spec documents');
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
      if (g.verdict || g.error) deny('grader report already finalized');
      if (typeof args.path !== 'string' || typeof args.content !== 'string' || args.content.length > 1_000_000) deny('grader report path and bounded markdown content required');
      const base = this.projectPath(p.project);
      const { full, clean } = documentPath(base, args.path);
      if (`${p.project}/${clean}` !== g.report) deny('grader may write only its assigned report path');
      try { validateDocument(clean, args.content); } catch (error) { deny(error.message); }
      const verdicts = [...args.content.matchAll(/^- Verdict: (PASS|CHANGES_REQUIRED|BLOCKED)\s*$/gm)];
      if (verdicts.length !== 1) deny('grader report requires exactly one - Verdict: PASS|CHANGES_REQUIRED|BLOCKED line');
      if (!args.content.includes(p.change.sceneHash) || !args.content.includes(p.change.evidenceKey)) deny('grader report must cite the assigned scene hash and evidence key');
      if (fs.existsSync(full)) {
        const existing = graderReportVerdict(fs.readFileSync(full, 'utf8'), p.change);
        if (existing.verdict) deny(`valid report already present at ${g.report}; collect it instead of overwriting it`);
      }
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, args.content);
      return { project: p.project, path: g.report, verdict: verdicts[0][1], bytes: args.content.length, next: 'Return the report facts; the orchestrator validates and aggregates.' };
    });
  }
  reviewPending(p, c) {
    const paths = this.reviewPaths(p, c);
    return Boolean(gitText(this.root, ['status', '--porcelain', '--', ...paths]).trim());
  }
  reviewPaths(p, c) {
    return [c.renderPath, ...Object.keys(c.reports), `${p.project}/Documents/Reviews/${c.round}/manifest.json`, `${p.project}/Documents/Reviews/README.md`, `${p.project}/Documents/REVIEW.md`];
  }
  updateReviewIndex(p, c) {
    const relative = `${p.project}/Documents/Reviews/README.md`;
    const full = path.join(this.root, ...relative.split('/'));
    if (!fs.existsSync(full)) return;
    const raw = fs.readFileSync(full, 'utf8');
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    const lines = raw.split(/\r?\n/);
    const header = lines.findIndex((line) => /^\|\s*Round\s*\|/.test(line));
    if (header < 0 || lines.some((line) => line.startsWith(`| ${c.round} |`))) return;
    const utc = c.round.replace(/^R\d+-/, '');
    const row = `| ${c.round} | ${utc} | ${c.sceneHash.slice(0, 12)} | ${p.records.review} ${c.final ? 'final' : 'milestone'} | ${Object.keys(c.graders).join(', ')} | ${c.verdict} | [${c.round}/REVIEW.md](${c.round}/REVIEW.md) |`;
    let end = header + 2;
    while (end < lines.length && lines[end].startsWith('|')) end += 1;
    const placeholder = lines.findIndex((line, index) => index > header && /^\|\s*—\s*\|/.test(line));
    if (placeholder >= 0 && placeholder < end) lines[placeholder] = row;
    else lines.splice(end, 0, row);
    fs.writeFileSync(full, lines.join(eol));
  }
  commitProgress(p, c, task) {
    const expectedHead = c.commits?.at(-1) ?? c.base;
    if (this.head() !== expectedHead) deny('apply commit must directly follow the prior change commit');
    const files = committableFiles(this.root, [...new Set([...c.paths, p.scene, this.taskDocument(p), task.taskDoc, task.summaryDoc])]
      .filter((name) => typeof name === 'string' && fs.existsSync(path.join(this.root, ...name.split('/')))));
    if (files.length) git(this.root, ['add', '--', ...files]);
    if (!gitText(this.root, ['diff', '--cached', '--name-only'])) deny('no apply files changed');
    git(this.root, ['commit', '-m', `apply: ${task.id} ${String(c.outcome).slice(0, 120)}`]);
    c.commits ??= [];
    c.commits.push(this.head());
    p.lastCommit = this.head();
  }
  commitTaskArtifacts(p, c, message, { manifest = true } = {}) {
    const files = [this.taskDocument(p), ...this.taskFiles(p, c), ...(manifest ? [c.manifestPath] : [])]
      .filter((name) => typeof name === 'string' && fs.existsSync(path.join(this.root, ...name.split('/'))));
    if (!files.length) return null;
    const dirty = gitText(this.root, ['status', '--porcelain', '--untracked-files=all', '--', ...files]);
    if (!dirty) return null;
    if (gitText(this.root, ['diff', '--cached', '--name-only'])) deny('index must be clean before task metadata commit');
    git(this.root, ['add', '--', ...files]);
    if (!gitText(this.root, ['diff', '--cached', '--name-only'])) return null;
    git(this.root, ['commit', '-m', String(message).slice(0, 200)]);
    c.commits ??= [];
    c.commits.push(this.head());
    p.lastCommit = this.head();
    return p.lastCommit;
  }
  tryCommitTaskArtifacts(p, c, task, message, options) {
    try {
      return this.commitTaskArtifacts(p, c, message, options);
    } catch (error) {
      if (!error?.gitTransient) throw error;
      task.commitPending = true;
      return null;
    }
  }
  commitShellApproval(session, project, record) {
    return this.transaction((s) => {
      if (!record || !/^[a-f0-9-]{36}$/i.test(record.id ?? '') || record.status !== 'approved'
        || typeof record.command !== 'string' || !record.command.trim()
        || typeof record.reasoning !== 'string' || record.reasoning.trim().length < 8) {
        deny('invalid shell approval record');
      }
      let p = null;
      let base;
      if (project) {
        p = Object.values(s.projects).find((item) => item.project === project);
        if (!p || p.orchestrator !== session) deny('shell approval project is not owned by this session');
        base = this.projectPath(project);
      } else {
        base = this.root;
      }
      const relativeDir = project ? 'Documents/Commands' : 'Commands';
      const recordName = `${relativeDir}/${record.id}.md`;
      const indexPath = `${relativeDir}/COMMANDS.md`;
      const full = contained(base, recordName, true);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      const text = [
        `# Shell Command ${record.id}`,
        '',
        `- Status: approved`,
        `- Scope: ${project ?? 'workspace'}`,
        `- Session: ${record.session}`,
        `- Created: ${record.created}`,
        `- Approved: ${record.approvedAt}`,
        `- CWD: ${record.cwd}`,
        '',
        '## Command',
        '',
        '```powershell',
        record.command,
        '```',
        '',
        '## Reasoning',
        '',
        record.reasoning.trim(),
        '',
      ].join('\n');
      fs.writeFileSync(full, text);
      const indexFull = contained(base, indexPath, true);
      const header = '# Shell Command Approvals\n\n| Command | Approved | Shell command | Reasoning |\n|---|---|---|---|\n';
      const existing = fs.existsSync(indexFull) ? fs.readFileSync(indexFull, 'utf8') : header;
      const escape = (value) => String(value ?? '').replaceAll('|', '\\|').replace(/[\r\n]+/g, ' ').slice(0, 160);
      const row = `| [${record.id}](${record.id}.md) | ${escape(record.approvedAt)} | ${escape(record.command)} | ${escape(record.reasoning)} |\n`;
      const index = existing.includes(`(${record.id}.md)`) ? existing : `${existing.replace(/\s*$/, '\n')}${row}`;
      fs.writeFileSync(indexFull, index);
      const files = [project ? `${project}/${recordName}` : recordName, project ? `${project}/${indexPath}` : indexPath];
      git(this.root, ['add', '--', ...files]);
      git(this.root, ['commit', '--only', '-m', `chore: record shell approval ${record.id.slice(0, 8)}`, '--', ...files]);
      const commit = this.head();
      if (p) {
        if (p.change) {
          p.change.commits ??= [];
          p.change.commits.push(commit);
        } else {
          p.checkpoint = commit;
          p.snapshot = this.snapshot(p.project);
        }
        p.lastCommit = commit;
      } else if (!project) {
        const owned = Object.values(s.projects).find((item) => item.orchestrator === session && !item.change);
        if (owned) {
          owned.checkpoint = commit;
          owned.snapshot = this.snapshot(owned.project);
          owned.lastCommit = commit;
        }
      }
      return { path: recordName, commit, project: project ?? null };
    });
  }
  stateMatchesCheckout(p) {
    if (!p?.scene || !fs.existsSync(path.join(this.root, ...p.scene.split('/')))) return false;
    try {
      git(this.root, ['merge-base', '--is-ancestor', p.checkpoint, 'HEAD']);
    } catch {
      return false;
    }
    return stable(this.snapshot(p.project)) === stable(p.snapshot);
  }
  autoCommit(p, c, message, { review = true } = {}) {
    this.mediaGate(p, c, { allowIntaken: true });
    const expectedHead = c.commits?.at(-1) ?? c.base;
    try {
      git(this.root, ['merge-base', '--is-ancestor', expectedHead, 'HEAD']);
    } catch {
      deny('commit must follow the prior change commit; HEAD is not a descendant of it');
    }
    const intervening = gitText(this.root, ['diff', '--name-only', `${expectedHead}..HEAD`, '--', p.project]).split(/\r?\n/).filter(Boolean);
    if (intervening.length) deny('project files changed outside the bounded change commit; restore them or start a new change');
    const artifacts = review ? this.reviewPaths(p, c) : [];
    const declared = new Set(c.paths);
    const taskDocument = this.taskDocument(p);
    const tracked = new Set(git(this.root, ['ls-files', '-z', '--', p.project]).split('\0').filter(Boolean));
    const files = committableFiles(this.root, [...new Set([...c.paths, p.scene, taskDocument, ...this.taskFiles(p, c), ...artifacts])]
      .filter((name) => typeof name === 'string' && (
        fs.existsSync(path.join(this.root, ...name.split('/')))
        || (declared.has(name) && name !== p.scene && name !== taskDocument && tracked.has(name))
      )));
    const allowed = new Set(files);
    const staged = gitText(this.root, ['diff', '--cached', '--name-only']).split(/\r?\n/).filter(Boolean);
    if (staged.some((name) => !allowed.has(name))) deny('index contains files outside the bounded change');
    if (files.length) git(this.root, ['add', '--', ...files]);
    externalBinaryPolicy(this.root, p.project, git(this.root, ['diff', '--cached', '--name-only', '--', p.project]).split(/\r?\n/).filter(Boolean));
    if (!gitText(this.root, ['diff', '--cached', '--name-only'])) deny('no review files changed');
    git(this.root, ['commit', '-m', message]);
    c.commits ??= [];
    c.commits.push(this.head());
    p.lastCommit = this.head();
    this.closeMediaForCommit(p, c, this.head());
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
      if (action === 'reclaim') {
        if (typeof args.project !== 'string' || !args.project.trim() || typeof args.reason !== 'string' || !args.reason.trim() || args.reason.length > 1000) deny('reclaim requires project and one bounded reason');
        const target = s.projects[args.project];
        if (!target) deny('project not found');
        if (target.orchestrator === session) return this.status(target, s);
        const stale = !target.change || target.change.deadline < Date.now();
        if (!stale) deny('project owner has a live change window; pause it before reclaiming');
        if (!this.stateMatchesCheckout(target)) deny('stale registration does not match this checkout; use forget {project,reason} to discard it, then prepare a fresh project');
        const from = target.orchestrator;
        target.orchestrator = session;
        target.goalActive = true;
        target.paused = null;
        target.reclaimed = { from, at: new Date().toISOString(), reason: args.reason.trim() };
        return this.status(target, s);
      }
      if (action === 'forget') {
        if (Object.keys(args).some((key) => !['project', 'reason'].includes(key)) || typeof args.project !== 'string' || !args.project || typeof args.reason !== 'string' || !args.reason.trim() || args.reason.length > 1000) deny('forget requires project and one bounded reason');
        const target = s.projects[args.project];
        if (!target) deny('project not found');
        if (target.change && target.change.deadline >= Date.now()) deny('project has a live change; pause or finish it first');
        if (target.change?.pending) deny('project has a pending operation; recover it first');
        if (this.stateMatchesCheckout(target)) deny('registration matches this checkout; use status or recover instead of forgetting it');
        delete s.projects[args.project];
        return { forgotten: args.project, reason: args.reason.trim(), next: 'Scaffold or prepare a fresh project with this name.' };
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
        p.lastRenders = null;
        p.assetCheck = null;
        p.exports = [];
        return this.reregisterStatus(p);
      }
      const c = p.change;
      const allowRosterDrift = Boolean((c && ['review','self-review','approval','preserve','commit','checkpoint','seal','grader-fail','abandon'].includes(action)) || ['goal-active','goal-inactive','goal-complete'].includes(action));
      this.fresh(p, { allowRosterDrift });
      if (action === 'media-request') {
        this.mediaRequest(p, args);
        return this.status(p, s);
      } else if (action === 'media-complete') {
        this.mediaComplete(p, args);
        return this.status(p, s);
      } else if (action === 'media-fail') {
        this.mediaFail(p, args);
        return this.status(p, s);
      } else if (action === 'goal-active') {
        if (p.complete || (args.objective !== undefined && normalizeGoal(args.objective) !== normalizeGoal(p.records.goalText))) deny('goal must match registered prompt');
        p.goalActive = true;
      } else if (action === 'goal-inactive') {
        p.goalActive = false;
      } else if (action === 'goal-complete') {
        const last = p.history.at(-1);
        if (!p.goalActive || c || !last || !['PASS', 'DOCUMENT'].includes(last.verdict) || last.approval === 'Request revision' || this.hash(p.scene) !== last.sceneHash || !p.lastRender || this.hash(p.lastRender.path) !== p.lastRender.hash) deny('completion requires active goal, checkpoint, inspected render, unchanged scene and applicable PASS');
        if (p.lastRenders && Object.values(p.lastRenders).some((render) => !fs.existsSync(path.join(this.root, ...render.path.split('/'))) || this.hash(render.path) !== render.hash)) deny('completion requires every sealed scene render to remain unchanged');
        if (p.assetUse && (!p.assetCheck || p.assetCheck.sceneHash !== last.sceneHash)) deny('completion requires check_assets on the final unchanged scene; import or repair the asset receipt first');
        for (const receipt of p.exports ?? []) {
          const full = path.join(this.root, ...receipt.path.split('/'));
          if (!fs.existsSync(full) || this.hash(receipt.path) !== receipt.sha256) deny(`completion requires a valid export receipt: ${receipt.path}`);
        }
        if (!p.history.some((item) => item.final && item.verdict === 'PASS')) deny('completion requires a final full-spec PASS after milestone reviews');
        this.assertCommitted(p.project, this.snapshot(p.project));
        p.complete = true;
        this.commitTaskTrackerCompletion(p);
      } else if (action === 'escalate') {
        const prior = p.history.at(-1);
        if (c || p.complete || p.escalation || !prior || prior.verdict === 'BOOTSTRAP' || prior.chain < p.records.maxRounds || typeof args.reason !== 'string' || !args.reason.trim() || args.reason.length > 1000) deny('explicit escalation requires a completed capped review and a bounded reason');
        const maxRounds = args.max_rounds ?? p.records.maxRounds;
        if (!Number.isInteger(maxRounds) || maxRounds < 1 || maxRounds > 4 || maxRounds < p.records.maxRounds) deny('escalation may extend max_rounds up to 4');
        p.escalation = { requested: Date.now(), reason: args.reason, maxRounds };
      } else if (action === 'begin') {
         if (c || p.complete || p.escalation || !p.goalActive) deny('one open logical change per project; prior checkpoint and active goal required');
        if (this.openMedia(p)) deny('resolve the open media request before beginning another change');
        if (typeof args.outcome !== 'string' || !args.outcome.trim() || args.outcome.length > 1000 || !Array.isArray(args.objects) || args.objects.length > 200 || args.objects.some((n) => typeof n !== 'string' || !/^[\x20-\x7e]{1,100}$/.test(n))) deny('bounded outcome and exact object names required');
        if (args.final !== undefined && typeof args.final !== 'boolean') deny('final must be boolean');
        if (args.media !== undefined && typeof args.media !== 'boolean') deny('media must be boolean');
        const milestone = args.final === true ? 'final' : args.milestone ?? args.outcome;
        if (typeof milestone !== 'string' || !milestone.trim() || milestone.length > 200) deny('milestone must be a bounded non-empty string');
        if (args.requirements !== undefined && (!Array.isArray(args.requirements) || args.requirements.length > 50 || args.requirements.some((item) => typeof item !== 'string' || !item.trim()))) deny('requirements must be an array of non-empty strings');
        if (args.scenes !== undefined && (!Array.isArray(args.scenes) || args.scenes.length > MAX_CHANGE_SCENES || args.scenes.some((name) => !validSceneName(name)) || new Set(args.scenes).size !== args.scenes.length)) deny(`scenes must be up to ${MAX_CHANGE_SCENES} unique printable scene names`);
        if (args.sceneRequirements !== undefined) {
          if (!isPlainObject(args.sceneRequirements)) deny('sceneRequirements must be an object');
          for (const [requirement, scenes] of Object.entries(args.sceneRequirements)) {
            if (!args.requirements?.includes(requirement)) deny(`sceneRequirements key is not a declared requirement: ${requirement}`);
            if (!Array.isArray(scenes) || !scenes.length || scenes.some((name) => !validSceneName(name))) deny(`sceneRequirements.${requirement} must list printable scene names`);
          }
        }
        if (!Array.isArray(args.paths) || !args.paths.length || args.paths.length > 100) deny('exact project-relative file paths required');
        const paths = [...new Set(args.paths.map((name) => {
          const full = contained(this.projectPath(p.project), name, true);
          const clean = path.relative(this.projectPath(p.project), full).replaceAll('\\', '/');
          if (/\.(?:py|js|mjs|ts|cmd|ps1|exe|dll|blend\d*)$/i.test(clean) && !/^scripts\/.*\.(?:py|pyw)$/i.test(clean) && `${p.project}/${clean}` !== p.scene) deny('production scope cannot add executable files except source-only scripts');
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
         if (prior?.verdict !== undefined && !['PASS', 'BOOTSTRAP', 'WIP', 'DOCUMENT', 'ABANDONED'].includes(prior.verdict) && !args.revision) deny('failed review permits correction only');
        const chain = args.revision ? (prior?.chain ?? 0) + 1 : 1;
        if (chain > p.records.maxRounds || prior?.approval === 'Request revision' && !args.revision) deny('review cap reached or user requested revision; explicit user escalation required');
        this.ensureTaskLedger(p);
        const sceneExists = fs.existsSync(path.join(this.root, p.scene));
        if (args.media === true && !sceneExists) deny('media generation requires the initial scene saved and committed; finish the bootstrap save and checkpoint first');
        p.change = {
          id: crypto.randomUUID(), created: Date.now(), outcome: args.outcome, milestone: milestone.trim(),
          requirements: args.requirements ? [...new Set(args.requirements.map((item) => item.trim()))] : [],
          scenes: args.scenes ? [...new Set(args.scenes)] : [], primaryScene: args.scenes?.[0] ?? null,
          sceneRequirements: args.sceneRequirements ? structuredClone(args.sceneRequirements) : {},
          renders: {}, inspections: {},
          final: args.final === true, objects: [...new Set(args.objects)], paths, base: this.head(), chain, operations: 0,
          mediaRequired: args.media === true,
          deadline: Date.now() + CHANGE_WINDOW_MS, sealed: false, inspected: false, readyToSeal: false,
          wipRender: null, wipLook: null, commits: [], graders: {}, reports: {}, bootstrap: !sceneExists,
          documentOnly: paths.every(documentOnlyPath), nonSceneOnly: paths.every(nonScenePath), sceneHash: sceneExists ? this.hash(p.scene) : null,
        };
      } else if (action === 'extend') {
        if (!c || c.sealed || c.pending || c.documentOnly || c.readyToSeal) deny('extend requires an unsealed, unfinished scene change with no pending operation');
        if (args.objects !== undefined && (!Array.isArray(args.objects) || args.objects.length > 200 || args.objects.some((name) => typeof name !== 'string' || !/^[\x20-\x7e]{1,100}$/.test(name)))) deny('extend objects must be exact printable names');
        if (!Array.isArray(args.paths) || !args.paths.length || args.paths.length > 100) deny('extend requires exact project-relative paths');
        const added = [...new Set(args.paths.map((name) => {
          const full = contained(this.projectPath(p.project), name, true);
          const clean = path.relative(this.projectPath(p.project), full).replaceAll('\\', '/');
          if (/\.(?:py|js|mjs|ts|cmd|ps1|exe|dll|blend\d*)$/i.test(clean) && !/^scripts\/.*\.(?:py|pyw)$/i.test(clean) && `${p.project}/${clean}` !== p.scene) deny('production scope cannot add executable files except source-only scripts');
          return `${p.project}/${clean}`;
        }))];
        c.objects = [...new Set([...c.objects, ...(args.objects ?? [])])];
        if (c.objects.length > MAX_CHANGE_OBJECTS) deny(`changes are capped at ${MAX_CHANGE_OBJECTS} objects; split the milestone`);
        c.paths = [...new Set([...c.paths, ...added])];
        if (args.scenes !== undefined) {
          if (!Array.isArray(args.scenes) || args.scenes.length > MAX_CHANGE_SCENES || args.scenes.some((name) => !validSceneName(name))) deny(`scenes must be up to ${MAX_CHANGE_SCENES} printable scene names`);
          c.scenes = [...new Set([...(c.scenes ?? []), ...args.scenes])];
          if (c.scenes.length > MAX_CHANGE_SCENES) deny(`changes are capped at ${MAX_CHANGE_SCENES} scenes; split the milestone`);
          c.primaryScene ??= c.scenes[0];
        }
        if (args.sceneRequirements !== undefined) {
          if (!isPlainObject(args.sceneRequirements)) deny('sceneRequirements must be an object');
          for (const [requirement, scenes] of Object.entries(args.sceneRequirements)) {
            if (!c.requirements?.includes(requirement)) deny(`sceneRequirements key is not a declared requirement: ${requirement}`);
            if (!Array.isArray(scenes) || !scenes.length || scenes.some((name) => !validSceneName(name))) deny(`sceneRequirements.${requirement} must list printable scene names`);
          }
          c.sceneRequirements = { ...(c.sceneRequirements ?? {}), ...structuredClone(args.sceneRequirements) };
        }
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
        if (clean === TASKSTRACKER_DOCUMENT || clean.startsWith('Documents/Tasks/')) deny('the task tracker is harness-owned; it updates on ticket issue and completion');
        if (clean === 'Documents/MEDIA.md') deny('the media ledger is harness-owned; use media-request, media-complete, media-fail, or intake');
        try { validateDocument(clean, args.content); } catch (error) { deny(error.message); }
        fs.mkdirSync(path.dirname(full), { recursive: true });
        fs.writeFileSync(full, args.content);
      } else if (action === 'self-review') {
        if (!c?.inspected || p.records.review !== 'Off' || !args.notes?.trim()) deny('inspect sealed render before self-review');
        this.mediaGate(p, c, { allowIntaken: true });
        c.verdict = 'PASS'; c.notes = args.notes;
        const name = `${p.project}/Documents/Reviews/${c.round}/REVIEW.md`;
        const text = `# Orchestrator Self-review\n\nVerdict: PASS\nScene SHA-256: ${c.sceneHash}\nScenes: ${(c.scenes ?? []).join(', ') || 'active'}\nEvidence key: ${c.evidenceKey}\n\n${args.notes}\n`;
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
        let archivedReport = null;
        if (retryable) {
          const full = contained(this.root, existing.report, true);
          if (fs.existsSync(full)) {
            const text = fs.readFileSync(full, 'utf8');
            const parsed = graderReportVerdict(text, c);
            if (parsed.verdict && parsed.verdict !== 'BLOCKED') {
              existing.verdict = parsed.verdict;
              existing.kind = 'review';
              existing.recovered = new Date().toISOString();
              delete existing.error;
              c.reports ??= {};
              c.reports[existing.report] = digest(text);
              const task = p.tasks?.find((item) => item.token === existing.token);
              if (task && task.state === 'failed') this.recordTaskFinished(p, existing.token, { ok: true });
              this.updateManifest(p);
              return { recovered: true, report: existing.report, verdict: parsed.verdict, taskId: task?.id ?? null, next: 'Existing valid report recovered; aggregate it with review and do not overwrite it.' };
            }
            if (parsed.verdict === 'BLOCKED') {
              archivedReport = existing.report.replace(/\/REPORT\.md$/, `/REPORT.attempt${attempt}.md`);
              let suffix = 2;
              while (fs.existsSync(contained(this.root, archivedReport, true))) {
                archivedReport = existing.report.replace(/\/REPORT\.md$/, `/REPORT.attempt${attempt}-${suffix}.md`);
                suffix += 1;
              }
            }
          }
        }
        if (retryable && attempt >= 2) deny('grader retry budget exhausted; aggregate the round as blocked');
        if (Object.values(c.graders).filter((g) => g.child && !g.verdict && !g.error && Date.now() <= g.deadline).length >= p.records.maxParallel) deny('grader parallel limit reached');
        const token = crypto.randomUUID();
        const report = existing?.report ?? `${p.project}/Documents/Reviews/${c.round}/${g.name}/REPORT.md`;
        if (archivedReport) {
          const from = contained(this.root, report);
          const to = contained(this.root, archivedReport, true);
          fs.renameSync(from, to);
          c.reports ??= {};
          c.reports[archivedReport] = digest(fs.readFileSync(to, 'utf8'));
        }
        if (c.reports) delete c.reports[report];
        fs.mkdirSync(path.dirname(contained(this.root, report, true)), { recursive: true });
        const full = contained(this.root, report, true);
        if (fs.existsSync(full)) fs.rmSync(full);
        const deadline = Date.now() + g.max_minutes * 60000;
        c.graders[g.name] = { token, report, attempt: attempt + 1, deadline, steps: 0 };
        const task = this.recordGraderTask(p, token, g.name, report, deadline);
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
          `Model / reasoning: primary ${g.provider} / ${g.model} / ${g.variant}${g.backup ? `; backup ${g.backup.provider} / ${g.backup.model} / ${g.backup.variant}` : '; no backup configured'}`,
          `Milestone: ${c.milestone ?? c.outcome}`,
          `Requirements to grade: ${c.requirements?.length ? c.requirements.join(', ') : 'all requirements in the spec'}`,
          `Scenes to grade: ${(c.scenes ?? []).length ? c.scenes.join(', ') : 'active scene'}`,
          `Primary scene: ${c.primaryScene ?? 'active'}`,
          `Scene requirements: ${Object.keys(c.sceneRequirements ?? {}).length ? JSON.stringify(c.sceneRequirements) : 'none'}`,
          `Final full-spec review: ${c.final ? 'yes' : 'no'}`,
          `Review scope: ${c.final
            ? 'Final full-spec review. Grade the complete deliverable and every assigned requirement.'
            : 'Partial milestone review. Grade only this milestone and the requirements it advances. Treat future or unbuilt scope as deferred, not a finding; do not report absent future content as blocker or major.'}`,
          `Spec: ${Object.keys(p.records.specs).map(absolute).join(', ')}`,
          `Target: base ${c.base}, saved scene SHA-256 ${c.sceneHash}, project ${dirty}`,
          `Evidence key: ${c.evidenceKey}`,
          'Evidence files (read these exact paths):',
          ...evidenceLines,
          `Manifest: ${manifestPath}`,
          `Report path: ${reportPath}`,
          `Prior round: ${p.history.at(-1)?.round ?? 'none'}`,
          'Live inspection: not allowed; the only Blender tool a grader may call is blender_look {image:"<absolute assigned evidence image>"}',
          'User prompt: <verbatim user words for permitted live Blender calls>',
          'Prior findings / dispositions: <orchestrator-supplied re-review context or none>',
          `Budget: ${g.max_minutes} minutes, ${g.max_steps} steps; reserve at least one step for the report write`,
          'Report timing: read REQUIREMENTS.md, the goal brief, the named prior report, and the assigned evidence only; skip optional docs. Write the assigned REPORT.md before your final step. A denied optional look or a nearly exhausted budget is not a reason to stop without a report: write the verdict from the evidence you have.',
          `Deadline UTC / rounds already used: ${new Date(deadline).toISOString()}`,
          'Stop: missing evidence/spec, out-of-folder path, scene edit request, budget reached',
          'Output: verdict, findings, <= 20 lines',
        ].join('\n');
        return { token, marker: `HARNESS_GRADER:${token}`, grader: g, model: modelSummary(g), report, reportPath, evidenceFiles: evidenceLines, prompt, taskId: task.id,
          sceneHash: c.sceneHash, evidenceKey: c.evidenceKey, evidence: c.evidence, round: c.round, goal: `${p.project}/${p.goal}` };
      } else if (action === 'grader-fail') {
        if (Object.keys(args).some((key) => !['name', 'reason'].includes(key))) deny('grader-fail accepts name and reason only');
        if (!c?.sealed || c.verdict || p.records.review === 'Off') deny('grader failure requires an unaggregated sealed review');
        if (typeof args.name !== 'string' || typeof args.reason !== 'string' || !args.reason.trim() || args.reason.length > 500) deny('grader-fail requires name and one bounded reason');
        const g = p.records.roster.find((item) => item.name === args.name);
        if (!g) deny('unknown grader');
        const assignment = c.graders[g.name];
        if (!assignment) deny('grader has not been dispatched');
        if (assignment.verdict) deny('grader already has a verdict');
        assignment.verdict = 'BLOCKED';
        assignment.error = args.reason.trim();
        assignment.kind = 'tooling';
        const task = p.tasks?.find((item) => item.token === assignment.token);
        if (task) this.recordTaskFinished(p, assignment.token, { ok: false, error: assignment.error });
        this.updateManifest(p);
        if (task) this.tryCommitTaskArtifacts(p, c, task, `task: ${task.id} ${task.state}`, { manifest: false });
        return this.status(p, s);
      } else if (action === 'review') {
        if (!c?.inspected || p.records.review === 'Off' || c.verdict) deny('sealed inspection required once before review');
        this.mediaGate(p, c, { allowIntaken: true });
        if (!args.notes?.trim() || !args.reason?.trim() || !args.dispositions?.trim()) deny('review requires notes, correction/no-correction reasoning, and finding dispositions');
        for (const roster of p.records.roster) {
          const g = c.graders[roster.name];
          if (g && !g.verdict && (g.error || Date.now() > g.deadline || ((g.attempt ?? 0) >= 2 && !g.child))) {
            g.verdict = 'BLOCKED';
            g.error ??= `grader deadline exceeded or retries exhausted before collection: ${roster.name}`;
            const task = p.tasks?.find((item) => item.token === g.token);
            if (task) this.recordTaskFinished(p, g.token, { ok: false, error: g.error });
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
          `Scenes: ${(c.scenes ?? []).join(', ') || 'active'}`,
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
        this.updateReviewIndex(p, c);
        this.updateManifest(p);
        if (p.records.workflow === 'Fully Autonomous' && c.verdict !== 'BLOCKED') this.autoCommit(p, c, `review: ${c.round} ${c.verdict}`);
      } else if (action === 'commit') {
        if (!c || c.pending) deny('open change with no pending operation required');
        if (typeof args.message !== 'string' || !args.message.trim() || args.message.length > 200 || /[\r\n]/.test(args.message)) deny('one bounded commit message required');
        if (args.mode !== undefined && args.mode !== 'wip') deny('commit mode must be wip when provided');
        const bootstrap = Boolean(c.bootstrap && c.saved && !c.sealed && !c.operations);
        const documentOnly = Boolean(c.nonSceneOnly && c.operations === 0 && this.hash(p.scene) === c.sceneHash);
        if (args.mode === 'wip') {
          if (!c.failure && Date.now() <= c.deadline) deny('WIP commit requires a failed or expired change');
          if (c.verdict) deny('reviewed changes use the normal commit path');
          const dirty = gitText(this.root, ['status', '--porcelain', '--untracked-files=all', '--', p.project]);
          if (c.operations === 0 && !dirty) {
            p.history.push({ id: c.id, round: null, verdict: 'WIP', commit: this.head(), sceneHash: c.sceneHash, chain: c.chain, final: Boolean(c.final), approval: null, empty: true });
            p.change = null;
            return this.status(p, s);
          }
          this.autoCommit(p, c, args.message.trim(), { review: false });
          c.wip = true;
          c.verdict = 'WIP';
        } else {
          if (!bootstrap && !documentOnly && !c.verdict) deny('complete review before committing the change');
          this.autoCommit(p, c, args.message.trim(), { review: !bootstrap && !documentOnly });
        }
      } else if (action === 'abandon') {
        if (Object.keys(args).some((key) => key !== 'reason') || typeof args.reason !== 'string' || !args.reason.trim() || args.reason.length > 1000) deny('abandon requires one bounded reason');
        if (!c) deny('no open change to abandon');
        if (c.sealed) deny('sealed changes cannot be abandoned; finish review or preserve a tooling block');
        if (c.operations > 0) deny('abandon is for changes with no applied operations; use commit {mode:"wip"} or preserve for a failed change');
        if (c.sceneHash !== null && this.hash(p.scene) !== c.sceneHash) deny('scene changed since the change began; commit or restore before abandoning');
        if (gitText(this.root, ['status', '--porcelain', '--untracked-files=all', '--', p.project])) deny('change has uncommitted project files; commit or restore before abandoning');
        const token = c.pending, t = s.tickets[token];
        if (t) {
          const live = t.state === 'running' && Date.now() - (t.started ?? t.created) <= TICKET_TTL_MS;
          if (live) deny('cannot abandon a live operation; wait for it to finish or expire');
          t.state = 'abandoned';
          const task = p.tasks?.find((item) => item.token === token);
          if (task && task.state !== 'done' && task.state !== 'failed') {
            task.state = 'abandoned';
            task.finished = new Date().toISOString();
            task.result = 'abandoned';
            this.writeTaskDocument(p, task);
            this.writeTaskSummary(p, task);
            this.writeTaskLedger(p);
          }
        }
        p.history.push({ id: c.id, round: null, verdict: 'ABANDONED', commit: this.head(), sceneHash: c.sceneHash, chain: c.chain, final: Boolean(c.final), approval: null, reason: args.reason.trim() });
        p.change = null;
        return this.status(p, s);
      } else if (action === 'preserve') {
        if (Object.keys(args).some((key) => key !== 'reason') || typeof args.reason !== 'string' || !args.reason.trim() || args.reason.length > 1000) deny('preserve requires one bounded reason');
        if (!c?.sealed || c.verdict !== 'BLOCKED' || c.blockingKind !== 'tooling') deny('preserve requires a sealed tooling-blocked change');
        if (c.preserved) deny('change is already preserved');
        c.preserved = { reason: args.reason.trim(), at: new Date().toISOString() };
        c.wip = true;
        c.verdict = 'WIP';
        c.blockingKind = null;
        this.updateManifest(p);
        this.autoCommit(p, c, `chore: preserve tooling-blocked ${c.round ?? 'review'}`);
      } else if (action === 'approval') {
        if (!c?.verdict || p.records.workflow !== 'Partially Autonomous') deny('complete review before approval');
        c.approvalQuestion ??= `${c.outcome} Review verdict: ${c.verdict}. Approve change or request revision? HARNESS CHANGE ${c.id} ${c.evidenceKey}`;
        return { question: c.approvalQuestion, labels: ['Approve change', 'Request revision', 'Pause'], outcome: c.outcome, verdict: c.verdict };
      } else if (action === 'checkpoint') {
        if (!c) deny('no open change to checkpoint');
        this.mediaGate(p, c);
        const bootstrap = Boolean(c.bootstrap && c.saved && !c.sealed && !c.operations);
        const wip = Boolean(c.wip);
        const documentOnly = Boolean(c.nonSceneOnly && c.operations === 0 && this.hash(p.scene) === c.sceneHash);
        const failedReview = c.verdict && !['PASS', 'WIP'].includes(c.verdict);
        if (c.verdict === 'BLOCKED' && c.blockingKind === 'tooling') deny('retry the tooling-blocked grader before checkpoint');
        const partialApprovalRequired = p.records.workflow === 'Partially Autonomous' && !documentOnly && (!c.approval || c.approval.evidence !== c.evidenceKey);
        if (!bootstrap && !wip && !documentOnly && (!c.verdict || !c.inspected || this.reviewPending(p, c) || c.pending || (failedReview && p.records.workflow === 'Partially Autonomous' && c.approval?.label !== 'Request revision') || partialApprovalRequired)) deny('review commit and runtime-captured approval required before checkpoint');
        if (this.head() === c.base) deny('commit missing; commit exact scoped files first');
        const changed = gitText(this.root, ['diff', '--name-only', `${c.base}..HEAD`, '--', p.project]).split(/\r?\n/).filter(Boolean);
        const reviewed = bootstrap || documentOnly || (wip && !c.preserved) ? [] : this.reviewPaths(p, c);
        const allowed = new Set([...c.paths, p.scene, this.taskDocument(p), ...reviewed, ...this.taskFiles(p, c)]);
        const taskPrefix = `${p.project}/Documents/Tasks/`;
        const commandPrefix = `${p.project}/Documents/Commands/`;
        if (!changed.length || changed.some((name) => !allowed.has(name) && !name.startsWith(taskPrefix) && !name.startsWith(commandPrefix))) deny('commit contains files outside bounded change');
        for (const name of [p.scene, ...reviewed]) {
          if (!gitText(this.root, ['ls-files', '--error-unmatch', '--', name])) deny('required deliverable missing from checkpoint');
        }
        externalBinaryPolicy(this.root, p.project, git(this.root, ['ls-files', '-z', '--', p.project]).split('\0').filter(Boolean));
        const snapshot = this.snapshot(p.project); this.assertCommitted(p.project, snapshot);
        p.history.push({ id: c.id, round: c.round ?? null, verdict: bootstrap ? 'BOOTSTRAP' : wip ? 'WIP' : documentOnly ? 'DOCUMENT' : c.verdict, commit: this.head(), sceneHash: c.sceneHash, chain: c.chain, final: Boolean(c.final), approval: c.approval?.label ?? null });
        p.checkpoint = this.head(); p.snapshot = snapshot;
        if (!bootstrap && !wip && !documentOnly && c.verdict === 'PASS') {
          p.lastRender = { path: c.renderPath, hash: this.hash(c.renderPath) };
          p.lastRenders = Object.fromEntries(Object.entries(c.renders ?? {}).map(([name, render]) => [name, { path: render, hash: this.hash(render) }]));
        }
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
      if (['apply', 'save', 'seal', 'wip'].includes(operation)) this.mediaGate(p, c, { allowIntaken: true });
      if (operation === 'apply' && c.bootstrap) deny('bootstrap change accepts save only; save the scene, commit, checkpoint, then begin a scene change');
      if (operation === 'apply' && c.documentOnly) deny('document-only changes cannot apply scene operations; begin a scene change');
      if (operation === 'seal' && c.bootstrap) deny('bootstrap save cannot be sealed or graded; commit the saved scene and call checkpoint, then begin a scene change');
      if (operation === 'seal' && c.documentOnly) deny('document-only changes commit without sealing or review');
      const recovery = Boolean(c.failure || Date.now() > c.deadline);
      if (operation === 'wip' && (c.bootstrap || c.documentOnly || !c.operations || c.sealed)) deny('WIP render requires an unsealed scene change with at least one apply');
      if (operation === 'seal' && c.operations === 0 && !recovery) deny('seal requires at least one apply operation; document-only changes commit without sealing');
      if (operation === 'seal' && !recovery && !c.readyToSeal) deny('finalize the declared milestone before sealing');
      if (operation === 'seal' && !recovery && (!c.wipLook || c.wipLook.operations !== c.operations)) deny('seal requires a WIP render and blender_look receipt from the current apply state');
      const wipDue = c.operations > 0 && c.operations % 3 === 0 && (!c.wipRender || c.wipRender.operations !== c.operations);
      const wipLookDue = c.wipRender?.operations === c.operations && (!c.wipLook || c.wipLook.operations !== c.operations);
      if (operation === 'apply' && (wipDue || wipLookDue)) deny('apply blocked: WIP render and blender_look receipt required after every third apply; follow status.nextStep');
      if (!['apply', 'save', 'seal', 'wip'].includes(operation)) deny('unknown operation');
      const token = crypto.randomUUID();
      s.tickets[token] = { session, project: p.project, change: c.id, operation, payload, created: Date.now(), state: 'issued' };
      c.pending = token;
      const task = this.recordTaskIssued(p, token, operation, payload, s.tickets[token].created + TICKET_TTL_MS);
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
      t.state = 'running'; t.started = Date.now(); t.pid = process.pid;
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
          const task = p.tasks?.find((item) => item.token === token);
          if (task && !result.completed) this.commitTaskArtifacts(p, c, `task: ${task.id} ${task.state}`);
          return;
        }
        if (t.operation === 'apply') {
          delete c.failure; delete c.reopen; c.operations++; c.deadline = Date.now() + CHANGE_WINDOW_MS; c.saved = true; c.sceneHash = this.hash(p.scene);
          const touched = sceneNamesFromOperations(t.payload);
          const deleted = (Array.isArray(t.payload?.operations) ? t.payload.operations : [t.payload])
            .filter((operation) => operation?.operation === 'delete_scene' && validSceneName(operation.name))
            .map((operation) => operation.name);
          c.scenes = [...new Set([...(c.scenes ?? []), ...touched])].filter((name) => !deleted.includes(name));
          c.primaryScene ??= c.scenes[0] ?? null;
        }
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
        c.renders = result.renders ?? (result.renderPath ? { [result.primaryScene ?? 'active']: result.renderPath } : {});
        c.scenes = result.scenes ?? c.scenes ?? [];
        c.primaryScene = result.primaryScene ?? c.scenes[0] ?? null;
        c.inspections = {};
        c.inspected = false;
        c.evidenceKey = digest(stable({ scene: c.sceneHash, specs: p.records.specs, evidence: c.evidence }));
        c.manifestPath = `${p.project}/Documents/Reviews/${c.round}/manifest.json`;
        c.manifestHash = this.hash(c.manifestPath);
      }
      if (t.operation === 'apply') {
        const operations = (result.operationResults ?? []).map((item) => item.operation);
        if (operations.some((name) => ASSET_USING_OPERATIONS.has(name))) p.assetUse = true;
        if (operations.includes('check_assets') && checkAssetsStrict(t.payload)) c.assetChecked = true;
        for (const item of result.operationResults ?? []) {
          if (item.operation === 'check_assets' && item.receipt?.strict === true) c.assetCheckReceipt = item.receipt;
          if (item.operation !== 'export_scene' || !item.receipt?.path) continue;
          p.exports = [...(p.exports ?? []).filter((receipt) => receipt.path !== item.receipt.path), { ...item.receipt, change: c.id, at: new Date().toISOString() }];
        }
      }
      if (t.operation === 'seal' && c.assetChecked) {
        p.assetCheck = { sceneHash: c.sceneHash, change: c.id, at: new Date().toISOString(), receipt: c.assetCheckReceipt ?? null };
      }
      this.recordTaskFinished(p, token, result);
      if (t.operation === 'apply') {
        const task = p.tasks?.find((item) => item.token === token);
        if (task) this.commitProgress(p, c, task);
      }
      if (t.operation === 'wip') {
        const task = p.tasks?.find((item) => item.token === token);
        if (task) this.commitTaskArtifacts(p, c, 'task: ' + task.id + ' ' + task.state);
      }
      if (t.operation === 'seal') {
        const task = p.tasks?.find((item) => item.token === token);
        if (task) this.commitTaskArtifacts(p, c, `task: ${task.id} ${task.state}`, { manifest: false });
        if (c.manifestPath) this.updateManifest(p);
      }
      return this.status(p, s);
    });
  }
  graderAssignment(state, child) {
    for (const p of Object.values(state.projects)) {
      for (const [name, g] of Object.entries(p.change?.graders ?? {})) if (g.child === child) return { p, name, g };
    }
    return null;
  }
  bindWorkerByToken(orchestrator, child, token) {
    return this.transaction((s) => {
      const p = this.owner(s, orchestrator);
      const task = p.tasks?.find((item) => item.token === token);
      if (!task || task.operation === 'save' || task.operation === 'seal' || task.operation === 'wip') return;
      const ticket = s.tickets[task.token];
      if (task.child && task.child !== child && ticket && ticket.state !== 'issued') deny('worker token is already bound to another child');
      if (task.child === child && task.state === 'running') return;
      task.child = child;
      if (task.state === 'issued') task.state = 'running';
      this.writeTaskDocument(p, task);
      this.writeTaskLedger(p);
    });
  }
  bindWorker(orchestrator, child, prompt = '') {
    return this.transaction((s) => {
      const p = this.owner(s, orchestrator);
      const tokens = [...String(prompt).matchAll(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi)].map((match) => match[0]);
      const task = p.tasks?.find((item) => tokens.includes(item.token)) ?? p.tasks?.find((item) => item.token === p.change?.pending);
      if (!task || task.operation === 'save' || task.operation === 'seal' || task.operation === 'wip') return;
      const ticket = s.tickets[task.token];
      if (task.child && task.child !== child) {
        if (ticket && ticket.state !== 'issued') deny('worker token is already bound to another child');
        task.child = child;
      } else if (task.child === child) {
        return;
      }
      task.child = child;
      if (task.state === 'issued') task.state = 'running';
      this.writeTaskDocument(p, task);
      this.writeTaskLedger(p);
      if (p.change && (task.state === 'done' || task.state === 'failed')) this.commitTaskArtifacts(p, p.change, `task: bind ${task.id} worker`);
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
      const role = modelRole(cfg, model);
      if (!role) {
        const detail = modelDiagnostics(cfg, model);
        deny(`grader runtime model does not match configured primary or backup; observed ${detail.observed}; expected ${detail.expected}`);
      }
      entry[1].child = child;
      entry[1].modelRole = role;
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
  failWorkerByToken(orchestrator, token, error) {
    return this.transaction((s) => {
      const p = this.owner(s, orchestrator);
      const task = p.tasks?.find((item) => item.token === token);
      if (!task || task.state === 'done' || task.state === 'failed') return;
      task.state = 'failed';
      task.finished = new Date().toISOString();
      task.result = String(error ?? 'worker task failed').slice(0, 300);
      this.writeTaskDocument(p, task);
      this.writeTaskSummary(p, task);
      this.writeTaskLedger(p);
      if (p.change) this.commitTaskArtifacts(p, p.change, `task: ${task.id} ${task.state}`);
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
      if (task && p.change) this.tryCommitTaskArtifacts(p, p.change, task, `task: ${task.id} ${task.state}`);
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
      if (g.verdict || (!reportWrite && (Date.now() > g.deadline || ++g.steps > cfg.max_steps))) deny('grader pass budget exhausted');
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
        if (task) this.tryCommitTaskArtifacts(p, p.change, task, `task: ${task.id} ${task.state}`, { manifest: false });
        this.updateManifest(p); return this.status(p, s);
      };
      const full = contained(this.root, g.report, true);
      if (!fs.existsSync(full)) return fail(`grader report missing: ${g.report}`);
      const text = fs.readFileSync(full, 'utf8');
      const parsed = graderReportVerdict(text, p.change);
      if (parsed.error === 'blocker') return fail(`PASS report contains blocker/major finding: ${g.report}`);
      if (parsed.error) return fail(`grader report invalid: ${g.report}`);
      const missingScene = (p.change.scenes ?? []).length > 1 ? p.change.scenes.find((name) => !text.includes(name)) : null;
      if (missingScene) return fail(`grader report does not cite scene ${missingScene}: ${g.report}`);
      g.verdict = parsed.verdict;
      g.kind = g.verdict === 'BLOCKED' ? 'tooling' : 'review';
      p.change.reports ??= {};
      delete p.change.reports[g.report];
      p.change.reports[g.report] = digest(text);
      const task = p.tasks?.find((item) => item.token === g.token);
      if (task) this.recordTaskFinished(p, g.token, { ok: g.verdict !== 'BLOCKED', error: g.verdict === 'BLOCKED' ? 'grader returned BLOCKED' : undefined });
      if (task) this.tryCommitTaskArtifacts(p, p.change, task, `task: ${task.id} ${task.state}`, { manifest: false });
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
      if (!c.sealed || c.evidence?.[relative] !== this.hash(relative)) return;
      const scene = Object.entries(c.renders ?? {}).find(([, render]) => render === relative)?.[0]
        ?? (relative === c.renderPath ? c.primaryScene ?? 'active' : null);
      if (!scene) return;
      c.inspections ??= {};
      c.inspections[scene] = { path: relative, hash: this.hash(relative), at: new Date().toISOString() };
      c.inspected = sceneInspectionsComplete(c);
    });
  }

  recover(session, args = {}) {
    return this.transaction((s) => {
      if (Object.keys(args).some((key) => key !== 'reopen') || (args.reopen !== undefined && args.reopen !== true)) deny('recover accepts reopen:true only');
      const p = this.owner(s, session);
      this.fresh(p, { allowRosterDrift: true });
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
      const liveWriter = t?.state === 'running' && Date.now() - (t.started ?? t.created) <= TICKET_TTL_MS;
      const unexpired = t && t.state !== 'running' && Date.now() - t.created <= TICKET_TTL_MS;
      if (!t || liveWriter || unexpired) deny('no expired/dead operation; never release a live writer');
      const writerStarted = t.state === 'running';
      t.state = 'abandoned'; delete p.change.pending;
      const task = p.tasks?.find((item) => item.token === token);
      if (task) {
        task.state = 'abandoned';
        task.finished = new Date().toISOString();
        task.result = writerStarted ? 'abandoned after writer start' : 'expired before execution';
        this.writeTaskDocument(p, task);
        this.writeTaskSummary(p, task);
        this.writeTaskLedger(p);
        this.commitTaskArtifacts(p, p.change, `task: ${task.id} abandoned`);
      }
      if (writerStarted) {
        p.change.failure = 'Abandoned operation; inspect live scene, save and reseal before proceeding';
        p.change.deadline = 0;
      }
      return this.status(p, s);
    });
  }
}
