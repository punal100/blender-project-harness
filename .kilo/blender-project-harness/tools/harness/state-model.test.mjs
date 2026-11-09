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

test('saved bootstrap and document-only changes expose their real commit phase', () => {
  assert.equal(deriveState(project(change({ bootstrap: true, saved: true }))).change.phase, 'bootstrap-commit');
  assert.equal(deriveState(project(change({ documentOnly: true, nonSceneOnly: true, saved: true }))).change.phase, 'commit');
});

test('WIP commits and WIP look gates are explicit', () => {
  assert.equal(deriveState(project(change({ wip: true, operations: 2, saved: true }))).change.phase, 'checkpoint');
  const ready = change({ operations: 3, readyToSeal: true, saved: true });
  assert.equal(deriveState(project(ready)).change.phase, 'wip');
  const rendered = { ...ready, wipRender: { operations: 3 } };
  assert.equal(deriveState(project(rendered)).change.phase, 'wip-inspect');
  const looked = { ...rendered, wipLook: { operations: 3 } };
  assert.equal(deriveState(project(looked)).change.phase, 'ready-to-seal');
  assert.equal(deriveState(project(change({ operations: 20, failure: true }))).change.phase, 'wip');
});

test('blocked and unapproved reviews are not projected as commit', () => {
  const blocked = deriveState(project(change({ sealed: true, saved: true, inspected: true, verdict: 'BLOCKED', blockingKind: 'tooling' })));
  assert.equal(blocked.change.phase, 'blocked');
  const p = project(change({ sealed: true, saved: true, inspected: true, verdict: 'CHANGES_REQUIRED' }));
  p.records.workflow = 'Partially Autonomous';
  assert.equal(deriveState(p).change.phase, 'approval');
});

test('intaken media and project-level blockers are handled without a change', () => {
  const p = project(null, {
    referenceIntake: { status: 'pending' },
    media: { requests: [{ id: 'm1', status: 'intaken' }, { id: 'm2', status: 'generated' }] },
    waits: [{ kind: 'process', dueAt: new Date(Date.now() + 60_000).toISOString() }],
  });
  const state = deriveState(p);
  assert.deepEqual(state.blockers.map((blocker) => blocker.kind), ['reference-intake', 'media', 'wait']);
  assert.equal(state.blockers.find((blocker) => blocker.kind === 'media').id, 'm2');
});

test('supported failure, cancellation, and WIP states satisfy invariants', () => {
  const runningProject = project(change({ pending: 't', saved: true }), {
    tasks: [{ id: 'T001', kind: 'operation', change: 'change-1', token: 't', state: 'issued' }],
  });
  const running = deriveState(runningProject, { tickets: { t: { state: 'running', operation: 'save' } } });
  assert.equal(running.invariants.valid, true);
  const p = project(change({ pending: 't', saved: true }), { tasks: [{ id: 'T001', kind: 'operation', change: 'change-1', token: 't', state: 'cancelled' }] });
  const cancelled = deriveState(p, { tickets: { t: { state: 'running', operation: 'save' } } });
  assert.equal(cancelled.invariants.valid, true);
  const wip = deriveState(project(change({ saved: true, verdict: 'WIP', inspected: false })));
  assert.equal(wip.invariants.valid, true);
});

test('review reported counts verdicts, not dispatched report paths', () => {
  const p = project(change({
    sealed: true,
    saved: true,
    inspected: true,
    graders: { visual: { report: 'Blender/Test/Documents/Reviews/R/visual/REPORT.md' } },
  }));
  const dispatched = deriveState(p).review;
  assert.equal(dispatched.dispatched, 1);
  assert.equal(dispatched.reported, 0);
  p.change.graders.visual.verdict = 'PASS';
  assert.equal(deriveState(p).review.reported, 1);
});
