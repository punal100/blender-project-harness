import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { instanceStatus, launchProject, stopProject } from './blender.mjs';

export const digest = (data) => crypto.createHash('sha256').update(data).digest('hex');
export const normalizeGoal = (value) => typeof value === 'string' ? value.replace(/\r\n?/g, '\n').trim() : value;
const canonical = (value) => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])])) : value;
export const stable = (value) => JSON.stringify(canonical(value));
export const deny = (message) => { throw new Error(`Workflow gate: ${message}`); };
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
    const req = docs['Documents/REQUIREMENTS.md'];
    const confirmation = field(req, 'Confirmation');
    if (field(req, 'Status') !== 'Confirmed' || !date(field(req, 'Confirmed')) || !/[\p{L}\p{N}]/u.test(confirmation) || /^(TBD|Pending|Unset|<.*>)$/i.test(confirmation)) deny('requirements not confirmed');
    const workflow = field(docs['Documents/WORKFLOW.md'], 'Mode');
    const review = field(docs['Documents/REVIEW.md'], 'Mode');
    if (!['Fully Autonomous', 'Partially Autonomous'].includes(workflow) || !date(field(docs['Documents/WORKFLOW.md'], 'Selected'))) deny('workflow not selected');
    if (!['Off', 'All', 'Single'].includes(review) || !date(field(docs['Documents/REVIEW.md'], 'Selected'))) deny('review not selected');
    if (!/^Documents\/Goals\/\d+-[a-z0-9-]+\.md$/.test(goal ?? '')) deny('invalid goal path');
    const goalText = fs.readFileSync(contained(base, goal), 'utf8');
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
      if (!Number.isInteger(cfg.max_parallel) || cfg.max_parallel < 1 || cfg.max_parallel > names.size || !Number.isInteger(cfg.max_rounds) || cfg.max_rounds < 1 || cfg.max_rounds > 3) deny('invalid grader limits');
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
  updateManifest(p, extra = {}) {
    const c = p.change;
    if (!c?.manifestPath) return;
    const full = contained(this.root, c.manifestPath);
    const manifest = readJson(full);
    Object.assign(manifest, extra, { tasks: c.graders, verdict: c.verdict ?? null });
    const text = JSON.stringify(manifest, null, 2) + '\n';
    fs.writeFileSync(full, text);
    c.manifestHash = digest(text);
  }
  prepare(session, args) {
    return this.transaction((s) => {
      if (Object.keys(args).some((k) => !['project', 'goal', 'scene'].includes(k))) deny('prepare accepts project, goal and scene only');
      const records = this.records(args.project, args.goal);
      if (!/^[A-Za-z0-9 _-]+\.blend$/.test(args.scene ?? '')) deny('scene must be project-root .blend filename');
      contained(this.projectPath(args.project), args.scene, true);
      const prior = s.projects[args.project];
      const reRegister = Boolean(prior?.escalation?.requested && prior.orchestrator === session && !prior.change);
      if (s.challenge && Date.now() - s.challenge.created > 600000) s.challenge = null;
      if (s.challenge) {
        const c = s.challenge;
        if (c.session !== session) deny(`registration for ${c.project} is pending in another session; finish it there or wait 10 minutes for it to expire before preparing again`);
        const unchanged = c.project === args.project && c.goal === args.goal && c.scene === args.scene && this.head() === c.checkpoint && stable(this.snapshot(args.project)) === stable(c.snapshot) && stable(records) === stable(c.records);
        if (unchanged) return { question: c.question, labels: ['Confirm registration', 'Cancel'], details: { project: c.project, workflow: c.records.workflow, review: c.records.review, scene: c.scene, goal: c.goal } };
        s.challenge = null;
      }
      if (prior && !reRegister) deny('project already registered; use status to continue it, or escalate only after a capped review');
      if (Object.values(s.projects).some((p) => p.project === args.project && p.orchestrator !== session)) deny('project owned by another orchestrator');
      if (Object.values(s.projects).some((p) => p.orchestrator === session && p.project !== args.project)) deny('orchestrator already owns another project');
      const snapshot = this.snapshot(args.project);
      this.assertCommitted(args.project, snapshot);
      const question = `Register ${args.project}, scene ${args.scene}, goal ${args.goal}, workflow ${records.workflow}, review ${records.review}? HARNESS REGISTER ${crypto.randomUUID()}`;
      s.challenge = { ...args, records, session, question, snapshot, created: Date.now(), checkpoint: this.head(), reRegister };
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
        if (stable(this.snapshot(c.project)) !== stable(c.snapshot) || stable(this.records(c.project, c.goal)) !== stable(c.records) || this.head() !== c.checkpoint) deny('registration facts changed');
        const existing = s.projects[c.project];
        if (c.reRegister) {
          if (!existing || existing.orchestrator !== session || !existing.escalation?.requested || existing.change) deny('explicit escalation is no longer valid');
          Object.assign(existing, { scene: `${c.project}/${c.scene}`, goal: c.goal, records: c.records, snapshot: c.snapshot, checkpoint: c.checkpoint, goalActive: false, change: null, complete: false, escalation: null, lastRender: null });
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
  status(p) {
    const c = p.change;
    return { project: p.project, scene: p.scene, checkpoint: p.checkpoint, goalActive: p.goalActive, complete: p.complete, blender: instanceStatus(this.home),
       change: c ? { id: c.id, outcome: c.outcome, paths: c.paths, sealed: c.sealed, inspected: c.inspected, verdict: c.verdict, round: c.round, evidenceKey: c.evidenceKey, operations: c.operations, approved: Boolean(c.approval), graders: c.graders } : null,
       next: p.escalation ? 'Explicit re-registration required after escalation' : !p.goalActive ? 'Start/resume registered goal' : !c ? 'Begin bounded change' : !c.sealed ? 'Edit; save and seal' : !c.inspected ? 'look(image=<sealed render>)' : !c.verdict ? 'Complete required review' : p.records.workflow === 'Partially Autonomous' && !c.approval ? 'Pause goal and ask approval question' : 'Checkpoint scoped commit' };
  }
  command(session, action, args = {}) {
    return this.transaction((s) => {
      if (action === 'status') {
        const projects = Object.values(s.projects).filter((p) => p.orchestrator === session);
        if (projects.length === 1) return this.status(projects[0]);
        if (projects.length > 1) deny('session owns multiple projects; inspect workspace state before continuing');
        const pending = s.challenge?.session === session
          ? 'Answer the pending registration question, then start or resume the goal'
          : s.challenge ? `Another session is registering ${s.challenge.project}; wait for it to finish or expire`
            : 'Complete and commit scaffold docs, then call prepare and answer its registration question';
        return { project: null, scene: null, checkpoint: this.head(), goalActive: false, complete: false, change: null, blender: instanceStatus(this.home), next: pending };
      }
      const p = this.owner(s, session);
      this.fresh(p);
      const c = p.change;
      if (action === 'goal-active') {
        if (p.complete || (args.objective !== undefined && normalizeGoal(args.objective) !== normalizeGoal(p.records.goalText))) deny('goal must match registered prompt');
        p.goalActive = true;
      } else if (action === 'goal-complete') {
        const last = p.history.at(-1);
        if (!p.goalActive || c || !last || last.verdict !== 'PASS' || last.approval === 'Request revision' || this.hash(p.scene) !== last.sceneHash || !p.lastRender || this.hash(p.lastRender.path) !== p.lastRender.hash) deny('completion requires active goal, checkpoint, inspected render, unchanged scene and applicable PASS');
        this.assertCommitted(p.project, this.snapshot(p.project)); p.complete = true;
      } else if (action === 'escalate') {
        const prior = p.history.at(-1);
        if (c || p.complete || p.escalation || !prior || prior.verdict === 'BOOTSTRAP' || prior.chain < p.records.maxRounds || typeof args.reason !== 'string' || !args.reason.trim() || args.reason.length > 1000) deny('explicit escalation requires a completed capped review and a bounded reason');
        p.escalation = { requested: Date.now(), reason: args.reason };
      } else if (action === 'begin') {
         if (c || p.complete || p.escalation || !p.goalActive) deny('one open logical change per project; prior checkpoint and active goal required');
        if (typeof args.outcome !== 'string' || !args.outcome.trim() || args.outcome.length > 1000 || !Array.isArray(args.objects) || args.objects.length > 200 || args.objects.some((n) => typeof n !== 'string' || !/^[\x20-\x7e]{1,100}$/.test(n))) deny('bounded outcome and exact object names required');
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
         if (prior?.verdict !== undefined && !['PASS', 'BOOTSTRAP'].includes(prior.verdict) && !args.revision) deny('failed review permits correction only');
        const chain = args.revision ? (prior?.chain ?? 0) + 1 : 1;
        if (chain > p.records.maxRounds || prior?.approval === 'Request revision' && !args.revision) deny('review cap reached or user requested revision; explicit user escalation required');
        const sceneExists = fs.existsSync(path.join(this.root, p.scene));
        p.change = { id: crypto.randomUUID(), outcome: args.outcome, objects: [...new Set(args.objects)], paths, base: this.head(), chain, operations: 0, deadline: Date.now() + 900000, sealed: false, inspected: false, graders: {}, reports: {}, bootstrap: !sceneExists, sceneHash: sceneExists ? this.hash(p.scene) : null };
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
        if (c.verdict) deny('review already aggregated; begin a revision before re-dispatching graders');
        const existing = c.graders[g.name];
        const attempt = existing ? (existing.attempt ?? 1) : 0;
        const retryable = existing && (existing.error || (!existing.verdict && Date.now() > existing.deadline));
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
        this.updateManifest(p);
        const absolute = (name) => path.join(this.root, ...name.split('/'));
        const evidencePath = absolute(`${p.project}/Documents/Reviews/${c.round}/_evidence`);
        const reportPath = absolute(report);
        const dirty = gitText(this.root, ['status', '--porcelain', '--', p.project]) ? 'dirty' : 'clean';
        const prompt = [
          `HARNESS_GRADER:${token}`,
          `Round: ${c.round}`,
          `Project root: ${this.root}`,
          `Grader name / focus: ${g.name} / ${g.focus}`,
          `Spec: ${Object.keys(p.records.specs).map(absolute).join(', ')}`,
          `Target: base ${c.base}, saved scene SHA-256 ${c.sceneHash}, project ${dirty}`,
          `Evidence key: ${c.evidenceKey}`,
          `Evidence: ${evidencePath}`,
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
        return { token, marker: `HARNESS_GRADER:${token}`, grader: g, report, reportPath, evidencePath, prompt,
          sceneHash: c.sceneHash, evidenceKey: c.evidenceKey, evidence: c.evidence, round: c.round, goal: `${p.project}/${p.goal}` };
      } else if (action === 'review') {
        if (!c?.inspected || p.records.review === 'Off') deny('sealed inspection required before review');
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
        const name = `${p.project}/Documents/Reviews/${c.round}/REVIEW.md`;
        const text = fs.readFileSync(contained(this.root, name), 'utf8');
        if (!text.includes(`Verdict: ${c.verdict}`) || !text.includes(c.sceneHash) || !args.notes?.trim()) deny('aggregate needs exact verdict, scene hash and finding dispositions');
        c.reports[name] = digest(text); c.notes = args.notes;
        this.updateManifest(p);
      } else if (action === 'approval') {
        if (!c?.verdict || p.records.workflow !== 'Partially Autonomous') deny('complete review before approval');
        c.approvalQuestion ??= `${c.outcome} Review verdict: ${c.verdict}. Approve change or request revision? HARNESS CHANGE ${c.id} ${c.evidenceKey}`;
        return { question: c.approvalQuestion, labels: ['Approve change', 'Request revision', 'Pause'], outcome: c.outcome, verdict: c.verdict };
      } else if (action === 'checkpoint') {
        const bootstrap = Boolean(c?.bootstrap && c.saved && !c.sealed && !c.operations);
        const failedReview = c?.verdict && c.verdict !== 'PASS';
        const partialApprovalRequired = p.records.workflow === 'Partially Autonomous' && (!c.approval || c.approval.evidence !== c.evidenceKey);
        if (!bootstrap && (!c?.verdict || !c.inspected || c.pending || (failedReview && p.records.workflow === 'Partially Autonomous' && c.approval?.label !== 'Request revision') || partialApprovalRequired)) deny('review and runtime-captured approval required before checkpoint');
        if (this.head() === c.base) deny('commit missing; commit exact scoped files first');
        if (gitText(this.root, ['rev-parse', 'HEAD^']) !== c.base) deny('checkpoint must be exactly one commit after change base');
        const changed = git(this.root, ['diff-tree', '--no-commit-id', '--name-only', '-r', '-z', 'HEAD']).split('\0').filter(Boolean);
        const reviewed = bootstrap ? [] : [c.renderPath, ...Object.keys(c.reports), `${p.project}/Documents/Reviews/${c.round}/manifest.json`, `${p.project}/Documents/Reviews/README.md`];
        const allowed = new Set([...c.paths, p.scene, ...reviewed]);
        if (!changed.length || changed.some((name) => !allowed.has(name))) deny('commit contains files outside bounded change');
        for (const name of [p.scene, ...reviewed]) {
          if (!gitText(this.root, ['ls-files', '--error-unmatch', '--', name])) deny('required deliverable missing from checkpoint');
        }
        const snapshot = this.snapshot(p.project); this.assertCommitted(p.project, snapshot);
        p.history.push({ id: c.id, round: c.round ?? null, verdict: bootstrap ? 'BOOTSTRAP' : c.verdict, commit: this.head(), sceneHash: c.sceneHash, chain: c.chain, approval: c.approval?.label ?? null });
        p.checkpoint = this.head(); p.snapshot = snapshot;
        if (!bootstrap && c.verdict === 'PASS') p.lastRender = { path: c.renderPath, hash: this.hash(c.renderPath) };
        p.change = null;
      } else deny(`unknown action: ${action}`);
      return this.status(p);
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
       if (!c || c.sealed || c.pending || !p.goalActive || (operation === 'apply' && (c.failure || Date.now() > c.deadline || c.operations >= 40))) deny('open bounded change required; save/seal remains available after budget or failure');
      if (operation === 'seal' && c.bootstrap && c.operations === 0) deny('bootstrap save cannot be sealed or graded; commit the saved scene and call checkpoint, then begin a scene change');
      if (!['apply', 'save', 'seal'].includes(operation)) deny('unknown operation');
      const token = crypto.randomUUID();
      s.tickets[token] = { session, project: p.project, change: c.id, operation, payload, created: Date.now(), state: 'issued' };
      c.pending = token;
      return { token, operation, payload };
    });
  }
  authorize(session, token, operation, payload) {
    return this.transaction((s) => {
      const t = s.tickets[token];
      if (!t || t.session !== session || t.state !== 'issued' || t.operation !== operation || stable(t.payload) !== stable(payload) || Date.now() - t.created > 60000) deny('missing, stale, forged or replayed operation ticket');
      t.state = 'authorized';
    });
  }
  consume(token, operation, payload) {
    return this.transaction((s) => {
      const t = s.tickets[token];
      if (!t || t.state !== 'authorized' || t.operation !== operation || stable(t.payload) !== stable(payload) || Date.now() - t.created > 60000) deny('Kilo hook authorization missing or stale');
      const p = s.projects[t.project]; this.fresh(p);
      if (p.change?.id !== t.change || p.change.pending !== token) deny('ticket change mismatch');
      if (operation === 'apply' && (Date.now() > p.change.deadline || p.change.operations >= 40)) deny('operation budget exhausted');
      t.state = 'running'; t.pid = process.pid;
      return { project: p.project, scene: p.scene, goal: p.goal, previousRound: p.history.at(-1)?.round ?? null, change: structuredClone(p.change), records: p.records };
    });
  }
  finish(token, result) {
    return this.transaction((s) => {
      const t = s.tickets[token];
      if (!t || t.state !== 'running') deny('operation receipt has no running ticket');
      const p = s.projects[t.project], c = p.change;
      t.state = result.ok ? 'done' : 'failed'; delete c.pending;
       if (!result.ok) {
         c.failure = result.error;
         c.deadline = 0;
         if (result.round) c.failedRounds = [...new Set([...(c.failedRounds ?? []), result.round])];
         return;
       }
       delete c.failure;
        if (t.operation === 'apply') { c.operations++; c.saved = true; c.sceneHash = this.hash(p.scene); }
       else if (t.operation === 'save') { c.saved = true; c.sceneHash = this.hash(p.scene); }
      else {
        c.sealed = true; c.saved = true; c.sceneHash = this.hash(p.scene);
        c.round = result.round; c.renderPath = result.renderPath; c.evidence = result.evidence;
        c.evidenceKey = digest(stable({ scene: c.sceneHash, specs: p.records.specs, evidence: c.evidence }));
        c.manifestPath = `${p.project}/Documents/Reviews/${c.round}/manifest.json`;
        c.manifestHash = this.hash(c.manifestPath);
      }
      return this.status(p);
    });
  }
  graderAssignment(state, child) {
    for (const p of Object.values(state.projects)) {
      for (const [name, g] of Object.entries(p.change?.graders ?? {})) if (g.child === child) return { p, name, g };
    }
    return null;
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
      if (g.verdict || Date.now() > g.deadline || ++g.steps > cfg.max_steps) deny('grader pass budget exhausted');
      this.updateManifest(p);
      return { project: p.project, report: g.report, sceneHash: p.change.sceneHash, evidenceKey: p.change.evidenceKey };
    });
  }
  collectGrader(orchestrator, child) {
    return this.transaction((s) => {
      const assignment = this.graderAssignment(s, child);
      if (!assignment || assignment.p.orchestrator !== orchestrator) deny('completed task has no assigned grader');
      const { p, g } = assignment; this.fresh(p);
      const fail = (error) => { g.verdict = 'BLOCKED'; g.error = error; this.updateManifest(p); return this.status(p); };
      const full = contained(this.root, g.report, true);
      if (!fs.existsSync(full)) return fail(`grader report missing: ${g.report}`);
      const text = fs.readFileSync(full, 'utf8');
      const verdicts = [...text.matchAll(/^- Verdict: (PASS|CHANGES_REQUIRED|BLOCKED)\s*$/gm)];
      if (verdicts.length !== 1 || !text.includes(p.change.sceneHash) || !text.includes(p.change.evidenceKey)) return fail(`grader report invalid: ${g.report}`);
      if (verdicts[0][1] === 'PASS' && /\|\s*(blocker|major)\s*\|/i.test(text)) return fail(`PASS report contains blocker/major finding: ${g.report}`);
      g.verdict = verdicts[0][1]; p.change.reports[g.report] = digest(text);
      this.updateManifest(p);
      return this.status(p);
    });
  }
  inspect(session, image, succeeded) {
    if (!succeeded) return;
    return this.transaction((s) => {
      const p = this.owner(s, session); this.fresh(p);
      const c = p.change;
      if (!c?.sealed || typeof image !== 'string') return;
      const full = path.resolve(image);
      if (!full.startsWith(this.root + path.sep) || !fs.existsSync(full)) return;
      const relative = path.relative(this.root, full).replaceAll('\\', '/');
      if (relative !== c.renderPath || c.evidence?.[c.renderPath] !== this.hash(relative)) return;
      c.inspected = true;
    });
  }

  recover(session) {
    return this.transaction((s) => {
      const p = this.owner(s, session), token = p.change?.pending, t = s.tickets[token];
      if (!t || (t.state === 'running' && (!t.pid || (() => { try { process.kill(t.pid, 0); return true; } catch { return false; } })())) || t.state !== 'running' && Date.now() - t.created <= 60000) deny('no expired/dead operation; never release a live writer');
      const writerStarted = t.state === 'running';
      t.state = 'abandoned'; delete p.change.pending;
      if (writerStarted) {
        p.change.failure = 'Abandoned operation; inspect live scene, save and reseal before proceeding';
        p.change.deadline = 0;
      }
      return this.status(p);
    });
  }
}
