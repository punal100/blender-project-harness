import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveState } from './state-model.mjs';

const project = (change = null, extra = {}) => ({
  project: 'Blender/Test',
  goalActive: true,
  records: { workflow: 'Fully Autonomous', review: 'All', roster: [{ name: 'visual' }] },
  waits: [],
  tasks: [],
  change,
  ...extra,
});
const change = (extra = {}) => ({
  id: 'change-1',
  deadline: Date.now() + 60_000,
  operations: 0,
  saved: false,
  sealed: false,
  inspected: false,
  final: false,
  ...extra,
});
const task = (state = 'issued') => ({
  id: 'T001',
  kind: 'operation',
  change: 'change-1',
  token: 'token-1',
  state,
});

test('idle project has no change and a clean invariant set', () => {
  const state = deriveState(project());
  assert.equal(state.project.lifecycle, 'active');
  assert.equal(state.change, null);
  assert.equal(state.invariants.valid, true);
});

test('bootstrap and pending phases are explicit', () => {
  assert.equal(deriveState(project(change({ bootstrap: true }))).change.phase, 'bootstrap');
  const state = deriveState(project(change({ pending: 'token-1', tasks: [] }), { tasks: [task()] }));
  assert.equal(state.change.phase, 'pending');
  assert.equal(state.execution.task.id, 'T001');
  assert.equal(state.invariants.valid, false);
});

test('ticket and task divergence is reported as an invariant violation', () => {
  const p = project(change({ pending: 'token-1' }), { tasks: [task('running')] });
  const state = deriveState(p, { tickets: { 'token-1': { state: 'done', operation: 'apply' } } });
  assert.equal(state.invariants.valid, false);
  assert.match(state.invariants.violations.join(' '), /ticket done and task running disagree/);
});

test('sealed evidence requires inspection before review', () => {
  const state = deriveState(project(change({ sealed: true, saved: true })));
  assert.equal(state.change.phase, 'sealed');
  assert.equal(state.review.phase, 'evidence');
  assert.ok(state.blockers.some((blocker) => blocker.kind === 'render-inspection'));
});

test('PASS under Partially Autonomous enters approval before commit', () => {
  const p = project(change({ sealed: true, saved: true, inspected: true, verdict: 'PASS' }));
  p.records.workflow = 'Partially Autonomous';
  const state = deriveState(p);
  assert.equal(state.change.phase, 'approval');
  assert.equal(state.review.phase, 'aggregated');
});

test('completed project with an open change is invalid', () => {
  const state = deriveState(project(change({ saved: true }), { complete: true }));
  assert.equal(state.invariants.valid, false);
  assert.match(state.invariants.violations.join(' '), /complete project still has an open change/);
});

test('reference, media and wait blockers are visible', () => {
  const p = project(change({ saved: true }), {
    referenceIntake: { status: 'pending' },
    media: { requests: [{ id: 'm1', status: 'generating' }] },
    waits: [{ kind: 'process', dueAt: new Date(Date.now() + 60_000).toISOString() }],
  });
  const state = deriveState(p);
  assert.deepEqual(state.blockers.map((blocker) => blocker.kind), ['reference-intake', 'media', 'wait']);
});

test('worker turn limit and final scope are projected', () => {
  const p = project(change({ final: true, saved: true }), {
    worker: { child: 'ses_worker', turns: 3, maxTurns: 10 },
  });
  const state = deriveState(p);
  assert.equal(state.change.outcome, 'final');
  assert.deepEqual(state.execution.worker, { child: 'ses_worker', turns: 3, maxTurns: 10 });
});
