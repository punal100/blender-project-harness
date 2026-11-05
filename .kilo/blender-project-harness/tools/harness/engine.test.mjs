import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { Harness, contained, externalBinaryPolicy, modelRole, transientGitFailure } from './engine.mjs';

const tempRoot = path.join(os.tmpdir(), 'kilo');
fs.mkdirSync(tempRoot, { recursive: true });
const PNG_1X1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2ZQAAAABJRU5ErkJggg==', 'base64');
const GLB = Buffer.concat([Buffer.from('glTF'), Buffer.from([2, 0, 0, 0]), Buffer.alloc(8)]);

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
    '- Reference images / links: none',
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
  write(root, `${project}/Documents/References/SCENE-HEALTH.md`, '# Scene Health\n\n## Dimensions\n\nFixture dimensions.\n\n## Topology\n\nFixture topology.\n');
  write(root, `${project}/Documents/TASKSTRACKER.md`, '# Task Tracker — Test\n\nStatus: Active\nLast updated: 2026-10-31\n\n## Tasks\n\n| Task | Kind | Change | Operation | Objects | Assigned | Child | State | Created | Finished | Result |\n|---|---|---|---|---|---|---|---|---|---|---|\n| — | — | — | — | — | — | — | — | — | — | — |\n');
  write(root, `${project}/Documents/Goals/01-test-goal.md`, [
    '# Goal: Fixture',
    ...['Mission', 'Project', 'Visual outcome', 'Scope', 'Deliverables', 'Acceptance', 'Workflow', 'Done'].flatMap((name) => [`## ${name}`, prompt, '']),
  ].join('\n'));
  write(root, `${project}/Documents/Reviews/README.md`, '# Review rounds\n\n## Index\n\n| Round | UTC | Target | Mode | Graders | Verdict | Report |\n|---|---|---|---|---|---|---|\n| — | — | — | — | — | — | — |\n\n## Rules\n\nFixture rules.\n');
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
    write(root, '.kilo/blender-project-harness/config.json', JSON.stringify(configValue ?? validGraderConfig(), null, 2));
  } else if (configValue !== undefined) {
    write(root, '.kilo/blender-project-harness/config.json', JSON.stringify(configValue, null, 2));
  }
  git(root, ['init', '--quiet']);
  git(root, ['config', 'user.name', 'Harness Tests']);
  git(root, ['config', 'user.email', 'harness-tests@example.invalid']);
  if (commitInitial) commit(root, 'scaffold fixture');
  const harness = new Harness(root, { stateRoot });
  const reference = harness.command('orchestrator', 'reference');
  harness.question('orchestrator', registrationQuestion(reference), [['None']]);
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
  assert.match(f.harness.command('orchestrator', 'status').next, /registered \/goal-blender/);
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

test('prepare requires a runtime reference answer', (t) => {
  const f = useFixture(t);
  const args = { project: f.project, goal: f.goal.slice(f.project.length + 1), scene: f.sceneName };
  f.harness.transaction((s) => { delete s.references.orchestrator; });
  gate(() => f.harness.prepare('orchestrator', args), /reference question has not been issued/i);
  const reference = f.harness.command('orchestrator', 'reference');
  gate(() => f.harness.prepare('orchestrator', args), /reference question is unanswered.*HARNESS REFERENCE token/is);
  assert.equal(reference.answered, false);
  f.harness.question('orchestrator', registrationQuestion(reference), [['None']]);
  assert.ok(f.harness.prepare('orchestrator', args).question);
});

test('pending registration does not lock out another session forever', (t) => {
  const f = useFixture(t);
  const args = { project: f.project, goal: f.goal.slice(f.project.length + 1), scene: f.sceneName };
  const firstReference = f.harness.command('first', 'reference');
  f.harness.question('first', registrationQuestion(firstReference), [['None']]);
  f.harness.prepare('first', args);
  const secondReference = f.harness.command('second', 'reference');
  f.harness.question('second', registrationQuestion(secondReference), [['None']]);
  gate(() => f.harness.prepare('second', args), /pending in another session/);
  f.harness.transaction((s) => { s.challenge.created -= 600001; });
  const prepared = f.harness.prepare('second', args);
  f.harness.question('second', { questions: [{ question: prepared.question, options: prepared.labels.map((label) => ({ label })) }] }, [['Confirm registration']]);
  assert.match(f.harness.command('second', 'status').next, /registered \/goal-blender/);
});

test('bounded changes track scenes and scene requirement mappings', (t) => {
  const f = useFixture(t);
  activate(f);
  gate(() => begin(f, 'orchestrator', { scenes: [''], requirements: ['REQ-001'] }), /printable scene names/);
  begin(f, 'orchestrator', {
    scenes: ['SC_001', 'SC_002'],
    requirements: ['REQ-001', 'REQ-002'],
    sceneRequirements: { 'REQ-001': ['SC_001'], 'REQ-002': ['SC_001', 'SC_002'] },
  });
  let status = f.harness.command('orchestrator', 'status');
  assert.deepEqual(status.change.scenes, ['SC_001', 'SC_002']);
  assert.equal(status.change.primaryScene, 'SC_001');
  assert.deepEqual(status.change.sceneRequirements['REQ-002'], ['SC_001', 'SC_002']);
  f.harness.command('orchestrator', 'extend', { scenes: ['SC_003'], paths: ['Documents/DECISIONS.md'] });
  status = f.harness.command('orchestrator', 'status');
  assert.deepEqual(status.change.scenes, ['SC_001', 'SC_002', 'SC_003']);
  gate(() => f.harness.command('orchestrator', 'extend', { scenes: [''], paths: ['Documents/DECISIONS.md'] }), /printable scene names/);
  gate(() => f.harness.command('orchestrator', 'extend', { scenes: Array.from({ length: 33 }, (_, index) => `SC_${index}`), paths: ['Documents/DECISIONS.md'] }), /capped at 32|up to 32/);
});

test('multi-scene seal requires an inspection for every declared scene', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f, 'orchestrator', { scenes: ['SC_001', 'SC_002'], requirements: ['REQ-001'], sceneRequirements: { 'REQ-001': ['SC_001'] } });
  const apply = issueAndConsume(f, 'orchestrator', 'apply');
  f.harness.finish(apply.token, { ok: true, operationResults: [{ operation: 'create_mesh', ok: true }] });
  f.harness.command('orchestrator', 'finalize');
  const wipPath = `${f.project}/renders/wip/WIP-scenes.png`;
  write(f.root, wipPath, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const wip = issueAndConsume(f, 'orchestrator', 'wip');
  f.harness.finish(wip.token, { ok: true, renderPath: wipPath });
  f.harness.inspect('orchestrator', path.resolve(f.root, wipPath), true);
  const primary = `${f.project}/renders/final/R01-test.png`;
  const secondary = `${f.project}/Documents/Reviews/R01-test/_evidence/scenes/SC_002/camera.png`;
  write(f.root, primary, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  write(f.root, secondary, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const evidence = Object.fromEntries([primary, secondary].map((name) => [name, f.harness.hash(name)]));
  write(f.root, `${f.project}/Documents/Reviews/R01-test/manifest.json`, JSON.stringify({ round: 'R01-test', scene: f.scene, scenes: ['SC_001', 'SC_002'], evidence }, null, 2) + '\n');
  const seal = issueAndConsume(f, 'orchestrator', 'seal');
  f.harness.finish(seal.token, { ok: true, round: 'R01-test', renderPath: primary, evidence, renders: { SC_001: primary, SC_002: secondary }, primaryScene: 'SC_001', scenes: ['SC_001', 'SC_002'] });
  let status = f.harness.command('orchestrator', 'status');
  assert.equal(status.change.inspected, false);
  assert.deepEqual(status.change.scenes, ['SC_001', 'SC_002']);
  f.harness.inspect('orchestrator', path.resolve(f.root, primary), true);
  assert.equal(f.harness.command('orchestrator', 'status').change.inspected, false);
  f.harness.inspect('orchestrator', path.resolve(f.root, secondary), true);
  status = f.harness.command('orchestrator', 'status');
  assert.equal(status.change.inspected, true);
  assert.equal(status.change.inspections.SC_002.hash, evidence[secondary]);
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
  const reference = f.harness.command(session, 'reference');
  if (!reference.answered) f.harness.question(session, registrationQuestion(reference), [['None']]);
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
    ...(options.scenes === undefined ? {} : { scenes: options.scenes }),
    ...(options.sceneRequirements === undefined ? {} : { sceneRequirements: options.sceneRequirements }),
    ...(options.media === undefined ? {} : { media: options.media }),
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
  const factsPath = `${evidenceRoot}/scene-facts.json`;
  const evidenceNames = [
    renderPath,
    `${evidenceRoot}/camera.png`,
    factsPath,
    `${evidenceRoot}/scene.txt`,
  ];
  write(f.root, renderPath, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  write(f.root, `${evidenceRoot}/camera.png`, Buffer.from('camera evidence\n'));
  write(f.root, factsPath, JSON.stringify({
    name: 'Scene',
    objects: [{
      name: 'Cube',
      type: 'MESH',
      location: [0, 0, 1],
      dimensions: [2, 2, 2],
      mesh: {
        vertices: 8,
        edges: 12,
        faces: 6,
        ngons: 0,
        non_manifold_edges: 0,
        loose_vertices: 0,
        degenerate_faces: 0,
      },
    }],
    camera: 'Camera',
    resolution: [1920, 1080],
    engine: 'BLENDER_EEVEE',
  }, null, 2) + '\n');
  write(f.root, `${evidenceRoot}/scene.txt`, 'scene evidence\n');
  const evidence = Object.fromEntries(evidenceNames.map((name) => [name, f.harness.hash(name)]));
  const manifestPath = `${f.project}/Documents/Reviews/${round}/manifest.json`;
  const assetCheck = f.harness.transaction((s) => s.projects[f.project].change?.assetCheckReceipt ?? null);
  write(f.root, manifestPath, JSON.stringify({ round, scene: f.scene, asset_check: assetCheck, evidence, tasks: {} }, null, 2) + '\n');
  const issued = issueAndConsume(f, session, 'seal');
  const result = f.harness.finish(issued.token, { ok: true, round, renderPath, evidence });
  const absoluteRender = path.resolve(f.root, renderPath);
  if (inspect) f.harness.inspect(session, absoluteRender, true);
  return { ...issued, result, round, renderPath, evidence, absoluteRender, factsPath, manifestPath };
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

function simulationAssetCheck(f) {
  write(f.root, `${f.project}/notes.txt`, 'strict asset check fixture\n');
  const applied = issueAndConsume(f, 'orchestrator', 'apply', { operation: 'check_assets', strict: true });
  const receipt = {
    ok: true,
    operation: 'check_assets',
    strict: true,
    external: [],
    missing: [],
    packed: ['fixture.png'],
    libraries: [],
  };
  f.harness.finish(applied.token, {
    ok: true,
    operationResults: [{ index: 1, operation: 'check_assets', ok: true, receipt }],
  });
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

test('grader step ceiling accepts 20 and rejects 25', (t) => {
  const accepted = validGraderConfig();
  accepted.blender_subagents.graders.graders[0].max_steps = 20;
  const ok = useFixture(t, { review: 'All', configValue: accepted });
  assert.doesNotThrow(() => ok.harness.prepare('orchestrator', {
    project: ok.project,
    goal: ok.goal.slice(ok.project.length + 1),
    scene: ok.sceneName,
  }));

  const rejected = validGraderConfig();
  rejected.blender_subagents.graders.graders[0].max_steps = 25;
  const bad = useFixture(t, { review: 'All', configValue: rejected });
  gate(() => bad.harness.prepare('orchestrator', {
    project: bad.project,
    goal: bad.goal.slice(bad.project.length + 1),
    scene: bad.sceneName,
  }), /invalid grader roster/);
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
  assert.match(ticket.prompt, /blender_look \{image:"<absolute assigned evidence image>"\}/);
  assert.match(ticket.prompt, /reserve at least one step for the report write/);
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
  gate(() => f.harness.command('orchestrator', 'begin', { outcome: 'wrong scene', objects: ['FixtureCube'], paths: ['other.blend'] }), /not the registered scene.*other executable files/i);
  begin(f);
  gate(() => f.harness.issue('orchestrator', 'unknown', ticketPayload(f)));
  gate(() => f.harness.command('orchestrator', 'unknown-action'));
  gate(() => f.harness.finish('forged-token', { ok: true }));
  gate(() => f.harness.command('orchestrator', 'approval'));
});

test('status marks generative next-step commands as templates', (t) => {
  const f = useFixture(t);
  activate(f);
  const step = f.harness.command('orchestrator', 'status').nextStep;
  assert.equal(step.phase, 'begin');
  assert.equal(step.template, true);
  assert.match(step.instruction, /replace every placeholder/i);
});

test('begin normalizes workspace-prefixed paths to project-relative paths', (t) => {
  const f = useFixture(t);
  activate(f);
  const started = begin(f, 'orchestrator', { paths: [`${f.project}/notes.txt`] });
  assert.deepEqual(started.change.paths, [`${f.project}/notes.txt`]);
});

test('status gives an executable bootstrap begin example when the scene is missing', (t) => {
  const f = useFixture(t);
  git(f.root, ['rm', '--quiet', '--', f.scene]);
  git(f.root, ['commit', '--quiet', '-m', 'test: remove scene for bootstrap']);
  activate(f);
  const step = f.harness.command('orchestrator', 'status').nextStep;
  assert.equal(step.phase, 'begin');
  assert.match(step.command, /Save the initial empty scene/);
  assert.match(step.command, /objects/);
  assert.match(step.command, /\[\]/);
  assert.match(step.command, /scene\.blend/);
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
    if (index > 0 && index % 3 === 0) {
      const wipPath = `${f.project}/renders/wip/WIP-budget-${index}.png`;
      write(f.root, wipPath, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      const wip = issueAndConsume(f, 'orchestrator', 'wip');
      f.harness.finish(wip.token, { ok: true, renderPath: wipPath });
      f.harness.inspect('orchestrator', path.resolve(f.root, wipPath), true);
    }
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

test('model matching is case-insensitive and ignores provider prefixes', () => {
  const choice = {
    provider: 'Punal-9Router-Compatable',
    model: 'ocg/deepseek-v4.1-flash',
    variant: 'Max',
    backup: { provider: 'backup', model: 'vendor/gpt-6.1-sol', variant: 'xhigh' },
  };
  assert.equal(modelRole(choice, { providerID: 'punal-9router-compatable', modelID: 'deepseek-v4.1-flash', variant: 'max' }), 'primary');
  assert.equal(modelRole(choice, { providerID: 'backup', modelID: 'gpt-6.1-sol', variant: 'extra-high' }), 'backup');
  assert.equal(modelRole(choice, { providerID: 'punal-9router-compatable', modelID: 'deepseek-v4.1-flash', variant: 'low' }), null);
  assert.equal(modelRole(choice, { providerID: 'punal-9router-compatable', modelID: 'deepseek-v4.1-flash' }), 'primary');
});

test('reclaim refuses a stale registration and forget discards it', (t) => {
  const f = useFixture(t);
  activate(f);
  f.harness.transaction((state) => { state.projects[f.project].checkpoint = 'f'.repeat(40); });
  assert.throws(() => f.harness.command('other', 'reclaim', { project: f.project, reason: 'take over the stale project' }), /does not match this checkout/);
  const forgotten = f.harness.command('other', 'forget', { project: f.project, reason: 'state belongs to another branch' });
  assert.equal(forgotten.forgotten, f.project);
  assert.equal(f.harness.transaction((state) => state.projects[f.project]), undefined);
  const otherReference = f.harness.command('other', 'reference');
  f.harness.question('other', registrationQuestion(otherReference), [['None']]);
  const prepared = f.harness.prepare('other', { project: f.project, scene: f.sceneName, goal: f.goal.slice(f.project.length + 1) });
  assert.ok(prepared.question);
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

test('abandon closes an empty expired change without a commit', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  f.harness.transaction((state) => { state.projects[f.project].change.deadline = 0; });
  const expired = f.harness.command('orchestrator', 'status');
  assert.equal(expired.nextStep.phase, 'abandon');
  const result = f.harness.command('orchestrator', 'abandon', { reason: 'Empty change expired without applying anything' });
  assert.equal(result.change, null);
  assert.equal(f.harness.transaction((state) => state.projects[f.project].history.at(-1).verdict), 'ABANDONED');
  const fresh = begin(f);
  assert.equal(fresh.change.operations, 0);
});

test('empty expired change closes with a WIP commit without staging files', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  f.harness.transaction((state) => { state.projects[f.project].change.deadline = 0; });
  const result = f.harness.command('orchestrator', 'commit', { message: 'wip: close empty change', mode: 'wip' });
  assert.equal(result.change, null);
  assert.equal(f.harness.transaction((state) => state.projects[f.project].history.at(-1).verdict), 'WIP');
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

test('apply commits skip ignored external asset binaries', (t) => {
  const f = useFixture(t);
  const asset = `${f.project}/assets/external/Poly-Haven/wood.jpg`;
  write(f.root, asset, Buffer.from('ignored image bytes\n'));
  write(f.root, `${f.project}/assets/external/Poly-Haven/SOURCE.md`, 'Source: Poly Haven\nRedistribution allowed: yes\n');
  write(f.root, `${f.project}/assets/external/Poly-Haven/LICENSE.txt`, 'CC0-1.0\n');
  fs.appendFileSync(path.join(f.root, f.project, '.gitignore'), 'assets/external/**/*.jpg\n');
  commit(f.root, 'test: ignored external asset fixture', [f.project]);
  activate(f);
  begin(f, 'orchestrator', { paths: ['notes.txt', 'assets/external/Poly-Haven/wood.jpg'] });
  write(f.root, `${f.project}/notes.txt`, 'texture batch changed notes\n');
  const applied = issueAndConsume(f, 'orchestrator', 'apply', { simulation: 1 });
  f.harness.finish(applied.token, { ok: true, operationResults: [{ operation: 'image_texture' }] });
  assert.equal(f.harness.command('orchestrator', 'status').change.operations, 1);
  const committed = git(f.root, ['show', '--name-only', '--pretty=format:', 'HEAD']).split(/\r?\n/).filter(Boolean);
  assert.ok(!committed.includes(asset));
  assert.ok(committed.includes(`${f.project}/notes.txt`));
});

test('WIP commit accepts a staged index and skips ignored external assets', (t) => {
  const f = useFixture(t);
  const asset = `${f.project}/assets/external/Poly-Haven/wood.jpg`;
  write(f.root, asset, Buffer.from('ignored image bytes\n'));
  write(f.root, `${f.project}/assets/external/Poly-Haven/SOURCE.md`, 'Source: Poly Haven\nRedistribution allowed: yes\n');
  write(f.root, `${f.project}/assets/external/Poly-Haven/LICENSE.txt`, 'CC0-1.0\n');
  fs.appendFileSync(path.join(f.root, f.project, '.gitignore'), 'assets/external/**/*.jpg\n');
  commit(f.root, 'test: ignored external asset fixture', [f.project]);
  activate(f);
  begin(f, 'orchestrator', { paths: ['notes.txt', 'assets/external/Poly-Haven/wood.jpg'] });
  write(f.root, `${f.project}/notes.txt`, 'staged before the apply failed\n');
  git(f.root, ['add', '--', `${f.project}/notes.txt`]);
  f.harness.transaction((state) => {
    const change = state.projects[f.project].change;
    change.failure = 'simulated staging failure';
    change.deadline = 0;
  });
  const result = f.harness.command('orchestrator', 'commit', { message: 'wip: preserve interrupted apply', mode: 'wip' });
  assert.equal(result.nextStep.phase, 'checkpoint');
  const committed = git(f.root, ['show', '--name-only', '--pretty=format:', 'HEAD']).split(/\r?\n/).filter(Boolean);
  assert.ok(!committed.includes(asset));
  assert.ok(committed.includes(`${f.project}/notes.txt`));
  const checkpointed = f.harness.command('orchestrator', 'checkpoint');
  assert.equal(checkpointed.change, null);
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

test('failed review approval excludes the impossible approve option', (t) => {
  const f = useFixture(t, { workflow: 'Partially Autonomous', review: 'Single' });
  activate(f);
  begin(f);
  seal(f);
  simulationGrader(f, 'visual', 'CHANGES_REQUIRED');
  f.harness.command('orchestrator', 'review', {
    notes: 'The visual grader found a confirmed major issue.',
    reason: 'The sealed change requires a correction.',
    dispositions: 'The major finding is accepted.',
  });
  const approval = f.harness.command('orchestrator', 'approval');
  assert.equal(approval.verdict, 'CHANGES_REQUIRED');
  assert.deepEqual(approval.labels, ['Request revision', 'Pause']);
  assert.equal(approval.defaultLabel, 'Request revision');
  assert.match(approval.instruction, /default to "Request revision"/);
  assert.match(approval.afterApproval, /commit the failed round.*begin a bounded revision/i);
  assert.doesNotMatch(approval.question, /Approve change/);
  gate(() => f.harness.question('orchestrator', {
    questions: [{ question: approval.question, options: approval.labels.slice().reverse().map((label) => ({ label })), custom: false, multiple: false }],
  }, [['Request revision']]), /not recorded.*still pending.*labels exactly.*Request revision.*Pause.*default "Request revision"/);
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
  assert.equal(ticket.evidenceFiles.length, 4);
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
  assert.match(partialTicket.prompt, /Report timing: .*write the assigned REPORT\.md before your final step/i);
  assert.match(partialTicket.prompt, /reserve at least one step for the report write/i);

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

test('a collected BLOCKED report is archived before a replacement ticket', (t) => {
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
  const report = [
    '# Visual report',
    '- Verdict: BLOCKED',
    `Scene hash: ${first.sceneHash}`,
    `Evidence key: ${first.evidenceKey}`,
    '',
  ].join('\n');
  write(f.root, first.report, report);
  f.harness.collectGrader('orchestrator', 'child-one');
  const recorded = f.harness.transaction((s) => s.projects[f.project].change.reports[first.report]);
  assert.ok(recorded);

  const retry = f.harness.command('orchestrator', 'grader-ticket', { name: 'visual' });
  assert.ok(retry.token);
  assert.equal(f.harness.transaction((s) => s.projects[f.project].change.graders.visual.attempt), 2);
  assert.equal(fs.existsSync(path.join(f.root, first.report)), false);
  const archived = first.report.replace(/\/REPORT\.md$/, '/REPORT.attempt1.md');
  assert.equal(fs.readFileSync(path.join(f.root, archived), 'utf8').replace(/\r\n/g, '\n'), report);
  assert.equal(f.harness.transaction((s) => s.projects[f.project].change.reports[archived]), recorded);

  const reviewed = f.harness.command('orchestrator', 'review', {
    notes: 'The archived report remains tooling-blocked.',
    reason: 'The grader is tooling-blocked and cannot provide a pass.',
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

test('a transient report commit failure preserves a valid PASS report for recovery', (t) => {
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
  const report = [
    '# Visual report',
    '- Verdict: PASS',
    `Scene hash: ${first.sceneHash}`,
    `Evidence key: ${first.evidenceKey}`,
    '',
  ].join('\n');
  write(f.root, first.report, report);
  f.harness.transaction((s) => {
    const change = s.projects[f.project].change;
    change.graders.visual.error = 'spawnSync git ETIMEDOUT';
    change.graders.visual.kind = 'tooling';
    const task = s.projects[f.project].tasks.find((item) => item.token === change.graders.visual.token);
    task.state = 'failed';
    task.result = change.graders.visual.error;
  });

  const recovered = f.harness.command('orchestrator', 'grader-ticket', { name: 'visual' });
  assert.equal(recovered.recovered, true);
  assert.equal(recovered.verdict, 'PASS');
  assert.equal(fs.readFileSync(path.join(f.root, first.report), 'utf8').replace(/\r\n/g, '\n'), report);
  const grader = f.harness.command('orchestrator', 'status').change.graders.visual;
  assert.equal(grader.verdict, 'PASS');
  assert.equal(grader.error, undefined);
  assert.equal(grader.attempt, 1);

  const reviewed = f.harness.command('orchestrator', 'review', {
    notes: 'The recovered PASS report is valid.',
    reason: 'The report commit failure was transient; the report remains valid.',
    dispositions: 'No findings; the valid report was preserved.',
  });
  assert.equal(reviewed.change.verdict, 'PASS');
});

test('a grader cannot overwrite an existing valid report', (t) => {
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
  const pass = [
    '# Visual report',
    '- Verdict: PASS',
    `Scene hash: ${first.sceneHash}`,
    `Evidence key: ${first.evidenceKey}`,
    '',
  ].join('\n');
  write(f.root, first.report, pass);
  gate(() => f.harness.documentWrite('child-one', {
    path: first.report.slice(f.project.length + 1),
    content: [
      '# Visual report',
      '- Verdict: BLOCKED',
      `Scene hash: ${first.sceneHash}`,
      `Evidence key: ${first.evidenceKey}`,
      '',
    ].join('\n'),
  }), /valid report already present/);
  assert.equal(fs.readFileSync(path.join(f.root, first.report), 'utf8').replace(/\r\n/g, '\n'), pass);
});

test('transient git failures are classified for retry', () => {
  assert.equal(transientGitFailure({ error: { code: 'ETIMEDOUT' } }), true);
  assert.equal(transientGitFailure({ stderr: Buffer.from('fatal: Unable to create .git/index.lock: File exists') }), true);
  assert.equal(transientGitFailure({ error: { code: 'ENOENT' } }), false);
  assert.equal(transientGitFailure({ stderr: Buffer.from('fatal: not a git repository') }), false);
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

test('media requests gate work and close after generated intake', (t) => {
  const f = useFixture(t);
  activate(f);
  const started = begin(f, 'orchestrator', {
    media: true,
    paths: ['README.md', 'Documents/References/SCENE-HEALTH.md'],
  });
  assert.equal(started.nextStep.phase, 'media-request');
  gate(() => f.harness.issue('orchestrator', 'apply', {}), /media request/);

  const requested = f.harness.command('orchestrator', 'media-request', {
    purpose: 'Generated concept reference for the desk corner',
    kind: 'image',
    tool: 'mediamcp_generate_image',
    model: 'test-model',
    prompt: 'A warm reading corner with a walnut desk',
    seed: 42,
    creditEstimate: '1 image',
  });
  const request = requested.media.requests[0];
  assert.equal(request.status, 'requested');
  assert.equal(request.seed, 42);
  assert.match(read(f.root, `${f.project}/Documents/MEDIA.md`), /Generated concept reference/);
  gate(() => f.harness.command('orchestrator', 'commit', { message: 'docs: media request' }), /media request/);

  assert.equal(f.harness.mediaStart('orchestrator', request.id).request.status, 'generating');
  write(f.root, '.temp/references/media-test.png', PNG_1X1);
  const completed = f.harness.command('orchestrator', 'media-complete', {
    id: request.id,
    path: '.temp/references/media-test.png',
    creditActual: '1 image',
  });
  assert.equal(completed.media.open.status, 'generated');
  assert.equal(completed.media.open.sha256.length, 64);
  assert.equal(completed.media.open.width, 1);
  gate(() => f.harness.issue('orchestrator', 'apply', {}), /media request/);

  const intaken = f.harness.intake('orchestrator', { project: f.project, media: request.id });
  assert.equal(intaken.media.status, 'intaken');
  assert.match(intaken.media.projectPath, /^Blender\/Test\/Documents\/References\/media-test-[a-f0-9]{8}\.png$/);
  const committed = f.harness.command('orchestrator', 'commit', { message: 'docs: record generated reference' });
  assert.equal(committed.media.requests[0].status, 'committed');
  const checkpointed = f.harness.command('orchestrator', 'checkpoint');
  assert.equal(checkpointed.change, null);
});

test('media failure is recorded and the change can close', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f, 'orchestrator', { media: true, paths: ['README.md'] });
  const requested = f.harness.command('orchestrator', 'media-request', {
    purpose: 'Generated concept reference',
    tool: 'mediamcp_generate_image',
    prompt: 'A warm reading corner',
  });
  const id = requested.media.requests[0].id;
  const first = f.harness.command('orchestrator', 'media-fail', { id, error: 'provider timeout' });
  assert.equal(first.media.open.status, 'requested');
  assert.equal(first.media.open.attempts, 1);
  const second = f.harness.command('orchestrator', 'media-fail', { id, error: 'provider timeout again' });
  assert.equal(second.media.open, null);
  assert.equal(second.media.requests[0].status, 'failed');
  assert.equal(second.media.requests[0].attempts, 2);
  const committed = f.harness.command('orchestrator', 'commit', { message: 'docs: record media failure' });
  assert.equal(committed.media.requests[0].status, 'failed');
  assert.doesNotThrow(() => f.harness.command('orchestrator', 'checkpoint'));
});

test('media cannot start before the initial scene is saved', (t) => {
  const f = useFixture(t);
  fs.rmSync(path.join(f.root, ...f.scene.split('/')), { force: true });
  commit(f.root, 'test: remove fixture scene', [f.project]);
  activate(f);
  gate(() => begin(f, 'orchestrator', { media: true }), /initial scene/);
  begin(f, 'orchestrator', { paths: ['README.md'] });
  gate(() => f.harness.command('orchestrator', 'media-request', {
    purpose: 'Generated concept reference',
    tool: 'mediamcp_generate_image',
    prompt: 'A warm reading corner',
  }), /initial scene/);
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
  const complete = f.harness.command('orchestrator', 'goal-complete', { reason: 'All acceptance checks passed.' });
  assert.equal(complete.complete, true);
  assert.equal(complete.goalActive, false);
  assert.equal(complete.goalSource, null);
  assert.equal(complete.goalReport.reason, 'All acceptance checks passed.');
  assert.equal(complete.nextStep.phase, 'complete');
});

test('goal conflict stops production and offers recovery', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  const conflict = f.harness.command('orchestrator', 'goal-conflict', { reason: 'Built-in /goal was used.' });
  assert.equal(conflict.goalActive, false);
  assert.equal(conflict.goalConflict.kind, 'built-in-goal');
  assert.equal(conflict.nextStep.phase, 'goal-conflict');
  gate(() => f.harness.command('orchestrator', 'begin', { outcome: 'blocked', objects: ['Cube'], paths: ['notes.txt'] }), /active goal/);
});

test('goal conflict preserves and checkpoints an open change before reregister', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f, 'orchestrator', { paths: ['README.md'] });
  fs.appendFileSync(path.join(f.root, f.project, 'README.md'), 'Conflict recovery note.\n');
  f.harness.transaction((s) => { s.projects[f.project].change.operations = 1; });
  const conflict = f.harness.command('orchestrator', 'goal-conflict', { reason: 'Built-in /goal was used.' });
  assert.equal(conflict.nextStep.action, 'preserve');
  const preserved = f.harness.command('orchestrator', 'preserve', { reason: 'Preserve before re-registration.' });
  assert.equal(preserved.nextStep.action, 'checkpoint');
  const checkpointed = f.harness.command('orchestrator', 'checkpoint');
  assert.equal(checkpointed.change, null);
  assert.equal(checkpointed.nextStep.action, 'reregister');
});

test('goal conflict revokes issued tickets', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  const issued = f.harness.issue('orchestrator', 'save', {});
  f.harness.command('orchestrator', 'goal-conflict', { reason: 'Built-in /goal was used.' });
  assert.equal(f.harness.transaction((s) => s.tickets[issued.token].state), 'abandoned');
  gate(() => f.harness.authorize('orchestrator', issued.token, 'save', {}), /missing, stale/);
});

test('goal conflict preserves an already-committed applied change', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f, 'orchestrator', { paths: ['README.md'] });
  fs.appendFileSync(path.join(f.root, f.project, 'README.md'), 'Applied and committed.\n');
  commit(f.root, 'apply: fixture change');
  f.harness.transaction((s) => {
    const c = s.projects[f.project].change;
    c.operations = 1;
    c.commits = ['fixture-apply'];
  });
  const conflict = f.harness.command('orchestrator', 'goal-conflict', { reason: 'Built-in /goal was used.' });
  assert.equal(conflict.nextStep.action, 'preserve');
  const preserved = f.harness.command('orchestrator', 'preserve', { reason: 'Preserve applied work.' });
  assert.equal(preserved.nextStep.action, 'checkpoint');
  const checkpointed = f.harness.command('orchestrator', 'checkpoint');
  assert.equal(checkpointed.change, null);
  assert.equal(checkpointed.nextStep.action, 'reregister');
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
  assert.equal(after.nextStep.phase, 'goal-blender');
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

test('review writes the round index before auto-commit', (t) => {
  const f = useFixture(t, { review: 'All' });
  activate(f);
  begin(f);
  const reviewed = reviewAll(f);
  const index = read(f.root, `${f.project}/Documents/Reviews/README.md`);
  assert.match(index, new RegExp(`\\| ${reviewed.round} \\| 20261031T110000Z \\| [a-f0-9]{12} \\| All final \\| visual \\| PASS \\|`));
  assert.match(index, new RegExp(`\\[${reviewed.round}/REVIEW\\.md\\]`));
  assert.doesNotMatch(index, /\| — \| — \|/);
  assert.equal(git(f.root, ['status', '--porcelain']).trim(), '');
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
  assert.equal(paused.nextStep.phase, 'goal-blender');
  assert.match(paused.nextStep.command, /goal_blender \{action:"resume"\}/);
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
  assert.match(read(f.root, `${f.project}/Documents/TASKSTRACKER.md`), /^Status: Complete$/m);
  assert.equal(git(f.root, ['status', '--porcelain']).trim(), '');
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
  gate(() => f.harness.issue('orchestrator', 'apply', { index: 4 }), /WIP.*third apply|third apply.*WIP/i);
  const wipPath = `${f.project}/renders/wip/WIP-third.png`;
  write(f.root, wipPath, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const wip = issueAndConsume(f, 'orchestrator', 'wip');
  f.harness.finish(wip.token, { ok: true, renderPath: wipPath });
  assert.equal(f.harness.command('orchestrator', 'status').nextStep.phase, 'wip-inspect');
  gate(() => f.harness.issue('orchestrator', 'apply', { index: 4 }), /WIP.*third apply|third apply.*WIP/i);
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
  assert.equal(paused.nextStep.phase, 'goal-blender');
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
  assert.equal(reclaimed.goalMeta.autoTurns, 0);
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

test('external binary policy requires explicit redistribution clearance', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kilo-binary-policy-'));
  t.after(() => fs.rmSync(root, { force: true, recursive: true }));
  const project = 'Blender/Policy';
  const asset = `${project}/assets/external/vendor/model.glb`;
  const source = `${project}/assets/external/vendor/SOURCE.md`;
  write(root, asset, GLB);
  write(root, source, '- Redistribution allowed: no\n');
  assert.throws(() => externalBinaryPolicy(root, project, [asset]), /not cleared for commit/);
  write(root, source, '- Redistribution allowed: yes\n');
  assert.doesNotThrow(() => externalBinaryPolicy(root, project, [asset]));
  assert.doesNotThrow(() => externalBinaryPolicy(root, project, [source]));
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
  const file = path.join(f.root, '.kilo', 'blender-project-harness', 'config.json');
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
  simulationAssetCheck(f);
  const sealed = seal(f, 'orchestrator', { round: 'R01-20261102T120000Z' });
  const manifest = JSON.parse(read(f.root, sealed.manifestPath));
  assert.equal(manifest.asset_check.strict, true);
  assert.deepEqual(manifest.asset_check.packed, ['fixture.png']);
  const facts = JSON.parse(read(f.root, sealed.factsPath));
  assert.deepEqual(facts.objects[0].dimensions, [2, 2, 2]);
  assert.equal(facts.objects[0].mesh.non_manifold_edges, 0);
  const visual = simulationGrader(f, 'visual', 'PASS');
  assert.match(visual.ticket.prompt, new RegExp(`saved scene SHA-256 ${visual.ticket.sceneHash}`));
  assert.match(visual.ticket.prompt, new RegExp(`Evidence key: ${visual.ticket.evidenceKey}`));
  simulationGrader(f, 'technical', 'PASS');
  simulationGrader(f, 'spec', 'PASS');
  const reviewed = simulationReview(f, 'All three graders passed the final room.');
  assert.equal(reviewed.change.verdict, 'PASS');
  f.harness.command('orchestrator', 'checkpoint');
  f.harness.command('orchestrator', 'goal-complete');
  assert.equal(f.harness.command('orchestrator', 'status').complete, true);
});

test('synthetic grader reads project reference documents', (t) => {
  const f = useFixture(t, { review: 'Single' });
  activate(f);
  begin(f);
  simulationApply(f, 0);
  seal(f);
  const ticket = f.harness.command('orchestrator', 'grader-ticket', { name: 'visual' });
  const child = 'child-reference';
  f.harness.bindGrader('orchestrator', child, `Review assignment ${ticket.marker}`, {
    providerID: 'fixture-provider', modelID: 'fixture-model', variant: 'fixture-variant',
  });
  const document = f.harness.documentRead(child, {
    project: f.project,
    path: 'Documents/References/SCENE-HEALTH.md',
  });
  assert.equal(document.path, 'Documents/References/SCENE-HEALTH.md');
  assert.match(document.title, /Scene Health/);
  write(f.root, ticket.report, simulationReport(ticket, 'PASS'));
  f.harness.collectGrader('orchestrator', child);
  const reviewed = simulationReview(f, 'The grader read the project reference evidence.');
  assert.equal(reviewed.change.verdict, 'PASS');
  f.harness.command('orchestrator', 'checkpoint');
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

test('source-only scripts are allowed only under scripts', (t) => {
  const allowed = useFixture(t);
  activate(allowed);
  begin(allowed, 'orchestrator', { paths: ['scripts/build.py'] });
  assert.equal(allowed.harness.command('orchestrator', 'status').change.documentOnly, true);
  write(allowed.root, `${allowed.project}/scripts/build.py`, 'print("hello")\n');
  allowed.harness.command('orchestrator', 'commit', { message: 'docs: add source-only script' });
  allowed.harness.command('orchestrator', 'checkpoint');
  const denied = useFixture(t);
  activate(denied);
  assert.throws(() => begin(denied, 'orchestrator', { paths: ['build.py'] }), /executable files/);
});

test('intake can scan a supplied file before registration', (t) => {
  const f = useFixture(t);
  const sourceRoot = path.join(path.dirname(f.root), 'pre-registration-intake');
  fs.mkdirSync(sourceRoot, { recursive: true });
  t.after(() => fs.rmSync(sourceRoot, { force: true, recursive: true }));
  const reference = path.join(sourceRoot, 'reference.png');
  fs.writeFileSync(reference, PNG_1X1);
  const scan = f.harness.intake('orchestrator', { project: f.project, files: [reference], scan: true, generated: { tool: 'media-mcp', model: 'image-model', prompt: 'mood' } });
  assert.equal(scan.scan, true);
  assert.equal(scan.entries.length, 1);
  assert.match(scan.next, /Register/);
});

test('intake copies references and external assets into the open change', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  const sourceRoot = path.join(path.dirname(f.root), 'intake-source');
  fs.mkdirSync(sourceRoot, { recursive: true });
  t.after(() => fs.rmSync(sourceRoot, { force: true, recursive: true }));
  const reference = path.join(sourceRoot, 'mood board.png');
  const model = path.join(sourceRoot, 'chair.glb');
  fs.writeFileSync(reference, PNG_1X1);
  fs.writeFileSync(model, GLB);

  const queued = f.harness.intake('orchestrator', {
    project: f.project,
    files: [reference],
    generated: { tool: 'media-mcp', model: 'image-model', prompt: 'warm desk', seed: '7' },
  });
  assert.equal(queued.copied.length, 1);
  assert.match(queued.copied[0].stored, /^Documents\/References\/mood-board-[a-f0-9]{8}\.png$/);
  assert.ok(fs.existsSync(path.join(f.root, f.project, queued.copied[0].stored)));
  assert.match(fs.readFileSync(path.join(f.root, f.project, 'Documents', 'References', 'README.md'), 'utf8'), /mood-board/);
  assert.match(fs.readFileSync(path.join(f.root, f.project, 'Documents', 'INTAKE.md'), 'utf8'), /mood-board/);

  const asset = f.harness.intake('orchestrator', {
    project: f.project,
    files: [model],
    kind: 'model',
    source: { external: true, name: 'Desk chair', vendor: 'Example', author: 'Example', license: 'CC0-1.0', licenseText: 'CC0 text' },
  });
  assert.equal(asset.copied.length, 1);
  assert.equal(asset.copied[0].stored, 'assets/external/Example/Desk-chair/chair.glb');
  const directory = path.join(f.root, f.project, 'assets', 'external', 'Example', 'Desk-chair');
  assert.equal(fs.readFileSync(path.join(directory, 'LICENSE.txt'), 'utf8'), 'CC0 text');
  assert.match(fs.readFileSync(path.join(directory, 'SOURCE.md'), 'utf8'), /Desk chair/);
  assert.match(fs.readFileSync(path.join(f.root, f.project, 'Documents', 'ASSETS.md'), 'utf8'), /Desk-chair/);

  const scan = f.harness.intake('orchestrator', { project: f.project, files: [reference], scan: true });
  assert.equal(scan.scan, true);
  assert.equal(scan.copied, undefined);
  assert.equal(scan.entries.length, 1);
  const status = f.harness.command('orchestrator', 'status');
  const change = status.change;
  assert.ok(change.paths.includes(`${f.project}/${queued.copied[0].stored}`));
  assert.ok(change.paths.includes(`${f.project}/Documents/INTAKE.md`));
  assert.equal(status.intake.copied, 1);
  assert.ok(status.intake.paths.includes(asset.copied[0].stored));
});

test('reference-only intake closes as a non-scene change', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f, 'orchestrator', { paths: ['Documents/INTAKE.md'], final: false });
  const sourceRoot = path.join(path.dirname(f.root), 'reference-only-intake');
  fs.mkdirSync(sourceRoot, { recursive: true });
  t.after(() => fs.rmSync(sourceRoot, { force: true, recursive: true }));
  const reference = path.join(sourceRoot, 'mood.png');
  fs.writeFileSync(reference, PNG_1X1);
  f.harness.intake('orchestrator', { project: f.project, files: [reference], generated: { tool: 'media-mcp', model: 'image-model', prompt: 'mood' } });
  const change = f.harness.command('orchestrator', 'status').change;
  assert.equal(change.documentOnly, false);
  assert.equal(change.nonSceneOnly, true);
  f.harness.command('orchestrator', 'commit', { message: 'assets: add reference intake' });
  f.harness.command('orchestrator', 'checkpoint');
  assert.equal(f.harness.transaction((s) => s.projects[f.project].history.at(-1).verdict), 'DOCUMENT');
});

test('only strict check_assets satisfies the asset receipt', (t) => {
  const strict = useFixture(t);
  activate(strict);
  begin(strict, 'orchestrator', { final: false });
  const strictIssue = issueAndConsume(strict, 'orchestrator', 'apply', { operation: 'check_assets', strict: true });
  strict.harness.finish(strictIssue.token, { ok: true, completed: 1, operationResults: [{ index: 1, operation: 'check_assets', ok: true }] });
  assert.equal(strict.harness.transaction((s) => s.projects[strict.project].change.assetChecked), true);
  const loose = useFixture(t);
  activate(loose);
  begin(loose, 'orchestrator', { final: false });
  const looseIssue = issueAndConsume(loose, 'orchestrator', 'apply', { operation: 'check_assets' });
  loose.harness.finish(looseIssue.token, { ok: true, completed: 1, operationResults: [{ index: 1, operation: 'check_assets', ok: true }] });
  assert.equal(loose.harness.transaction((s) => s.projects[loose.project].change.assetChecked), undefined);
});

test('completion requires check_assets after an asset operation', (t) => {
  const f = useFixture(t);
  activate(f);
  begin(f);
  const issued = issueAndConsume(f, 'orchestrator', 'apply', { operation: 'import_asset', name: 'Desk', path: 'assets/models/desk.glb' });
  f.harness.finish(issued.token, { ok: true, completed: 1, operationResults: [{ index: 1, operation: 'import_asset', ok: true }] });
  seal(f);
  selfReview(f);
  scopedCommit(f);
  f.harness.command('orchestrator', 'checkpoint');
  assert.throws(() => f.harness.command('orchestrator', 'goal-complete'), /check_assets/);
});
