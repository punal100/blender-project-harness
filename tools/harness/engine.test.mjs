import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { Harness, contained } from './engine.mjs';

const tempRoot = path.join(os.tmpdir(), 'kilo');
fs.mkdirSync(tempRoot, { recursive: true });

function git(root, args, { allowFailure = false } = {}) {
  const result = spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 30_000,
    maxBuffer: 32 * 1024 * 1024,
  });
  if (!allowFailure && result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr?.trim() || result.error?.message}`);
  }
  return result.stdout ?? '';
}

function write(root, relative, content) {
  const full = path.join(root, ...relative.split('/'));
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, relative.endsWith('.md') && typeof content === 'string'
    ? content.replace(/\r?\n/g, '\r\n') : content);
  return full;
}

function read(root, relative) {
  return fs.readFileSync(path.join(root, ...relative.split('/')), 'utf8');
}

function commit(root, message, files = ['.']) {
  git(root, ['add', '--', ...files]);
  git(root, ['-c', 'user.name=Harness Tests', '-c', 'user.email=harness-tests@example.invalid', 'commit', '-m', message]);
}

function validGraderConfig(overrides = {}) {
  return {
    blender_subagents: {
      graders: {
        agent: 'blender-grader',
        enabled: true,
        max_parallel: 1,
        max_rounds: 1,
        graders: [{
          name: 'visual',
          focus: 'composition and materials',
          provider: 'fixture-provider',
          model: 'fixture-model',
          variant: 'fixture-variant',
          backup: { provider: 'backup-provider', model: 'backup-model', variant: 'backup-variant' },
          max_minutes: 1,
          max_steps: 4,
        }],
        ...overrides,
      },
    },
  };
}

function threeGraderConfig() {
  const grader = (name, focus) => ({
    name,
    focus,
    provider: 'fixture-provider',
    model: 'fixture-model',
    variant: 'fixture-variant',
    backup: { provider: 'backup-provider', model: 'backup-model', variant: 'backup-variant' },
    max_minutes: 5,
    max_steps: 10,
  });
  return {
    blender_subagents: {
      graders: {
        agent: 'blender-grader',
        enabled: true,
        max_parallel: 3,
        max_rounds: 2,
        graders: [
          grader('visual', 'composition, camera, lighting, and materials'),
          grader('technical', 'geometry, topology, render settings, and scene health'),
          grader('spec', 'requirements and acceptance fidelity'),
        ],
      },
    },
  };
}

function createProject(root, {
  name = 'Test',
  workflow = 'Fully Autonomous',
  review = 'Off',
  goalText,
} = {}) {
  const project = `Blender/${name}`;
  const goal = `${project}/Documents/Goals/01-test-goal.md`;
  const sceneName = 'scene.blend';
  const scene = `${project}/${sceneName}`;
  const prompt = goalText ?? [
    'Mission: exercise a bounded Blender workflow fixture with an authoritative scene.',
    'Visual outcome: preserve a reviewable saved scene and immutable evidence.',
    'Acceptance: every ticket, review, approval, and checkpoint gate must validate exact state.',
  ].join('\n');

  const sections = (names) => names.flatMap((name) => [`## ${name}`, `Fixture ${name.toLowerCase()}.`, '']);
  write(root, `${project}/README.md`, [
    '# Fixture project',
    'Status: Confirmed',
    'Last updated: 2026-10-31',
    '',
    ...sections(['Purpose', 'What this project is', 'Requirements', 'Visual direction', 'Deliverables', 'Project structure', 'Blender', 'Workflow', 'External assets', 'Goals', 'References', 'Open questions', 'Next steps']),
  ].join('\n'));
  write(root, `${project}/Documents/REQUIREMENTS.md`, [
    '# Requirements',
    'Status: Confirmed',
    'Defined: 2026-10-31',
    'Last updated: 2026-10-31',
    'Confirmed: 2026-10-31',
    'Confirmation: Fixture requirements confirmed for adversarial workflow tests.',
    '',
    ...sections(['Core value', 'Confirmed requirements', 'Constraints', 'Deferred', 'Out of scope', 'Open questions', 'Research notes', 'Change log']),
  ].join('\n'));
  write(root, `${project}/Documents/WORKFLOW.md`, [
    '# Workflow',
    `Mode: ${workflow}`,
    'Selected: 2026-10-31',
    'Last changed: 2026-10-31',
    '',
    ...sections(['Current mode', 'Rules', 'Change log']),
  ].join('\n'));
  write(root, `${project}/Documents/REVIEW.md`, [
    '# Review Mode',
    `Mode: ${review}`,
    'Selected: 2026-10-31',
    'Last changed: 2026-10-31',
    `Single grader: ${review === 'Single' ? 'visual' : '—'}`,
    '',
    ...sections(['Modes', 'Change log']),
  ].join('\n'));
  write(root, `${project}/Documents/ASSETS.md`, '# Fixture assets\n\n## Rules\n\nFixture asset rules.\n');
  write(root, `${project}/Documents/DECISIONS.md`, '# Fixture decisions\n');
  write(root, `${project}/Documents/TASKSTRACKER.md`, '# Task Tracker — Test\n\nStatus: Active\nLast updated: 2026-10-31\n\n## Tasks\n\n| Task | Kind | Change | Operation | Objects | Assigned | Child | State | Created | Finished | Result |\n|---|---|---|---|---|---|---|---|---|---|---|\n| — | — | — | — | — | — | — | — | — | — | — |\n');
  write(root, `${project}/Documents/Goals/01-test-goal.md`, [
    '# Goal: Fixture',
    ...['Mission', 'Project', 'Visual outcome', 'Scope', 'Deliverables', 'Acceptance', 'Workflow', 'Done'].flatMap((name) => [`## ${name}`, prompt, '']),
  ].join('\n'));
  write(root, `${project}/Documents/Reviews/README.md`, '# Review rounds\n\n## Index\n\nFixture index.\n\n## Rules\n\nFixture rules.\n');
  write(root, `${project}/Documents/Reviews/.gitignore`, '_evidence/\ntmp/\n');
  write(root, `${project}/.gitignore`, 'logs/\nrenders/wip/**\n');
  write(root, `${project}/.gitattributes`, '*.md text eol=crlf\n');
  write(root, scene, Buffer.from('fixture blend bytes\n'));
  write(root, `${project}/notes.txt`, 'initial notes\n');

  return { project, goal, scene, sceneName, prompt: read(root, goal) };
}

function fixture({
  workflow = 'Fully Autonomous',
  review = 'Off',
  commitInitial = true,
  config = true,
  configValue,
  goalText,
} = {}) {
  const root = fs.mkdtempSync(path.join(tempRoot, 'repo-'));
  const stateRoot = fs.mkdtempSync(path.join(tempRoot, 'state-'));
  const project = createProject(root, { workflow, review, goalText });
  if (review !== 'Off' && config !== false) {
    write(root, 'config.json', JSON.stringify(configValue ?? validGraderConfig(), null, 2));
  } else if (configValue !== undefined) {
    write(root, 'config.json', JSON.stringify(configValue, null, 2));
  }
  git(root, ['init', '--quiet']);
  git(root, ['config', 'user.name', 'Harness Tests']);
  git(root, ['config', 'user.email', 'harness-tests@example.invalid']);
  if (commitInitial) commit(root, 'scaffold fixture');
  const harness = new Harness(root, { stateRoot });
  return {
    root,
    stateRoot,
    harness,
    ...project,
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
      fs.rmSync(stateRoot, { recursive: true, force: true });
    },
  };
}

function useFixture(t, options) {
  const f = fixture(options);
  t.after(() => f.cleanup());
  return f;
}

function gate(fn, pattern = /Workflow gate:/) {
  assert.throws(fn, pattern);
}

function registrationQuestion(prepared) {
  return {
    questions: [{
      question: prepared.question,
      options: prepared.labels.map((label) => ({ label })),
      custom: false,
      multiple: false,
    }],
  };
}

test('registration accepts question args without custom or multiple flags', (t) => {
  const f = useFixture(t);
  const prepared = f.harness.prepare('orchestrator', { project: f.project, goal: f.goal.slice(f.project.length + 1), scene: f.sceneName });
  f.harness.question('orchestrator', {
    questions: [{ question: prepared.question, options: prepared.labels.map((label) => ({ label })) }],
  }, [['Confirm registration']]);
  assert.match(f.harness.command('orchestrator', 'status').next, /registered goal/);
});

test('custom-answer questions do not register', (t) => {
  const f = useFixture(t);
  const prepared = f.harness.prepare('orchestrator', { project: f.project, goal: f.goal.slice(f.project.length + 1), scene: f.sceneName });
  f.harness.question('orchestrator', {
    questions: [{ question: prepared.question, options: prepared.labels.map((label) => ({ label })), custom: true }],
  }, [['Confirm registration']]);
  assert.equal(f.harness.command('orchestrator', 'status').project, null);
});

test('status reports an unregistered phase instead of denying', (t) => {
  const f = useFixture(t);
  const status = f.harness.command('orchestrator', 'status');
  assert.equal(status.project, null);
  assert.match(status.next, /prepare/);
});

test('unregistered status asks prepare when multiple goal documents exist', (t) => {
  const f = useFixture(t);
  write(f.root, `${f.project}/Documents/Goals/02-extra.md`, '# Goal: Extra\n\n## Mission\n\nFixture extra goal.\n');
  commit(f.root, 'test: add extra goal', [f.project]);
  const status = f.harness.command('orchestrator', 'status', { project: f.project });
  assert.equal(status.nextStep.phase, 'prepare');
  assert.match(status.nextStep.command, /01-test-goal/);
});

test('prepare is idempotent and replaces its own expired challenge', (t) => {
  const f = useFixture(t);
  const args = { project: f.project, goal: f.goal.slice(f.project.length + 1), scene: f.sceneName };
  const first = f.harness.prepare('orchestrator', args);
  assert.equal(f.harness.prepare('orchestrator', args).question, first.question);
  f.harness.transaction((s) => { s.challenge.created -= 600001; });
  assert.notEqual(f.harness.prepare('orchestrator', args).question, first.question);
});

test('pending registration does not lock out another session forever', (t) => {
  const f = useFixture(t);
  const args = { project: f.project, goal: f.goal.slice(f.project.length + 1), scene: f.sceneName };
  f.harness.prepare('first', args);
  gate(() => f.harness.prepare('second', args), /pending in another session/);
  f.harness.transaction((s) => { s.challenge.created -= 600001; });
  const prepared = f.harness.prepare('second', args);
  f.harness.question('second', { questions: [{ question: prepared.question, options: prepared.labels.map((label) => ({ label })) }] }, [['Confirm registration']]);
  assert.match(f.harness.command('second', 'status').next, /registered goal/);
});

test('bootstrap save closes with checkpoint and cannot be sealed or graded', (t) => {
  const f = useFixture(t);
  fs.rmSync(path.join(f.root, f.scene));
  commit(f.root, 'test: remove fixture scene', [f.project]);
  activate(f);
  begin(f, 'orchestrator', { paths: ['Documents/DECISIONS.md'] });
  assert.equal(f.harness.command('orchestrator', 'status').nextStep.phase, 'bootstrap-save');
  gate(() => f.harness.issue('orchestrator', 'apply', {}), /bootstrap change accepts save only/);
  gate(() => f.harness.issue('orchestrator', 'seal', {}), /bootstrap save/);
  fs.writeFileSync(path.join(f.root, f.scene), 'saved scene bytes\n');
  finishSave(f);
  fs.appendFileSync(path.join(f.root, f.project, 'Documents', 'DECISIONS.md'), 'Bootstrap save.\n');
  commit(f.root, 'feat: bootstrap save fixture scene', [f.project]);
  const status = f.harness.command('orchestrator', 'checkpoint');
  assert.equal(status.change, null);
  assert.equal(f.harness.transaction((s) => s.projects[f.project].history.at(-1).verdict), 'BOOTSTRAP');
  assert.doesNotThrow(() => begin(f));
});

function register(f, session = 'orchestrator') {
  const prepared = f.harness.prepare(session, {
    project: f.project,
    goal: f.goal.slice(f.project.length + 1),
    scene: f.sceneName,
  });
  f.harness.question(session, registrationQuestion(prepared), [['Confirm registration']]);
  return prepared;
}

function activate(f, session = 'orchestrator') {
  register(f, session);
  f.harness.command(session, 'goal-active', { objective: f.prompt });
}

function begin(f, session = 'orchestrator', options = {}) {
  const args = {
    outcome: options.outcome ?? 'Update fixture scene',
    objects: options.objects ?? ['FixtureCube'],
    paths: options.paths ?? ['notes.txt'],
    ...(options.revision === undefined ? {} : { revision: options.revision }),
    ...(options.milestone === undefined ? {} : { milestone: options.milestone }),
    ...(options.requirements === undefined ? {} : { requirements: options.requirements }),
    final: options.final ?? true,
  };
  return f.harness.command(session, 'begin', args);
}

function ticketPayload(f, extra = {}) {
  return extra;
}

function issueAndConsume(f, session, operation, extra = {}) {
  const payload = ticketPayload(f, extra);
  const issued = f.harness.issue(session, operation, payload);
  f.harness.authorize(session, issued.token, operation, payload);
  const context = f.harness.consume(issued.token, operation, payload);
  return { ...issued, payload, context };
}

function finishSave(f, session = 'orchestrator') {
  const issued = issueAndConsume(f, session, 'save');
  f.harness.finish(issued.token, { ok: true });
  return issued;
}

function seal(f, session = 'orchestrator', { round = 'R01-20261031T110000Z', inspect = true } = {}) {
  const change = f.harness.transaction((s) => s.projects[f.project].change);
  if (change && change.operations === 0 && !change.failure && Date.now() <= change.deadline) {
    const issued = issueAndConsume(f, session, 'apply', { sealFixture: true });
    f.harness.finish(issued.token, { ok: true });
  }
  const current = f.harness.transaction((s) => s.projects[f.project].change);
  const recovery = current && (current.failure || Date.now() > current.deadline);
  if (current && !recovery && !current.readyToSeal) f.harness.command(session, 'finalize');
  if (current && !recovery && (!current.wipLook || current.wipLook.operations !== current.operations)) {
    const wipPath = `${f.project}/renders/wip/WIP-${round}.png`;
    write(f.root, wipPath, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const wip = issueAndConsume(f, session, 'wip');
    f.harness.finish(wip.token, { ok: true, renderPath: wipPath });
    f.harness.inspect(session, path.resolve(f.root, wipPath), true);
  }
  const renderPath = `${f.project}/renders/final/${round}.png`;
  const evidenceRoot = `${f.project}/Documents/Reviews/${round}/_evidence`;
  const evidenceNames = [
    renderPath,
    `${evidenceRoot}/camera.png`,
    `${evidenceRoot}/scene.txt`,
  ];
  write(f.root, renderPath, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  write(f.root, `${evidenceRoot}/camera.png`, Buffer.from('camera evidence\n'));
  write(f.root, `${evidenceRoot}/scene.txt`, 'scene evidence\n');
  const evidence = Object.fromEntries(evidenceNames.map((name) => [name, f.harness.hash(name)]));
  const manifestPath = `${f.project}/Documents/Reviews/${round}/manifest.json`;
  write(f.root, manifestPath, JSON.stringify({ round, scene: f.scene, evidence, tasks: {} }, null, 2) + '\n');
  const issued = issueAndConsume(f, session, 'seal');
  const result = f.harness.finish(issued.token, { ok: true, round, renderPath, evidence });
  const absoluteRender = path.resolve(f.root, renderPath);
  if (inspect) f.harness.inspect(session, absoluteRender, true);
  return { ...issued, result, round, renderPath, evidence, absoluteRender };
}

function selfReview(f, session = 'orchestrator') {
  return f.harness.command(session, 'self-review', { notes: 'Fixture inspection passed.' });
}

function scopedCommit(f, message = 'change fixture') {
  commit(f.root, message, [f.project]);
}

function reviewAll(f, session = 'orchestrator') {
  const sealed = seal(f, session);
  gate(() => selfReview(f, session));
  gate(() => f.harness.command(session, 'review', { notes: 'Missing grader receipt must fail.' }));
  const grader = f.harness.command(session, 'grader-ticket', { name: 'visual' });
  gate(() => f.harness.command(session, 'grader-ticket', { name: 'visual' }));
  gate(() => f.harness.collectGrader(session, 'unbound-child'));
  f.harness.bindGrader(
    session,
    'child-grader',
    `Review assignment ${grader.marker}`,
    { providerID: 'fixture-provider', modelID: 'fixture-model', variant: 'fixture-variant' },
  );
  gate(() => f.harness.bindGrader(
    session,
    'forged-child',
    `Review assignment ${grader.marker}`,
    { providerID: 'fixture-provider', modelID: 'fixture-model', variant: 'fixture-variant' },
  ));
  f.harness.graderStep('child-grader', 'read', {});
  const reportText = [
    '# Visual report',
    '- Verdict: PASS',
    `Scene hash: ${grader.sceneHash}`,
    `Evidence key: ${grader.evidenceKey}`,
    '| severity | finding |',
    '| minor | none |',
    '',
  ].join('\n');
  write(f.root, grader.report, reportText);
  f.harness.collectGrader(session, 'child-grader');
  const reviewPath = `${f.project}/Documents/Reviews/${sealed.round}/REVIEW.md`;
  write(f.root, reviewPath, [
    'Verdict: PASS',
    `Scene hash: ${grader.sceneHash}`,
    'Finding dispositions: none',
    '',
  ].join('\n'));
  const status = f.harness.command(session, 'review', {
    notes: 'All fixture findings disposed.',
    reason: 'No corrections required; the sealed fixture satisfies the target.',
    dispositions: 'No blocker or major finding remained.',
  });
  return { ...sealed, grader, reviewPath, status };
}

function simulationReport(ticket, verdict) {
  return [
    '# Grader report',
    `- Verdict: ${verdict}`,
    `Scene hash: ${ticket.sceneHash}`,
    `Evidence key: ${ticket.evidenceKey}`,
    ...(verdict === 'PASS' ? [] : ['| severity | finding |', '| --- | --- |', '| major | synthetic finding |']),
    '',
  ].join('\n');
}

function simulationGrader(f, name, verdict, { backup = false } = {}) {
  const ticket = f.harness.command('orchestrator', 'grader-ticket', { name });
  if (verdict === 'FAIL_START') {
    f.harness.command('orchestrator', 'grader-fail', { name, reason: 'synthetic task start failure' });
    return { ticket, child: null, result: null };
  }
  const child = `child-${name}-${crypto.randomUUID()}`;
  const model = backup
    ? { providerID: 'backup-provider', modelID: 'backup-model', variant: 'backup-variant' }
    : { providerID: 'fixture-provider', modelID: 'fixture-model', variant: 'fixture-variant' };
  f.harness.bindGrader('orchestrator', child, `Review assignment ${ticket.marker}`, model);
  if (verdict !== 'MISSING') write(f.root, ticket.report, simulationReport(ticket, verdict));
  const result = f.harness.collectGrader('orchestrator', child);
  return { ticket, child, result };
}

function simulationApply(f, index) {
  const applied = issueAndConsume(f, 'orchestrator', 'apply', { simulation: index });
  f.harness.finish(applied.token, { ok: true });
  return applied;
}

function simulationReview(f, notes = 'Synthetic review completed.') {
  return f.harness.command('orchestrator', 'review', {
    notes,
    reason: 'Synthetic findings were resolved or recorded against the sealed evidence.',
    dispositions: 'No unrecorded design decision remained.',
  });
}

test('prepare rejects an uncommitted scaffold and accepts Git-clean CRLF content', (t) => {
  const missing = useFixture(t, { commitInitial: false });
  gate(() => missing.harness.prepare('orchestrator', {
    project: missing.project,
    goal: missing.goal.slice(missing.project.length + 1),
    scene: missing.sceneName,
  }));

  const f = useFixture(t);
  const before = f.harness.snapshot(f.project);
  const requirements = path.join(f.root, f.project, 'Documents', 'REQUIREMENTS.md');
  fs.writeFileSync(requirements, fs.readFileSync(requirements, 'utf8').replace(/\r?\n/g, '\r\n'));
  assert.deepEqual(f.harness.snapshot(f.project), before);
  assert.equal(git(f.root, ['diff', '--numstat', '--', f.project]).trim(), '');
  assert.doesNotThrow(() => register(f));
});

test('records reject invalid modes and grader configurations before registration', (t) => {
  const cases = [
    ['requirements status', {}, (f) => write(f.root, `${f.project}/Documents/REQUIREMENTS.md`, 'Status: Pending\nConfirmed: 2026-10-31\nConfirmation: no\n')],
    ['workflow mode', {}, (f) => write(f.root, `${f.project}/Documents/WORKFLOW.md`, 'Mode: Unset\nSelected: 2026-10-31\n')],
    ['review mode', {}, (f) => write(f.root, `${f.project}/Documents/REVIEW.md`, 'Mode: Unset\nSelected: 2026-10-31\n')],
    ['missing grader config', { review: 'All', config: false }, null],
    ['disabled grader config', { review: 'All', configValue: validGraderConfig({ enabled: false }) }, null],
    ['legacy grader config', { review: 'All', configValue: { workers: {}, blender_graders: {} } }, null],
    ['invalid grader roster', { review: 'All', configValue: validGraderConfig({ graders: [] }) }, null],
    ['max rounds above four', { review: 'All', configValue: validGraderConfig({ max_rounds: 5 }) }, null],
  ];
  for (const [name, options, mutate] of cases) {
    const f = useFixture(t, options);
    if (mutate) mutate(f);
    gate(() => f.harness.prepare('orchestrator', {
      project: f.project,
      goal: f.goal.slice(f.project.length + 1),
      scene: f.sceneName,
    }));
    assert.ok(name);
  }
});

test('worker and grader backups validate and bind as the configured fallback', (t) => {
  const config = validGraderConfig();
  config.blender_subagents.workers = {
    agent: 'blender-worker', provider: 'fixture-provider', model: 'fixture-model', variant: 'fixture-variant',
    backup: { provider: 'backup-provider', model: 'backup-model', variant: 'backup-variant' },
    max_minutes: 10, max_steps: 18, max_failed_attempts: 2, max_parallel: 1,
  };
  config.blender_subagents.graders.graders[0].backup = { provider: 'backup-provider', model: 'backup-model', variant: 'backup-variant' };
  const f = useFixture(t, { review: 'All', configValue: config });
  write(f.root, '.kilo/agent/blender-worker.md', '---\nsteps: 20\n---\n');
  assert.equal(f.harness.workerConfig().backup.model, 'backup-model');
  activate(f);
  begin(f);
  const sealed = seal(f);
  const ticket = f.harness.command('orchestrator', 'grader-ticket', { name: 'visual' });
  assert.equal(ticket.model.backup.model, 'backup-model');
  assert.match(ticket.prompt, /backup backup-provider \/ backup-model \/ backup-variant/);
  f.harness.bindGrader(
    'orchestrator',
    'child-backup',
    `Review assignment ${ticket.marker}`,
    { providerID: 'backup-provider', modelID: 'backup-model', variant: 'backup-variant' },
  );
  assert.equal(f.harness.transaction((s) => s.projects[f.project].change.graders.visual.modelRole), 'backup');
  assert.equal(f.harness.command('orchestrator', 'status').models.graders[0].backup.model, 'backup-model');
  assert.equal(sealed.round, ticket.round);
});

test('partial backup configuration is rejected before registration', (t) => {
  const grader = validGraderConfig();
  grader.blender_subagents.graders.graders[0].backup = { provider: 'backup-provider', model: 'backup-model' };
  const graderFixture = useFixture(t, { review: 'All', configValue: grader });
  gate(() => graderFixture.harness.prepare('orchestrator', {
    project: graderFixture.project,
    goal: graderFixture.goal.slice(graderFixture.project.length + 1),
    scene: graderFixture.sceneName,
  }), /backup|reasoning/);

  const worker = validGraderConfig();
  worker.blender_subagents.workers = {
    agent: 'blender-worker', provider: 'fixture-provider', model: 'fixture-model', variant: 'fixture-variant',
    backup: { provider: 'backup-provider', model: 'backup-model' },
    max_minutes: 10, max_steps: 18, max_failed_attempts: 2, max_parallel: 1,
  };
  const workerFixture = useFixture(t, { review: 'Off', configValue: worker });
  gate(() => workerFixture.harness.workerConfig(), /backup|reasoning/);
});

test('registration accepts only exact runtime question and goal prompt', (t) => {
  const f = useFixture(t);
  const unregistered = (session = 'orchestrator') => assert.equal(f.harness.command(session, 'status').project, null);
  gate(() => f.harness.command('orchestrator', 'goal-active', { objective: f.prompt }));
  const prepared = f.harness.prepare('orchestrator', {
    project: f.project,
    goal: f.goal.slice(f.project.length + 1),
    scene: f.sceneName,
  });
  f.harness.question('orchestrator', {
    questions: [{ question: 'forged', options: [{ label: 'Confirm registration' }], custom: false, multiple: false }],
  }, [['Confirm registration']]);
  unregistered();
  f.harness.question('orchestrator', registrationQuestion(prepared), [[{ label: 'Confirm registration' }]]);
  unregistered();
  const custom = registrationQuestion(prepared);
  custom.questions[0].custom = true;
  f.harness.question('orchestrator', custom, [['Confirm registration']]);
  unregistered();
  f.harness.question('other-orchestrator', registrationQuestion(prepared), [['Confirm registration']]);
  unregistered('other-orchestrator');
  f.harness.question('orchestrator', registrationQuestion(prepared), [['Confirm registration']]);
  f.harness.command('orchestrator', 'goal-active', { objective: f.prompt });
  f.harness.command('orchestrator', 'goal-active', { objective: f.prompt.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n') + '\r\n' });
  gate(() => f.harness.command('orchestrator', 'goal-active', { objective: 'forged goal' }));
});

test('command and public method schemas reject malformed lifecycle input and path escapes', (t) => {
  const f = useFixture(t);
  gate(() => f.harness.prepare('orchestrator', { project: f.project, goal: f.goal.slice(f.project.length + 1), scene: 'wrong.txt' }));
  gate(() => f.harness.prepare('orchestrator', { project: f.project, goal: f.goal.slice(f.project.length + 1), scene: f.sceneName, approved: true }));
  gate(() => f.harness.prepare('orchestrator', { project: 'Blender/../escape', goal: 'Documents/Goals/01-test-goal.md', scene: f.sceneName }));
  activate(f);
  gate(() => f.harness.command('orchestrator', 'begin', { outcome: '', objects: ['FixtureCube'], paths: ['notes.txt'] }));
  gate(() => f.harness.command('orchestrator', 'begin', { outcome: 'bad objects', objects: ['\u0000'], paths: ['notes.txt'] }));
  gate(() => f.harness.command('orchestrator', 'begin', { outcome: 'bad paths', objects: ['FixtureCube'], paths: [] }));
  gate(() => f.harness.command('orchestrator', 'begin', { outcome: 'escape', objects: ['FixtureCube'], paths: ['../outside.txt'] }));
  gate(() => f.harness.command('orchestrator', 'begin', { outcome: 'drive', objects: ['FixtureCube'], paths: ['C:outside.txt'] }));
  begin(f);
  gate(() => f.harness.issue('orchestrator', 'unknown', ticketPayload(f)));
  gate(() => f.harness.command('orchestrator', 'unknown-action'));
  gate(() => f.harness.finish('forged-token', { ok: true }));
  gate(() => f.harness.command('orchestrator', 'approval'));
});

test('tickets require hook authorization and reject forged, replayed, cross-session, and expired use', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  const payload = ticketPayload(f, { operation: 'save' });
  const issued = f.harness.issue('orchestrator', 'save', payload);
  gate(() => f.harness.consume('forged-token', 'save', payload));
  gate(() => f.harness.issue('other-session', 'save', payload));
  gate(() => f.harness.issue('orchestrator', 'save', payload));
  gate(() => f.harness.consume(issued.token, 'save', payload));
  gate(() => f.harness.authorize('other-session', issued.token, 'save', payload));
  gate(() => f.harness.authorize('orchestrator', issued.token, 'apply', payload));
  gate(() => f.harness.authorize('orchestrator', issued.token, 'save', { ...payload, forged: true }));
  f.harness.authorize('orchestrator', issued.token, 'save', payload);
  gate(() => f.harness.authorize('orchestrator', issued.token, 'save', payload));
  gate(() => f.harness.consume(issued.token, 'save', { ...payload, forged: true }));
  f.harness.consume(issued.token, 'save', payload);
  gate(() => f.harness.consume(issued.token, 'save', payload));
  f.harness.finish(issued.token, { ok: true });
  gate(() => f.harness.finish(issued.token, { ok: true }));

  const expired = f.harness.issue('orchestrator', 'save', ticketPayload(f, { second: true }));
  f.harness.transaction((state) => { state.tickets[expired.token].created = Date.now() - 600_001; });
  gate(() => f.harness.authorize('orchestrator', expired.token, 'save', expired.payload));
});

test('deadline and twenty apply operations block edits but preserve recovery save and seal', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  for (let index = 0; index < 20; index += 1) {
    const issued = issueAndConsume(f, 'orchestrator', 'apply', { index });
    f.harness.finish(issued.token, { ok: true });
  }
  assert.equal(f.harness.command('orchestrator', 'status').change.operations, 20);
  gate(() => f.harness.issue('orchestrator', 'apply', ticketPayload(f, { index: 20 })));
  finishSave(f);
  const sealed = seal(f);
  assert.equal(sealed.result.change.sealed, true);

  const deadline = useFixture(t);
  activate(deadline);
  begin(deadline);
  deadline.harness.transaction((state) => {
    const project = Object.values(state.projects).find((entry) => entry.orchestrator === 'orchestrator');
    project.change.deadline = Date.now() - 1;
  });
  gate(() => deadline.harness.issue('orchestrator', 'apply', ticketPayload(deadline, { late: true })));
  finishSave(deadline);
  assert.equal(deadline.harness.command('orchestrator', 'status').change.operations, 0);
  assert.equal(seal(deadline).result.change.sealed, true);
});

test('recover rejects live writer and recovers expired unconsumed tickets', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  const issued = issueAndConsume(f, 'orchestrator', 'apply', { recovery: true });
  gate(() => f.harness.recover('orchestrator'));
  f.harness.finish(issued.token, { ok: false, error: 'controlled upstream failure' });
  const expired = f.harness.issue('orchestrator', 'save', {});
  f.harness.transaction((state) => { state.tickets[expired.token].created = Date.now() - 600_001; });
  const recovered = f.harness.recover('orchestrator');
  assert.equal(recovered.change.sealed, false);
  finishSave(f);
  assert.equal(seal(f).result.change.sealed, true);
});

test('recover clears an expired unstarted ticket without closing edits', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  const expired = f.harness.issue('orchestrator', 'apply', { retry: true });
  f.harness.transaction((state) => { state.tickets[expired.token].created = Date.now() - 600_001; });
  f.harness.recover('orchestrator');
  const change = f.harness.transaction((state) => state.projects[f.project].change);
  assert.equal(change.failure, undefined);
  assert.equal(change.pending, undefined);
  assert.ok(change.deadline > Date.now());
  const retried = issueAndConsume(f, 'orchestrator', 'apply', { retried: true });
  f.harness.finish(retried.token, { ok: true });
  assert.equal(f.harness.command('orchestrator', 'status').change.operations, 1);
});

test('recover reopens a failed or expired reviewable change for repair', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  f.harness.transaction((state) => {
    const change = state.projects[f.project].change;
    change.failure = 'Cannot render, no camera';
    change.deadline = 0;
  });
  const failed = f.harness.command('orchestrator', 'status');
  assert.equal(failed.nextStep.phase, 'recover');
  assert.equal(failed.change.failure, true);
  assert.equal(failed.change.appliesRemaining, 20);
  const reopened = f.harness.recover('orchestrator', { reopen: true });
  assert.equal(reopened.change.failure, false);
  assert.equal(reopened.change.reopen, true);
  assert.match(reopened.nextStep.command, /action:"ticket"/);
  assert.ok(reopened.change.deadlineRemainingMs > 0);
  const repaired = issueAndConsume(f, 'orchestrator', 'apply', { repair: true });
  f.harness.finish(repaired.token, { ok: true });
  const repairedStatus = f.harness.command('orchestrator', 'status');
  assert.equal(repairedStatus.change.reopen, false);
  assert.equal(repairedStatus.change.operations, 1);
  assert.ok(repairedStatus.change.deadlineRemainingMs > 0);
});

test('task ledger records batched tickets and WIP commit preserves a failed change', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  const issued = issueAndConsume(f, 'orchestrator', 'apply', { operations: [
    { operation: 'create_mesh', name: 'Cube', primitive: 'cube', location: [0, 0, 0], scale: [1, 1, 1] },
    { operation: 'create_mesh', name: 'Lamp', primitive: 'cylinder', location: [0, 0, 1], scale: [0.1, 0.1, 1] },
  ] });
  f.harness.finish(issued.token, { ok: false, error: 'simulated batch failure', completed: 1 });
  const ledger = read(f.root, `${f.project}/Documents/TASKSTRACKER.md`);
  assert.match(ledger, /T001/);
  assert.match(ledger, /apply x2/);
  assert.match(ledger, /failed/);
  assert.doesNotMatch(ledger, new RegExp(issued.token));
  const failedStatus = f.harness.command('orchestrator', 'status');
  assert.equal(failedStatus.change.saved, true);
  assert.equal(failedStatus.change.sceneHash, f.harness.hash(f.scene));
  const staged = f.harness.command('orchestrator', 'commit', { message: 'wip: preserve failed batch', mode: 'wip' });
  assert.equal(staged.nextStep.phase, 'checkpoint');
  const checkpointed = f.harness.command('orchestrator', 'checkpoint');
  assert.equal(checkpointed.change, null);
  assert.equal(checkpointed.nextStep.phase, 'begin');
  const history = f.harness.transaction((state) => state.projects[f.project].history.at(-1));
  assert.equal(history.verdict, 'WIP');
  assert.doesNotThrow(() => begin(f));
});

test('failed change at the apply cap routes to WIP instead of an impossible recover', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  f.harness.transaction((state) => {
    const change = state.projects[f.project].change;
    change.operations = 20;
    change.failure = 'seal failed after cap';
    change.deadline = 0;
  });
  const status = f.harness.command('orchestrator', 'status');
  assert.equal(status.nextStep.phase, 'wip');
  assert.match(status.nextStep.command, /action:"commit"/);
  assert.match(status.nextStep.command, /wip/);
  assert.throws(() => f.harness.recover('orchestrator', { reopen: true }), /budget is exhausted/);
});

test('failed apply closes edit route but preserves recovery save and seal', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  const issued = issueAndConsume(f, 'orchestrator', 'apply', { failure: true });
  f.harness.finish(issued.token, { ok: false, error: 'mock operation failed' });
  gate(() => f.harness.issue('orchestrator', 'apply', { next: true }));
  finishSave(f);
  assert.equal(seal(f).result.change.sealed, true);
  const status = f.harness.command('orchestrator', 'status');
  assert.equal(status.nextStep.phase, 'self-review');
  assert.equal(status.change.failure, false);
  assert.equal(status.change.reopen, false);
});

test('checkpoint without an open change is rejected', (t) => {
  const f = useFixture(t);
  activate(f);
  gate(() => f.harness.command('orchestrator', 'checkpoint'), /no open change/);
});

test('sealed render must be inspected before self-review can pass', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  const sealed = seal(f, 'orchestrator', { inspect: false });
  gate(() => selfReview(f));
  f.harness.inspect('orchestrator', sealed.absoluteRender, false);
  gate(() => selfReview(f));
  f.harness.inspect('orchestrator', path.join(f.root, f.project, 'renders', 'final', 'wrong.png'), true);
  gate(() => selfReview(f));
  f.harness.inspect('orchestrator', sealed.absoluteRender, true);
  selfReview(f);
  assert.equal(f.harness.command('orchestrator', 'status').change.verdict, 'PASS');
});

test('stale scene, evidence, and specification freeze review state', (t) => {
  for (const label of ['scene', 'evidence', 'specification', 'manifest']) {
    const f = useFixture(t);
    activate(f);
    begin(f);
    const sealed = seal(f);
    if (label === 'scene') fs.appendFileSync(path.join(f.root, f.scene), 'changed');
    else if (label === 'evidence') {
      const evidencePath = Object.keys(sealed.evidence).find((name) => name.endsWith('scene.txt'));
      fs.appendFileSync(path.join(f.root, evidencePath), 'changed');
    } else if (label === 'specification') fs.appendFileSync(path.join(f.root, f.project, 'Documents', 'REQUIREMENTS.md'), 'changed\n');
    else fs.appendFileSync(path.join(f.root, f.project, 'Documents', 'Reviews', sealed.round, 'manifest.json'), 'changed\n');
    gate(() => selfReview(f));
  }
});

test('partial approval ignores forged JSON and Pause, then accepts only actual labels', (t) => {
  const f = useFixture(t, { workflow: 'Partially Autonomous' });
  activate(f);
  begin(f);
  seal(f);
  selfReview(f);
  const approval = f.harness.command('orchestrator', 'approval');
  f.harness.question('orchestrator', {
    questions: [{ question: approval.question, options: approval.labels.map((label) => ({ label })), custom: false, multiple: false }],
  }, [[{ label: 'Approve change' }]]);
  assert.equal(f.harness.command('orchestrator', 'status').change.approved, false);
  f.harness.question('orchestrator', {
    questions: [{ question: approval.question, options: approval.labels.map((label) => ({ label })), custom: false, multiple: false }],
  }, [['Pause']]);
  assert.equal(f.harness.command('orchestrator', 'status').change.approved, false);
  gate(() => f.harness.command('orchestrator', 'checkpoint'));
  gate(() => begin(f));
  const forged = registrationQuestion(approval);
  forged.questions[0].options.push({ label: 'Forged approval' });
  gate(() => f.harness.question('orchestrator', forged, [['Forged approval']]));
  assert.equal(f.harness.command('orchestrator', 'status').change.approved, false);
  f.harness.question('orchestrator', {
    questions: [{ question: approval.question, options: approval.labels.map((label) => ({ label })), custom: false, multiple: false }],
  }, [['Approve change']]);
  assert.equal(f.harness.command('orchestrator', 'status').change.approved, true);
});

test('All review mode freezes grader evidence and rejects stale reports', (t) => {
  const f = useFixture(t, { review: 'All' });
  activate(f);
  begin(f);
  const reviewed = reviewAll(f);
  assert.equal(reviewed.status.change.verdict, 'PASS');
  assert.match(reviewed.grader.prompt, /HARNESS_GRADER:/);
  assert.match(reviewed.grader.prompt, /Report path: .*REPORT\.md/);
  assert.match(reviewed.grader.prompt, /Scene hash|saved scene SHA-256/);
  const report = path.join(f.root, reviewed.grader.report);
  fs.appendFileSync(report, 'tampered\n');
  gate(() => f.harness.command('orchestrator', 'review', { notes: 'retry' }));
});

test('expired uncollected grader ticket can be reissued', (t) => {
  const f = useFixture(t, { review: 'All' });
  activate(f);
  begin(f);
  seal(f);
  const first = f.harness.command('orchestrator', 'grader-ticket', { name: 'visual' });
  f.harness.bindGrader(
    'orchestrator',
    'child-one',
    `Review assignment ${first.marker}`,
    { providerID: 'fixture-provider', modelID: 'fixture-model', variant: 'fixture-variant' },
  );
  f.harness.transaction((s) => { s.projects[f.project].change.graders.visual.deadline = Date.now() - 1; });
  const retry = f.harness.command('orchestrator', 'grader-ticket', { name: 'visual' });
  assert.notEqual(retry.token, first.token);
  assert.equal(f.harness.command('orchestrator', 'status').change.graders.visual.attempt, 2);
  f.harness.transaction((s) => { s.projects[f.project].change.graders.visual.deadline = Date.now() - 1; });
  gate(() => f.harness.command('orchestrator', 'grader-ticket', { name: 'visual' }), /retry budget/);
});

test('review records an expired uncollected grader as BLOCKED', (t) => {
  const f = useFixture(t, { review: 'All' });
  activate(f);
  begin(f);
  const sealed = seal(f);
  const ticket = f.harness.command('orchestrator', 'grader-ticket', { name: 'visual' });
  f.harness.bindGrader(
    'orchestrator',
    'child-one',
    `Review assignment ${ticket.marker}`,
    { providerID: 'fixture-provider', modelID: 'fixture-model', variant: 'fixture-variant' },
  );
  f.harness.transaction((s) => { s.projects[f.project].change.graders.visual.deadline = Date.now() - 1; });
  const sceneHash = f.harness.hash(f.scene);
  write(f.root, `${f.project}/Documents/Reviews/${sealed.round}/REVIEW.md`, [
    'Verdict: BLOCKED',
    `Scene hash: ${sceneHash}`,
    'Finding dispositions: grader expired without a report',
    '',
  ].join('\n'));
  const reviewed = f.harness.command('orchestrator', 'review', {
    notes: 'Expired grader recorded BLOCKED.',
    reason: 'The expired grader prevents a pass; aggregate as blocked.',
    dispositions: 'No correction attempted; grader report is missing.',
  });
  assert.equal(reviewed.change.verdict, 'BLOCKED');
  assert.equal(reviewed.change.blockingKind, 'tooling');
  assert.match(reviewed.change.graders.visual.error, /deadline/);
  f.harness.command('orchestrator', 'grader-ticket', { name: 'visual' });
  assert.equal(f.harness.command('orchestrator', 'status').change.graders.visual.attempt, 2);
});

test('a sealed tooling block can be preserved, checkpointed, and paused', (t) => {
  const f = useFixture(t, { review: 'All' });
  activate(f);
  begin(f);
  seal(f);
  const runBlockedRound = () => {
    const ticket = f.harness.command('orchestrator', 'grader-ticket', { name: 'visual' });
    f.harness.bindGrader(
      'orchestrator',
      `child-${ticket.token}`,
      `Review assignment ${ticket.marker}`,
      { providerID: 'fixture-provider', modelID: 'fixture-model', variant: 'fixture-variant' },
    );
    f.harness.transaction((s) => { s.projects[f.project].change.graders.visual.deadline = Date.now() - 1; });
    return f.harness.command('orchestrator', 'review', {
      notes: 'The grader did not produce a report.',
      reason: 'The provider remained unavailable, so the review is tooling-blocked.',
      dispositions: 'No design finding was assessed.',
    });
  };
  assert.equal(runBlockedRound().change.verdict, 'BLOCKED');
  assert.equal(f.harness.command('orchestrator', 'status').nextStep.phase, 'retry-grader');
  assert.equal(runBlockedRound().change.verdict, 'BLOCKED');
  assert.equal(f.harness.command('orchestrator', 'status').nextStep.phase, 'preserve');
  const preserved = f.harness.command('orchestrator', 'preserve', { reason: 'Preserve the sealed round for a later provider retry.' });
  assert.equal(preserved.change.wip, true);
  assert.equal(preserved.change.verdict, 'WIP');
  assert.match(preserved.change.preserved.reason, /later provider retry/);
  assert.equal(preserved.nextStep.phase, 'checkpoint');
  assert.equal(git(f.root, ['status', '--porcelain', '--', f.project]).trim(), '');
  f.harness.command('orchestrator', 'checkpoint');
  assert.equal(f.harness.transaction((s) => s.projects[f.project].history.at(-1).verdict), 'WIP');
  const paused = f.harness.command('orchestrator', 'pause', { reason: 'Provider unavailable; paused after preserving evidence.' });
  assert.equal(paused.goalActive, false);
});

test('shell approvals commit atomically in project or generic scope', (t) => {
  const record = () => ({
    id: crypto.randomUUID(),
    status: 'approved',
    session: 'orchestrator',
    command: 'npm run diagnostics',
    reasoning: 'Run the bounded workspace diagnostic before changing tooling.',
    cwd: 'D:\\Projects\\_Templates\\Blender',
    created: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
  });

  const f = useFixture(t);
  activate(f);
  begin(f);
  const projectRecord = record();
  const project = f.harness.commitShellApproval('orchestrator', f.project, projectRecord);
  assert.equal(project.path, `Documents/Commands/${projectRecord.id}.md`);
  assert.ok(fs.existsSync(path.join(f.root, f.project, 'Documents', 'Commands', `${projectRecord.id}.md`)));
  assert.match(git(f.root, ['log', '-1', '--format=%s']), /shell approval/);
  seal(f);
  selfReview(f);
  f.harness.command('orchestrator', 'commit', { message: 'feat: fixture with command record' });
  assert.equal(f.harness.command('orchestrator', 'checkpoint').change, null);

  const generic = useFixture(t);
  const genericRecord = record();
  const root = generic.harness.commitShellApproval('generic-session', null, genericRecord);
  assert.equal(root.path, `Commands/${genericRecord.id}.md`);
  assert.ok(fs.existsSync(path.join(generic.root, 'Commands', `${genericRecord.id}.md`)));
  assert.equal(git(generic.root, ['status', '--porcelain']).trim(), '');
});

test('grader tickets expose exact evidence paths and refuse tampered evidence', (t) => {
  const first = useFixture(t, { review: 'All' });
  activate(first);
  begin(first);
  const sealed = seal(first);
  const ticket = first.harness.command('orchestrator', 'grader-ticket', { name: 'visual' });
  assert.equal(ticket.evidenceFiles.length, 3);
  assert.match(ticket.prompt, /camera\.png/);
  assert.match(ticket.prompt, /scene\.txt/);
  assert.match(ticket.prompt, /manifest\.json/);
  assert.doesNotMatch(ticket.prompt, /Evidence: .*_evidence\n/);
  first.harness.bindGrader('orchestrator', 'child-evidence', `Review ${ticket.marker}`, { providerID: 'fixture-provider', modelID: 'fixture-model', variant: 'fixture-variant' });
  first.harness.transaction((s) => {
    s.projects[first.project].change.graders.visual.steps = 999;
    s.projects[first.project].change.graders.visual.deadline = Date.now() - 1;
  });
  assert.doesNotThrow(() => first.harness.graderStep('child-evidence', 'blender_document', { action: 'write' }));
  gate(() => first.harness.graderStep('child-evidence', 'read', {}), /budget/);

  const second = useFixture(t, { review: 'All' });
  activate(second);
  begin(second);
  const sealedSecond = seal(second);
  fs.rmSync(path.join(second.root, second.project, 'Documents', 'Reviews', sealedSecond.round, '_evidence', 'camera.png'));
  gate(() => second.harness.command('orchestrator', 'grader-ticket', { name: 'visual' }), /missing path|frozen evidence/);
});

test('grader prompts distinguish partial milestone and final full-spec scope', (t) => {
  const partial = useFixture(t, { review: 'All' });
  activate(partial);
  begin(partial, 'orchestrator', {
    milestone: 'Fixture partial milestone',
    requirements: ['R1'],
    final: false,
  });
  seal(partial);
  const partialTicket = partial.harness.command('orchestrator', 'grader-ticket', { name: 'visual' });
  assert.match(partialTicket.prompt, /Final full-spec review: no/);
  assert.match(partialTicket.prompt, /Partial milestone review/);
  assert.match(partialTicket.prompt, /deferred, not a finding/);

  const final = useFixture(t, { review: 'All' });
  activate(final);
  begin(final);
  seal(final);
  const finalTicket = final.harness.command('orchestrator', 'grader-ticket', { name: 'visual' });
  assert.match(finalTicket.prompt, /Final full-spec review: yes/);
  assert.match(finalTicket.prompt, /Final full-spec review\. Grade the complete deliverable/);
});

test('missing grader report records BLOCKED and allows re-dispatch before review', (t) => {
  const f = useFixture(t, { review: 'All' });
  activate(f);
  begin(f);
  const sealed = seal(f);
  const first = f.harness.command('orchestrator', 'grader-ticket', { name: 'visual' });
  f.harness.bindGrader(
    'orchestrator',
    'child-one',
    `Review assignment ${first.marker}`,
    { providerID: 'fixture-provider', modelID: 'fixture-model', variant: 'fixture-variant' },
  );
  const failed = f.harness.collectGrader('orchestrator', 'child-one');
  assert.equal(failed.change.graders.visual.verdict, 'BLOCKED');
  assert.match(failed.change.graders.visual.error, /missing/);

  const retry = f.harness.command('orchestrator', 'grader-ticket', { name: 'visual' });
  assert.notEqual(retry.token, first.token);
  f.harness.bindGrader(
    'orchestrator',
    'child-two',
    `Review assignment ${retry.marker}`,
    { providerID: 'fixture-provider', modelID: 'fixture-model', variant: 'fixture-variant' },
  );
  write(f.root, retry.report, [
    '# Visual report',
    '- Verdict: PASS',
    `Scene hash: ${retry.sceneHash}`,
    `Evidence key: ${retry.evidenceKey}`,
    '',
  ].join('\n'));
  f.harness.collectGrader('orchestrator', 'child-two');
  write(f.root, `${f.project}/Documents/Reviews/${sealed.round}/REVIEW.md`, [
    'Verdict: PASS',
    `Scene hash: ${retry.sceneHash}`,
    'Finding dispositions: none',
    '',
  ].join('\n'));
  const reviewed = f.harness.command('orchestrator', 'review', {
    notes: 'Retry passed.',
    reason: 'The replacement grader report passes after the missing-report failure.',
    dispositions: 'Missing report was retried once; no other findings.',
  });
  assert.equal(reviewed.change.verdict, 'PASS');
  gate(() => f.harness.command('orchestrator', 'grader-ticket', { name: 'visual' }));
});

test('retrying a collected BLOCKED report clears the stale evidence hash', (t) => {
  const f = useFixture(t, { review: 'All' });
  activate(f);
  begin(f);
  seal(f);
  const first = f.harness.command('orchestrator', 'grader-ticket', { name: 'visual' });
  f.harness.bindGrader(
    'orchestrator',
    'child-one',
    `Review assignment ${first.marker}`,
    { providerID: 'fixture-provider', modelID: 'fixture-model', variant: 'fixture-variant' },
  );
  write(f.root, first.report, [
    '# Visual report',
    '- Verdict: BLOCKED',
    `Scene hash: ${first.sceneHash}`,
    `Evidence key: ${first.evidenceKey}`,
    '',
  ].join('\n'));
  f.harness.collectGrader('orchestrator', 'child-one');
  assert.ok(f.harness.transaction((s) => s.projects[f.project].change.reports[first.report]));

  const retry = f.harness.command('orchestrator', 'grader-ticket', { name: 'visual' });
  assert.equal(f.harness.transaction((s) => s.projects[f.project].change.graders.visual.attempt), 2);
  assert.equal(fs.existsSync(path.join(f.root, retry.report)), false);
  assert.equal(f.harness.transaction((s) => s.projects[f.project].change.reports[retry.report]), undefined);
  f.harness.transaction((s) => { s.projects[f.project].change.graders.visual.deadline = Date.now() - 1; });

  const reviewed = f.harness.command('orchestrator', 'review', {
    notes: 'The retry produced no report.',
    reason: 'The grader is tooling-blocked and cannot provide a report.',
    dispositions: 'No design finding was assessed.',
  });
  assert.equal(reviewed.change.verdict, 'BLOCKED');
  assert.equal(f.harness.command('orchestrator', 'status').nextStep.phase, 'preserve');
  const preserved = f.harness.command('orchestrator', 'preserve', { reason: 'Preserve the blocked round for a later retry.' });
  assert.equal(preserved.change.verdict, 'WIP');
  assert.equal(preserved.nextStep.phase, 'checkpoint');
  assert.doesNotThrow(() => f.harness.command('orchestrator', 'checkpoint'));
  assert.equal(git(f.root, ['status', '--porcelain', '--', f.project]).trim(), '');
});

test('a failed grader start is recorded and exhausts the retry budget', (t) => {
  const f = useFixture(t, { review: 'All' });
  activate(f);
  begin(f);
  seal(f);
  const first = f.harness.command('orchestrator', 'grader-ticket', { name: 'visual' });
  f.harness.command('orchestrator', 'grader-fail', { name: 'visual', reason: 'task failed before child session' });
  assert.equal(f.harness.transaction((s) => s.projects[f.project].change.graders.visual.verdict), 'BLOCKED');
  assert.equal(f.harness.command('orchestrator', 'status').nextStep.phase, 'review');
  const firstReview = f.harness.command('orchestrator', 'review', {
    notes: 'The first dispatch produced no child.',
    reason: 'The grader task failed before it could report.',
    dispositions: 'No design finding was assessed.',
  });
  assert.equal(firstReview.change.verdict, 'BLOCKED');
  assert.equal(f.harness.command('orchestrator', 'status').nextStep.phase, 'retry-grader');

  const retry = f.harness.command('orchestrator', 'grader-ticket', { name: 'visual' });
  assert.notEqual(retry.token, first.token);
  assert.equal(f.harness.transaction((s) => s.projects[f.project].change.graders.visual.attempt), 2);
  f.harness.command('orchestrator', 'grader-fail', { name: 'visual', reason: 'retry failed before child session' });
  assert.equal(f.harness.command('orchestrator', 'status').nextStep.phase, 'review');
  const reviewed = f.harness.command('orchestrator', 'review', {
    notes: 'The retry also produced no child.',
    reason: 'Both grader attempts failed before binding a child.',
    dispositions: 'No design finding was assessed.',
  });
  assert.equal(reviewed.change.verdict, 'BLOCKED');
  assert.equal(f.harness.command('orchestrator', 'status').nextStep.phase, 'preserve');
});

test('review registration record is frozen after registration', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  seal(f);
  selfReview(f);
  fs.appendFileSync(path.join(f.root, f.project, 'Documents', 'REVIEW.md'), '\nReview notes updated.\n');
  gate(() => f.harness.command('orchestrator', 'checkpoint'), /spec, modes|re-registration/);
});

test('escalation can extend the review cap before re-registration', (t) => {
  const f = useFixture(t, { review: 'All' });
  activate(f);
  begin(f);
  reviewAll(f);
  f.harness.command('orchestrator', 'checkpoint');
  f.harness.command('orchestrator', 'escalate', { reason: 'Approved extra correction rounds.', max_rounds: 4 });
  register(f);
  assert.equal(f.harness.transaction((s) => s.projects[f.project].records.maxRounds), 4);
});

test('bootstrap documents and commits are harness-owned before registration', (t) => {
  const f = useFixture(t, { commitInitial: false });
  fs.rmSync(path.join(f.root, f.scene));
  fs.rmSync(path.join(f.root, f.project, 'notes.txt'));
  const status = f.harness.command('orchestrator', 'status', { project: f.project });
  assert.match(status.next, /bootstrap-commit/);
  assert.match(status.nextStep.command, /bootstrap-commit/);
  gate(() => f.harness.bootstrapDocument('orchestrator', { project: f.project, path: 'Documents/References/note.md', content: 'No heading\n' }));
  assert.doesNotThrow(() => f.harness.bootstrapDocument('orchestrator', {
    project: f.project,
    path: 'Documents/References/note.md',
    content: '# Reference note\n',
  }));
  const committed = f.harness.bootstrapCommit('orchestrator', { project: f.project, message: 'docs: scaffold fixture' });
  assert.equal(committed.next.includes('prepare'), true);
  assert.match(f.harness.command('orchestrator', 'status', { project: f.project }).nextStep.command, /prepare/);
  assert.doesNotThrow(() => register(f));
});

test('document read returns structure and section content without raw full-file reads', (t) => {
  const f = useFixture(t);
  activate(f);
  const read = f.harness.documentRead('orchestrator', { path: 'Documents/REQUIREMENTS.md' });
  assert.equal(read.title, 'Requirements');
  assert.equal(read.content, undefined);
  assert.equal(read.valid, true);
  assert.equal(read.fields.Status, 'Confirmed');
  assert.deepEqual(read.sections.slice(0, 3).map((section) => section.heading), ['Core value', 'Confirmed requirements', 'Constraints']);
  const section = f.harness.documentRead('orchestrator', { path: 'Documents/REQUIREMENTS.md', section: 'Confirmed requirements' });
  assert.match(section.section.content, /Fixture confirmed requirements/);
  const absolute = f.harness.documentRead('orchestrator', { path: path.join(f.root, f.project, 'Documents', 'WORKFLOW.md') });
  assert.equal(absolute.title, 'Workflow');
  gate(() => f.harness.documentRead('orchestrator', { path: 'Documents/REQUIREMENTS.md', section: 'Missing' }), /available/);
  gate(() => f.harness.documentRead('orchestrator', { path: 'scene.blend' }), /markdown/);
  write(f.root, `${f.project}/Documents/REQUIREMENTS.md`, '# Requirements\n\nStatus: Confirmed\n');
  const invalid = f.harness.documentRead('orchestrator', { path: 'Documents/REQUIREMENTS.md' });
  assert.equal(invalid.valid, false);
  assert.match(invalid.diagnostics[0], /field|section/);
  assert.match(invalid.next, /capabilities\.documentFormats/);
});

test('document read works before registration with an explicit project', (t) => {
  const f = useFixture(t, { commitInitial: false });
  const read = f.harness.documentRead('unregistered', { project: f.project, path: 'README.md' });
  assert.equal(read.title, 'Fixture project');
  assert.equal(read.content, undefined);
  assert.ok(read.sections.some((section) => section.heading === 'Purpose'));
});

test('grader document writes are limited to the assigned report format and path', (t) => {
  const f = useFixture(t, { review: 'All' });
  activate(f);
  begin(f);
  seal(f);
  const ticket = f.harness.command('orchestrator', 'grader-ticket', { name: 'visual' });
  const report = path.join(f.root, ticket.report);
  f.harness.transaction((state) => { state.projects[f.project].change.graders.visual.child = 'child-grader'; });
  const content = [
    '# Grader Report — visual',
    '',
    `- Evidence key: ${ticket.evidenceKey}`,
    `- Target: ${ticket.sceneHash}`,
    '- Verdict: PASS',
    '',
    '## Findings',
    '',
    'none',
    '',
  ].join('\n');
  f.harness.documentWrite('child-grader', { path: report, content });
  assert.ok(fs.existsSync(path.join(f.root, ticket.report)));
  gate(() => f.harness.documentWrite('child-grader', { path: 'Documents/REQUIREMENTS.md', content: '# Required\n' }), /assigned report/);
  gate(() => f.harness.documentWrite('child-grader', { path: report, content: '# Missing verdict\n' }), /Verdict/);
});

test('a grader may write its report after the deadline but not after a verdict', (t) => {
  const f = useFixture(t, { review: 'All' });
  activate(f);
  begin(f);
  seal(f);
  const ticket = f.harness.command('orchestrator', 'grader-ticket', { name: 'visual' });
  const report = path.join(f.root, ticket.report);
  f.harness.transaction((state) => {
    const grader = state.projects[f.project].change.graders.visual;
    grader.child = 'child-late-report';
    grader.steps = 999;
    grader.deadline = Date.now() - 1;
  });
  const content = [
    '# Grader Report — visual',
    '',
    `- Evidence key: ${ticket.evidenceKey}`,
    `- Target: ${ticket.sceneHash}`,
    '- Verdict: PASS',
    '',
    '## Findings',
    '',
    'none',
    '',
  ].join('\n');
  f.harness.documentWrite('child-late-report', { path: report, content });
  assert.ok(fs.existsSync(path.join(f.root, ticket.report)));
  f.harness.transaction((state) => { state.projects[f.project].change.graders.visual.verdict = 'PASS'; });
  gate(() => f.harness.documentWrite('child-late-report', { path: report, content }), /already finalized/);
});

test('graders may read their own prior report but not peer reports', (t) => {
  const f = useFixture(t, { review: 'All' });
  activate(f);
  begin(f);
  seal(f);
  const ticket = f.harness.command('orchestrator', 'grader-ticket', { name: 'visual' });
  f.harness.bindGrader(
    'orchestrator',
    'child-grader',
    `Review assignment ${ticket.marker}`,
    { providerID: 'fixture-provider', modelID: 'fixture-model', variant: 'fixture-variant' },
  );
  const prior = 'R00-20261031T100000Z';
  write(f.root, `${f.project}/Documents/Reviews/${prior}/visual/REPORT.md`, '# Visual prior report\n');
  write(f.root, `${f.project}/Documents/Reviews/${prior}/technical/REPORT.md`, '# Technical prior report\n');
  const own = f.harness.documentRead('child-grader', { path: `Documents/Reviews/${prior}/visual/REPORT.md` });
  assert.equal(own.path, `Documents/Reviews/${prior}/visual/REPORT.md`);
  gate(() => f.harness.documentRead('child-grader', { path: `Documents/Reviews/${prior}/technical/REPORT.md` }), /outside assigned/);
});

test('seal requires at least one apply operation', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  gate(() => f.harness.issue('orchestrator', 'seal', {}), /at least one apply/);
  const applied = issueAndConsume(f, 'orchestrator', 'apply', { seal: true });
  f.harness.finish(applied.token, { ok: true });
  assert.doesNotThrow(() => seal(f, 'orchestrator', { inspect: false }));
});

test('bootstrap commit rejects scene and binary deliverables', (t) => {
  const f = useFixture(t, { commitInitial: false });
  gate(() => f.harness.bootstrapCommit('orchestrator', { project: f.project, message: 'docs: invalid scaffold' }));
  assert.doesNotThrow(() => {
    fs.rmSync(path.join(f.root, f.scene));
    fs.rmSync(path.join(f.root, f.project, 'notes.txt'));
    f.harness.bootstrapCommit('orchestrator', { project: f.project, message: 'docs: valid scaffold' });
  });
});

test('status returns an exact next call for every registered phase', (t) => {
  const f = useFixture(t);
  activate(f);
  assert.match(f.harness.command('orchestrator', 'status').nextStep.command, /action:"begin"/);
  begin(f);
  assert.match(f.harness.command('orchestrator', 'status').nextStep.command, /action:"ticket"/);
  const issued = f.harness.issue('orchestrator', 'apply', { retry: true });
  const pending = f.harness.command('orchestrator', 'status');
  assert.equal(pending.nextStep.actor, 'blender-worker');
  assert.match(pending.nextStep.command, new RegExp(issued.token));
  f.harness.authorize('orchestrator', issued.token, 'apply', { retry: true });
  f.harness.consume(issued.token, 'apply', { retry: true });
  f.harness.finish(issued.token, { ok: true });
  assert.match(f.harness.command('orchestrator', 'status').nextStep.command, /action:"ticket"/);
  const sealed = seal(f, 'orchestrator', { inspect: false });
  assert.match(f.harness.command('orchestrator', 'status').nextStep.command, /blender_look/);
  f.harness.inspect('orchestrator', sealed.absoluteRender, true);
  selfReview(f);
  assert.match(f.harness.command('orchestrator', 'status').nextStep.command, /action:"commit"/);
  f.harness.command('orchestrator', 'commit', { message: 'feat: fixture change' });
  assert.match(f.harness.command('orchestrator', 'status').nextStep.command, /action:"checkpoint"/);
});

test('harness document action creates declared markdown only', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f, 'orchestrator', { paths: ['Documents/DECISIONS.md', 'Documents/NEW.md'] });
  f.harness.command('orchestrator', 'document', { path: 'Documents/NEW.md', content: '# New document\n' });
  assert.equal(read(f.root, `${f.project}/Documents/NEW.md`), '# New document\n');
  gate(() => f.harness.command('orchestrator', 'document', { path: 'Documents/Reviews/R01/REVIEW.md', content: 'manual' }));
  gate(() => f.harness.command('orchestrator', 'document', { path: 'Documents/UNDECLARED.md', content: 'outside' }));
});

test('document-only changes commit without sealing and close at checkpoint', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f, 'orchestrator', { paths: ['README.md', 'Documents/DECISIONS.md'] });
  const status = f.harness.command('orchestrator', 'status');
  assert.equal(status.nextStep.phase, 'commit');
  gate(() => f.harness.issue('orchestrator', 'apply', {}), /document-only/);
  gate(() => f.harness.issue('orchestrator', 'seal', {}), /document-only/);
  fs.appendFileSync(path.join(f.root, f.project, 'README.md'), 'Document-only change.\n');
  const committed = f.harness.command('orchestrator', 'commit', { message: 'docs: update fixture readme' });
  assert.equal(committed.nextStep.phase, 'checkpoint');
  const checkpointed = f.harness.command('orchestrator', 'checkpoint');
  assert.equal(checkpointed.change, null);
  assert.equal(checkpointed.nextStep.phase, 'begin');
  assert.equal(f.harness.transaction((state) => state.projects[f.project].history.at(-1).verdict), 'DOCUMENT');
  assert.doesNotThrow(() => begin(f));
});

test('document-only commit stages a declared deletion', (t) => {
  const f = useFixture(t);
  write(f.root, `${f.project}/Documents/References/extra.md`, '# Extra reference\n');
  commit(f.root, 'test: add removable reference', [f.project]);
  activate(f);
  begin(f, 'orchestrator', { paths: ['Documents/References/extra.md'] });
  fs.rmSync(path.join(f.root, f.project, 'Documents', 'References', 'extra.md'));
  const committed = f.harness.command('orchestrator', 'commit', { message: 'docs: remove fixture reference' });
  assert.equal(committed.nextStep.phase, 'checkpoint');
  assert.equal(f.harness.command('orchestrator', 'checkpoint').change, null);
});

test('document-only checkpoint preserves a prior PASS for completion', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  seal(f);
  selfReview(f);
  f.harness.command('orchestrator', 'commit', { message: 'feat: fixture pass' });
  f.harness.command('orchestrator', 'checkpoint');
  begin(f, 'orchestrator', { paths: ['README.md'] });
  fs.appendFileSync(path.join(f.root, f.project, 'README.md'), 'Document-only completion note.\n');
  f.harness.command('orchestrator', 'commit', { message: 'docs: fixture completion note' });
  f.harness.command('orchestrator', 'checkpoint');
  const complete = f.harness.command('orchestrator', 'goal-complete');
  assert.equal(complete.complete, true);
  assert.equal(complete.nextStep.phase, 'complete');
});

test('paused project can reregister with updated records', (t) => {
  const f = useFixture(t);
  activate(f);
  const before = f.harness.transaction((state) => state.projects[f.project].records.specs);
  const started = f.harness.command('orchestrator', 'reregister', { reason: 'Requirements changed after confirmation.' });
  assert.equal(started.reregistering.reason, 'Requirements changed after confirmation.');
  assert.equal(started.nextStep.phase, 'reregister-prepare');
  const requirements = read(f.root, `${f.project}/Documents/REQUIREMENTS.md`) + '\nUpdated requirement detail.\n';
  f.harness.bootstrapDocument('orchestrator', { project: f.project, path: 'Documents/REQUIREMENTS.md', content: requirements });
  assert.equal(f.harness.command('orchestrator', 'status').nextStep.phase, 'reregister-commit');
  assert.match(f.harness.bootstrapCommit('orchestrator', { project: f.project, message: 'docs: update requirements' }).next, /prepare/);
  const prepared = f.harness.prepare('orchestrator', { project: f.project, goal: f.goal.slice(f.project.length + 1), scene: f.sceneName });
  f.harness.question('orchestrator', registrationQuestion(prepared), [['Confirm registration']]);
  const after = f.harness.command('orchestrator', 'status');
  assert.equal(after.goalActive, false);
  assert.equal(after.nextStep.phase, 'goal');
  assert.equal(f.harness.transaction((state) => state.projects[f.project].reregistering), false);
  assert.notDeepEqual(f.harness.transaction((state) => state.projects[f.project].records.specs), before);
});

test('registered changes cannot rewrite registration documents', (t) => {
  const f = useFixture(t);
  const goal = f.goal.slice(f.project.length + 1);
  activate(f);
  begin(f, 'orchestrator', { paths: ['Documents/REQUIREMENTS.md', 'Documents/WORKFLOW.md', 'Documents/REVIEW.md', goal, 'Documents/DECISIONS.md'] });
  const requirements = read(f.root, `${f.project}/Documents/REQUIREMENTS.md`);
  const workflow = read(f.root, `${f.project}/Documents/WORKFLOW.md`);
  const review = read(f.root, `${f.project}/Documents/REVIEW.md`);
  const goalText = read(f.root, f.goal);
  for (const [name, content] of [['Documents/REQUIREMENTS.md', requirements], ['Documents/WORKFLOW.md', workflow], ['Documents/REVIEW.md', review], [goal, goalText]]) {
    gate(() => f.harness.command('orchestrator', 'document', { path: name, content }), /frozen/);
  }
  assert.equal(read(f.root, `${f.project}/Documents/REQUIREMENTS.md`), requirements);
  assert.equal(read(f.root, `${f.project}/Documents/REVIEW.md`), review);
  assert.equal(read(f.root, f.goal), goalText);
  assert.doesNotThrow(() => f.harness.command('orchestrator', 'document', {
    path: 'Documents/DECISIONS.md', content: read(f.root, `${f.project}/Documents/DECISIONS.md`) + 'Registered change.\n',
  }));
});

test('partial review waits for approval before committing the reviewed change', (t) => {
  const f = useFixture(t, { workflow: 'Partially Autonomous', review: 'All' });
  activate(f);
  begin(f);
  reviewAll(f);
  assert.ok(Number(git(f.root, ['rev-list', '--count', 'HEAD']).trim()) >= 2);
  assert.equal(f.harness.command('orchestrator', 'status').nextStep.phase, 'approval');
  const approval = f.harness.command('orchestrator', 'approval');
  f.harness.question('orchestrator', {
    questions: [{ question: approval.question, options: approval.labels.map((label) => ({ label })), custom: false, multiple: false }],
  }, [['Approve change']]);
  assert.equal(f.harness.command('orchestrator', 'status').nextStep.phase, 'commit');
  f.harness.command('orchestrator', 'commit', { message: 'feat: approved fixture change' });
  f.harness.command('orchestrator', 'checkpoint');
  assert.ok(Number(git(f.root, ['rev-list', '--count', 'HEAD']).trim()) >= 3);
});

test('review auto-commits reports and the verdict before checkpoint', (t) => {
  const f = useFixture(t, { review: 'All' });
  activate(f);
  begin(f);
  reviewAll(f);
  assert.equal(git(f.root, ['status', '--porcelain']).trim(), '');
  assert.ok(Number(git(f.root, ['rev-list', '--count', 'HEAD']).trim()) >= 3);
  const review = read(f.root, `${f.project}/Documents/Reviews/R01-20261031T110000Z/REVIEW.md`);
  assert.match(review, /Verdict: PASS/);
  assert.match(review, /## Reason/);
  const status = f.harness.command('orchestrator', 'checkpoint');
  assert.equal(status.change, null);
});

test('commit helper stages the exact scoped change', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  seal(f);
  selfReview(f);
  f.harness.command('orchestrator', 'commit', { message: 'feat: bounded fixture change' });
  assert.equal(git(f.root, ['status', '--porcelain']).trim(), '');
  const status = f.harness.command('orchestrator', 'checkpoint');
  assert.equal(status.change, null);
  assert.equal(f.harness.transaction((s) => s.projects[f.project].history.at(-1).verdict), 'PASS');
});

test('checkpoint accepts a scoped commit range and completes goal after PASS', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  seal(f);
  selfReview(f);
  gate(() => begin(f));
  gate(() => f.harness.command('orchestrator', 'goal-complete'));
  gate(() => f.harness.command('orchestrator', 'checkpoint'));
  write(f.root, `${f.project}/notes.txt`, 'approved change\n');
  scopedCommit(f);
  f.harness.command('orchestrator', 'checkpoint');
  assert.ok(Number(git(f.root, ['rev-list', '--count', 'HEAD']).trim()) >= 3);
  const complete = f.harness.command('orchestrator', 'goal-complete');
  assert.equal(complete.complete, true);
  assert.equal(complete.change, null);
});

test('a paused or cleared goal keeps an open change resumable', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  const paused = f.harness.command('orchestrator', 'goal-inactive');
  assert.equal(paused.goalActive, false);
  assert.equal(paused.nextStep.phase, 'resume-goal');
  assert.match(paused.nextStep.command, /goal \{action:"resume"\}/);
  f.harness.command('orchestrator', 'goal-active', {});
  assert.equal(f.harness.command('orchestrator', 'status').nextStep.phase, 'apply');
});

test('goal completion requires active goal after a clean checkpoint', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  seal(f);
  selfReview(f);
  write(f.root, `${f.project}/notes.txt`, 'approved change\n');
  scopedCommit(f);
  f.harness.command('orchestrator', 'checkpoint');
  f.harness.command('orchestrator', 'goal-complete');
  assert.equal(f.harness.command('orchestrator', 'status').complete, true);
});

test('strict milestone commits each apply, requires finalize/WIP look, and accepts a commit range', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f, 'orchestrator', { milestone: 'Fixture milestone', requirements: ['R1'], final: true });
  for (let index = 0; index < 2; index += 1) {
    const issued = issueAndConsume(f, 'orchestrator', 'apply', { index });
    if (index === 0) f.harness.bindWorker('orchestrator', 'child-worker', `Ticket: ${issued.token}`);
    f.harness.finish(issued.token, { ok: true, completed: 1, operationResults: [{ index: 1, operation: 'create_mesh', ok: true }] });
  }
  let status = f.harness.command('orchestrator', 'status');
  assert.equal(status.change.commits.length, 2);
  assert.equal(status.nextStep.phase, 'apply');
  assert.equal(git(f.root, ['status', '--porcelain', '--', f.project]).trim(), '');
  const tracker = read(f.root, `${f.project}/Documents/TASKSTRACKER.md`);
  assert.match(tracker, /^# Task Tracker — Test/);
  assert.match(tracker, /Tasks\/T001\/TASK\.md/);
  assert.match(read(f.root, `${f.project}/Documents/Tasks/T001/TASK.md`), /Child session: child-worker/);
  assert.ok(fs.existsSync(path.join(f.root, f.project, 'Documents', 'Tasks', 'T001', 'SUMMARY.md')));
  f.harness.command('orchestrator', 'finalize');
  status = f.harness.command('orchestrator', 'status');
  assert.equal(status.nextStep.phase, 'wip');
  const wipPath = `${f.project}/renders/wip/WIP-test.png`;
  write(f.root, wipPath, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const wip = issueAndConsume(f, 'orchestrator', 'wip');
  f.harness.finish(wip.token, { ok: true, renderPath: wipPath });
  assert.equal(f.harness.command('orchestrator', 'status').nextStep.phase, 'wip-inspect');
  f.harness.inspect('orchestrator', path.resolve(f.root, wipPath), true);
  assert.equal(f.harness.command('orchestrator', 'status').nextStep.phase, 'seal');
  seal(f);
  selfReview(f);
  f.harness.command('orchestrator', 'commit', { message: 'feat: strict fixture change' });
  const closed = f.harness.command('orchestrator', 'checkpoint');
  assert.equal(closed.change, null);
  assert.ok(f.harness.transaction((s) => s.projects[f.project].history.at(-1).final));
  assert.equal(f.harness.command('orchestrator', 'goal-complete').complete, true);
});

test('every third apply requires a WIP render before continuing', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  for (let index = 0; index < 3; index += 1) {
    const issued = issueAndConsume(f, 'orchestrator', 'apply', { index });
    f.harness.finish(issued.token, { ok: true });
  }
  assert.equal(f.harness.command('orchestrator', 'status').nextStep.phase, 'wip');
  const wipPath = `${f.project}/renders/wip/WIP-third.png`;
  write(f.root, wipPath, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const wip = issueAndConsume(f, 'orchestrator', 'wip');
  f.harness.finish(wip.token, { ok: true, renderPath: wipPath });
  assert.equal(f.harness.command('orchestrator', 'status').nextStep.phase, 'wip-inspect');
  f.harness.inspect('orchestrator', path.resolve(f.root, wipPath), true);
  assert.equal(f.harness.command('orchestrator', 'status').nextStep.phase, 'apply');
});

test('a failed worker task commits its task metadata and leaves the project clean', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  const issued = f.harness.issue('orchestrator', 'apply', { index: 1 });
  f.harness.failWorkerByToken('orchestrator', issued.token, 'worker crashed before apply');
  const task = f.harness.transaction((s) => s.projects[f.project].tasks.find((item) => item.id === issued.taskId));
  assert.equal(task.state, 'failed');
  assert.match(task.result, /worker crashed/);
  assert.ok(fs.existsSync(path.join(f.root, task.summaryDoc)));
  assert.equal(git(f.root, ['status', '--porcelain', '--', f.project]).trim(), '');
  assert.equal(f.harness.command('orchestrator', 'status').change.commits.length, 1);
  assert.notEqual(f.harness.command('orchestrator', 'status').change, null);
});

test('a failed apply commits task metadata without committing the failed scene', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  const issued = issueAndConsume(f, 'orchestrator', 'apply', { fail: true });
  f.harness.bindWorkerByToken('orchestrator', 'child-worker', issued.token);
  f.harness.finish(issued.token, { ok: false, error: 'controlled apply failure' });
  const task = f.harness.transaction((s) => s.projects[f.project].tasks.find((item) => item.id === issued.taskId));
  assert.equal(task.state, 'failed');
  assert.ok(task.child);
  assert.equal(git(f.root, ['status', '--porcelain', '--', f.project]).trim(), '');
  assert.equal(f.harness.command('orchestrator', 'status').change.commits.length, 1);
});

test('checkpoint rejects unrelated files and accepts scoped commit ranges', (t) => {
  const unrelated = useFixture(t);
  activate(unrelated);
  begin(unrelated);
  seal(unrelated);
  selfReview(unrelated);
  write(unrelated.root, `${unrelated.project}/notes.txt`, 'approved change\n');
  write(unrelated.root, `${unrelated.project}/unrelated.txt`, 'outside scope\n');
  commit(unrelated.root, 'unrelated change', [`${unrelated.project}/notes.txt`, `${unrelated.project}/unrelated.txt`]);
  gate(() => unrelated.harness.command('orchestrator', 'checkpoint'));

  const multiple = useFixture(t);
  activate(multiple);
  begin(multiple);
  seal(multiple);
  selfReview(multiple);
  write(multiple.root, `${multiple.project}/notes.txt`, 'first commit\n');
  scopedCommit(multiple, 'first change');
  write(multiple.root, `${multiple.project}/notes.txt`, 'second commit\n');
  scopedCommit(multiple, 'second change');
  assert.equal(multiple.harness.command('orchestrator', 'checkpoint').change, null);
});

test('state survives Harness restart and state lock blocks writers', (t) => {
  const f = useFixture(t);
  activate(f);
  const restarted = new Harness(f.root, { stateRoot: f.stateRoot });
  assert.equal(path.dirname(restarted.home), tempRoot);
  assert.equal(restarted.home.startsWith(f.root + path.sep), false);
  assert.equal(restarted.command('orchestrator', 'status').goalActive, true);
  f.harness.transaction(() => gate(() => restarted.command('orchestrator', 'status')));
  const started = begin(f);
  const again = new Harness(f.root, { stateRoot: f.stateRoot });
  const stableStatus = (status) => {
    const copy = structuredClone(status);
    if (copy.change) delete copy.change.deadlineRemainingMs;
    return copy;
  };
  assert.deepEqual(stableStatus(again.command('orchestrator', 'status')), stableStatus(started));
});

test('pause is explicit, requires a closed change, and stops the active goal', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  gate(() => f.harness.command('orchestrator', 'pause', { reason: 'User requested stop.' }), /close the open change/);
  f.harness.transaction((s) => { s.projects[f.project].change = null; });
  const paused = f.harness.command('orchestrator', 'pause', { reason: 'User requested stop.' });
  assert.equal(paused.goalActive, false);
  assert.equal(paused.nextStep.phase, 'goal');
  gate(() => begin(f));
});

test('reclaim requires a stale window and transfers ownership explicitly', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  f.harness.transaction((s) => {
    s.projects[f.project].orchestrator = 'old-session';
    s.projects[f.project].change.deadline = Date.now() + 60_000;
  });
  gate(() => f.harness.command('new-session', 'reclaim', { project: f.project, reason: 'test' }), /live change window/);
  f.harness.transaction((s) => { s.projects[f.project].change.deadline = Date.now() - 1; });
  const reclaimed = f.harness.command('new-session', 'reclaim', { project: f.project, reason: 'old session stopped responding' });
  assert.equal(reclaimed.goalActive, true);
  assert.equal(f.harness.command('new-session', 'status').project, f.project);
});

test('registration rejects takeover of project owned by another active orchestrator', (t) => {
  const f = useFixture(t);
  activate(f);
  gate(() => f.harness.prepare('second-orchestrator', {
    project: f.project,
    goal: f.goal.slice(f.project.length + 1),
    scene: f.sceneName,
  }));
});

test('registered projects open independent logical changes', (t) => {
  const f = useFixture(t);
  const other = { ...f, ...createProject(f.root, { name: 'Other' }) };
  commit(f.root, 'second scaffold', [other.project]);
  activate(f);
  activate(other, 'other-orchestrator');
  const first = begin(f);
  const second = begin(other, 'other-orchestrator');
  assert.notEqual(first.change.id, second.change.id);
  assert.equal(first.scene, f.scene);
  assert.deepEqual(first.change.paths, [`${f.project}/notes.txt`]);
  assert.equal(f.harness.command('orchestrator', 'status').change.id, first.change.id);
  assert.equal(f.harness.command('other-orchestrator', 'status').change.id, second.change.id);
  gate(() => begin(f));
});

test('contained and project methods reject traversal and symlink paths', (t) => {
  const f = useFixture(t);
  gate(() => contained(f.root, '../outside.txt'));
  activate(f);
  const outside = path.join(f.root, 'outside');
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'file.txt'), 'outside\n');
  const linked = path.join(f.root, f.project, 'linked');
  try {
    fs.symlinkSync(outside, linked, process.platform === 'win32' ? 'junction' : 'dir');
  } catch (error) {
    t.skip(`symlink creation unavailable: ${error.code ?? error.message}`);
    return;
  }
  gate(() => f.harness.command('orchestrator', 'begin', {
    outcome: 'linked path',
    objects: ['FixtureCube'],
    paths: ['linked/file.txt'],
  }));
  fs.unlinkSync(linked);
  const linkedState = path.join(tempRoot, `state-link-${process.pid}-${Date.now()}`);
  try {
    fs.symlinkSync(f.stateRoot, linkedState, process.platform === 'win32' ? 'junction' : 'dir');
    gate(() => new Harness(f.root, { stateRoot: linkedState }));
  } finally {
    if (fs.existsSync(linkedState)) fs.unlinkSync(linkedState);
  }
});

test('a successful WIP task commits its metadata and leaves the project clean', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  const applied = issueAndConsume(f, 'orchestrator', 'apply', { index: 1 });
  f.harness.finish(applied.token, { ok: true });
  f.harness.command('orchestrator', 'finalize');
  const wipPath = f.project + '/renders/wip/WIP-task-commit.png';
  write(f.root, wipPath, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const wip = issueAndConsume(f, 'orchestrator', 'wip');
  f.harness.finish(wip.token, { ok: true, renderPath: wipPath });
  const task = f.harness.transaction((s) => s.projects[f.project].tasks.find((item) => item.id === wip.taskId));
  assert.equal(task.state, 'done');
  assert.ok(fs.existsSync(path.join(f.root, task.summaryDoc)));
  assert.equal(git(f.root, ['status', '--porcelain', '--', f.project]).trim(), '');
  assert.equal(f.harness.command('orchestrator', 'status').change.commits.length, 2);
});

test('seal and grader task metadata commit at the task boundary', (t) => {
  const f = useFixture(t, { review: 'All' });
  activate(f);
  begin(f);
  seal(f);
  const sealCommit = git(f.root, ['log', '-1', '--format=%s']).trim();
  assert.match(sealCommit, /^task: T\d+ done$/);
  assert.equal(git(f.root, ['status', '--porcelain', '--', `${f.project}/Documents/TASKSTRACKER.md`, `${f.project}/Documents/Tasks`]).trim(), '');

  const ticket = f.harness.command('orchestrator', 'grader-ticket', { name: 'visual' });
  f.harness.bindGrader(
    'orchestrator',
    'child-grader',
    `Review assignment ${ticket.marker}`,
    { providerID: 'fixture-provider', modelID: 'fixture-model', variant: 'fixture-variant' },
  );
  write(f.root, ticket.report, [
    '# Visual report',
    '- Verdict: PASS',
    `Scene hash: ${ticket.sceneHash}`,
    `Evidence key: ${ticket.evidenceKey}`,
    '',
  ].join('\n'));
  f.harness.collectGrader('orchestrator', 'child-grader');
  assert.match(git(f.root, ['log', '-1', '--format=%s']).trim(), /^task: G\d+ done$/);
  assert.equal(git(f.root, ['status', '--porcelain', '--', `${f.project}/Documents/TASKSTRACKER.md`, `${f.project}/Documents/Tasks`]).trim(), '');
});

test('roster drift permits goal sync but blocks new work', (t) => {
  const f = useFixture(t, { review: 'All' });
  activate(f);
  const file = path.join(f.root, 'config.json');
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  config.blender_subagents.graders.graders[0].backup.model = 'changed-backup';
  fs.writeFileSync(file, JSON.stringify(config));
  assert.doesNotThrow(() => f.harness.command('orchestrator', 'goal-active'));
  gate(() => begin(f), /roster changed/);
});

test('task metadata records the governing ticket deadline', (t) => {
  const f = useFixture(t, { review: 'All' });
  activate(f);
  begin(f);
  const changeDeadline = f.harness.transaction((s) => s.projects[f.project].change.deadline);
  const apply = issueAndConsume(f, 'orchestrator', 'apply', { deadlineCheck: true });
  f.harness.finish(apply.token, { ok: true });
  const applyTask = f.harness.transaction((s) => s.projects[f.project].tasks.find((task) => task.token === apply.token));
  assert.ok(applyTask.deadline < changeDeadline);

  seal(f);
  const ticket = f.harness.command('orchestrator', 'grader-ticket', { name: 'visual' });
  const grader = f.harness.transaction((s) => s.projects[f.project].change.graders.visual);
  const graderTask = f.harness.transaction((s) => s.projects[f.project].tasks.find((task) => task.token === ticket.token));
  assert.equal(graderTask.deadline, grader.deadline);
});

test('synthetic live run: three-grader review, revision, and blocked recovery', (t) => {
  const f = useFixture(t, { review: 'All', configValue: threeGraderConfig() });
  activate(f);
  begin(f, 'orchestrator', {
    outcome: 'Build the cozy room shell',
    objects: ['Room_Floor', 'Room_Wall_Back', 'Window'],
    paths: ['notes.txt'],
    final: false,
    milestone: 'Room shell',
    requirements: ['REQ-01'],
  });
  for (let index = 0; index < 3; index += 1) simulationApply(f, index);
  seal(f, 'orchestrator', { round: 'R01-20261102T100000Z' });
  const visual = simulationGrader(f, 'visual', 'CHANGES_REQUIRED', { backup: true });
  assert.equal(visual.result.change.graders.visual.modelRole, 'backup');
  simulationGrader(f, 'technical', 'PASS');
  simulationGrader(f, 'spec', 'CHANGES_REQUIRED');
  const firstReview = simulationReview(f, 'The shell milestone is reviewed.');
  assert.equal(firstReview.change.verdict, 'CHANGES_REQUIRED');
  f.harness.command('orchestrator', 'checkpoint');

  begin(f, 'orchestrator', {
    outcome: 'Complete the cozy room',
    objects: ['Desk', 'Monitor', 'Chair'],
    paths: ['notes.txt'],
    final: true,
    revision: true,
    milestone: 'Final room',
    requirements: ['REQ-02'],
  });
  for (let index = 0; index < 2; index += 1) simulationApply(f, index + 3);
  seal(f, 'orchestrator', { round: 'R02-20261102T110000Z' });
  simulationGrader(f, 'visual', 'CHANGES_REQUIRED');
  simulationGrader(f, 'technical', 'PASS');
  simulationGrader(f, 'spec', 'BLOCKED');
  const retry = f.harness.command('orchestrator', 'grader-ticket', { name: 'spec' });
  assert.ok(retry.token);
  assert.equal(f.harness.transaction((s) => s.projects[f.project].change.graders.spec.attempt), 2);
  f.harness.command('orchestrator', 'grader-fail', { name: 'spec', reason: 'the retry never started a child session' });
  assert.equal(f.harness.command('orchestrator', 'status').nextStep.phase, 'review');
  const blocked = simulationReview(f, 'The R02 spec grader could not report.');
  assert.equal(blocked.change.verdict, 'BLOCKED');
  assert.equal(blocked.change.blockingKind, 'tooling');
  assert.equal(f.harness.command('orchestrator', 'status').nextStep.phase, 'preserve');
  const preserved = f.harness.command('orchestrator', 'preserve', { reason: 'Preserve the sealed R02 evidence for a later grader retry.' });
  assert.equal(preserved.change.verdict, 'WIP');
  f.harness.command('orchestrator', 'checkpoint');
  const paused = f.harness.command('orchestrator', 'pause', { reason: 'Synthetic run stopped after preserving a tooling block.' });
  assert.equal(paused.goalActive, false);
  assert.equal(git(f.root, ['status', '--porcelain', '--', f.project]).trim(), '');
  assert.equal(f.harness.transaction((s) => s.projects[f.project].history.at(-1).verdict), 'WIP');
});

test('synthetic live run: final all-grader PASS completes the goal', (t) => {
  const f = useFixture(t, { review: 'All', configValue: threeGraderConfig() });
  activate(f);
  begin(f, 'orchestrator', {
    outcome: 'Deliver the final cozy room',
    objects: ['Room_Floor', 'Desk', 'Monitor'],
    paths: ['notes.txt'],
    final: true,
    milestone: 'Final room',
    requirements: ['REQ-01', 'REQ-02'],
  });
  simulationApply(f, 0);
  seal(f, 'orchestrator', { round: 'R01-20261102T120000Z' });
  simulationGrader(f, 'visual', 'PASS');
  simulationGrader(f, 'technical', 'PASS');
  simulationGrader(f, 'spec', 'PASS');
  const reviewed = simulationReview(f, 'All three graders passed the final room.');
  assert.equal(reviewed.change.verdict, 'PASS');
  f.harness.command('orchestrator', 'checkpoint');
  f.harness.command('orchestrator', 'goal-complete');
  assert.equal(f.harness.command('orchestrator', 'status').complete, true);
});

test('synthetic live run: abrupt restart keeps the change and recovers an expired ticket', (t) => {
  const f = useFixture(t);
  activate(f);
  const started = begin(f, 'orchestrator', { outcome: 'Recover after a restarted orchestrator', paths: ['notes.txt'], final: false });
  const pending = f.harness.issue('orchestrator', 'apply', { resumed: true });
  const restarted = new Harness(f.root, { stateRoot: f.stateRoot });
  const before = restarted.command('orchestrator', 'status');
  assert.equal(before.change.id, started.change.id);
  assert.equal(before.change.pending, 'operation in progress');
  f.harness.transaction((s) => { s.tickets[pending.token].created = Date.now() - 600_001; });
  const recovered = restarted.recover('orchestrator');
  assert.equal(recovered.change.id, started.change.id);
  assert.equal(recovered.change.pending, null);
  assert.equal(restarted.command('orchestrator', 'status').change.operations, 0);
});
