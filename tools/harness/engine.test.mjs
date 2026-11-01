import assert from 'node:assert/strict';
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
          max_minutes: 1,
          max_steps: 4,
        }],
        ...overrides,
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

  write(root, `${project}/README.md`, '# Fixture project\n');
  write(root, `${project}/Documents/REQUIREMENTS.md`, [
    'Status: Confirmed',
    'Confirmed: 2026-10-31',
    'Confirmation: Fixture requirements confirmed for adversarial workflow tests.',
    '',
  ].join('\n'));
  write(root, `${project}/Documents/WORKFLOW.md`, [
    `Mode: ${workflow}`,
    'Selected: 2026-10-31',
    '',
  ].join('\n'));
  write(root, `${project}/Documents/REVIEW.md`, [
    `Mode: ${review}`,
    'Selected: 2026-10-31',
    ...(review === 'Single' ? ['Single grader: visual'] : []),
    '',
  ].join('\n'));
  write(root, `${project}/Documents/ASSETS.md`, '# Fixture assets\n');
  write(root, `${project}/Documents/DECISIONS.md`, '# Fixture decisions\n');
  write(root, `${project}/Documents/Goals/01-test-goal.md`, `${prompt}\n`);
  write(root, `${project}/Documents/Reviews/README.md`, '# Review rounds\n');
  write(root, `${project}/Documents/Reviews/.gitignore`, '_evidence/\ntmp/\n');
  write(root, `${project}/.gitignore`, 'logs/\n');
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
  f.harness.transaction((state) => { state.tickets[expired.token].created = Date.now() - 60_001; });
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
  f.harness.transaction((state) => { state.tickets[expired.token].created = Date.now() - 60_001; });
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
  f.harness.transaction((state) => { state.tickets[expired.token].created = Date.now() - 60_001; });
  f.harness.recover('orchestrator');
  const change = f.harness.transaction((state) => state.projects[f.project].change);
  assert.equal(change.failure, undefined);
  assert.equal(change.pending, undefined);
  assert.ok(change.deadline > Date.now());
  const retried = issueAndConsume(f, 'orchestrator', 'apply', { retried: true });
  f.harness.finish(retried.token, { ok: true });
  assert.equal(f.harness.command('orchestrator', 'status').change.operations, 1);
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
  assert.match(reviewed.change.graders.visual.error, /deadline/);
  gate(() => f.harness.command('orchestrator', 'grader-ticket', { name: 'visual' }));
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

test('review record notes can change after registration', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  seal(f);
  selfReview(f);
  write(f.root, `${f.project}/Documents/REVIEW.md`, 'Mode: Off\nSelected: 2026-10-31\n\nReview notes updated.\n');
  scopedCommit(f, 'record review notes');
  f.harness.command('orchestrator', 'checkpoint');
});

test('review auto-commits reports and the verdict before checkpoint', (t) => {
  const f = useFixture(t, { review: 'All' });
  activate(f);
  begin(f);
  reviewAll(f);
  assert.equal(git(f.root, ['status', '--porcelain']).trim(), '');
  assert.equal(git(f.root, ['rev-list', '--count', 'HEAD']).trim(), '2');
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

test('checkpoint accepts one exact scoped commit and completes goal after PASS', (t) => {
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
  assert.equal(git(f.root, ['rev-list', '--count', 'HEAD']).trim(), '2');
  const complete = f.harness.command('orchestrator', 'goal-complete');
  assert.equal(complete.complete, true);
  assert.equal(complete.change, null);
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

test('checkpoint rejects unrelated files and multiple commits', (t) => {
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
  gate(() => multiple.harness.command('orchestrator', 'checkpoint'));
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
  assert.deepEqual(again.command('orchestrator', 'status'), started);
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
