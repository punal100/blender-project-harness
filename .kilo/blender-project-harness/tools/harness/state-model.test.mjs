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

test('workflow state maps the authoritative phase and owner', () => {
  const p = project(change({ saved: true }));
  const state = deriveState(p, null, { phase: 'apply', actor: 'blender-worker', action: 'ticket', reason: 'Apply the next batch.' });
  assert.equal(state.workflow.state, 'applying');
  assert.equal(state.workflow.phase, 'apply');
  assert.equal(state.workflow.owner, 'blender-worker');
  assert.equal(state.workflow.action, 'ticket');
  assert.equal(state.workflow.reason, 'Apply the next batch.');
  assert.equal(state.entities.change.phase, 'apply');
  assert.deepEqual(state.workflow.allowed, ['wip', 'sealing', 'saving', 'recovery', 'paused', 'conflict']);
});

test('entity snapshots expose machine states and transitions', () => {
  const p = project(change({ pending: 'token-1', saved: true }), {
    tasks: [task('issued')],
    media: { requests: [{ id: 'm1', status: 'generated' }] },
    referenceIntake: { status: 'pending' },
    assetUse: true,
    exports: [{ path: 'exports/scene.glb', sha256: 'abc' }],
    worker: { child: 'ses_worker', turns: 2, maxTurns: 10 },
    waits: [{ kind: 'process', dueAt: new Date(Date.now() + 60_000).toISOString() }],
  });
  const state = deriveState(p, { tickets: { 'token-1': { state: 'issued', operation: 'apply' } } });
  assert.equal(state.entities.ticket.state, 'issued');
  assert.deepEqual(state.entities.ticket.allowed, ['authorized', 'released', 'abandoned']);
  assert.equal(state.entities.task.state, 'issued');
  assert.equal(state.entities.worker.state, 'active');
  assert.equal(state.entities.media.state, 'generated');
  assert.equal(state.entities.referenceIntake.state, 'pending');
  assert.equal(state.entities.assetCheck.state, 'required');
  assert.equal(state.entities.export.state, 'recorded');
  assert.equal(state.entities.wait.state, 'active');
});

test('intake projection exposes scanned, copied, and none states', () => {
  assert.equal(deriveState(project(null, { referenceIntake: { status: 'pending' } })).entities.intake.state, 'scanned');
  assert.equal(deriveState(project(null, { intake: { copied: 1 } })).entities.intake.state, 'copied');
  assert.equal(deriveState(project(null, { referenceIntake: { status: 'complete' } })).entities.intake.state, 'copied');
  assert.equal(deriveState(project()).entities.intake.state, 'none');
});

test('paused and reregistering projects report project state before phase', () => {
  const paused = project(change({ saved: true }), { goalActive: false, paused: { at: '2026-01-01', reason: 'manual' } });
  assert.equal(deriveState(paused, null, { phase: 'goal-blender', actor: 'orchestrator' }).workflow.state, 'paused');
  const reregistering = project(null, { goalActive: false, reregistering: { requested: 1, reason: 'records changed' } });
  assert.equal(deriveState(reregistering).workflow.state, 'registration');
});

test('bootstrap save phases stay in the bootstrap workflow', () => {
  const p = project(change({ bootstrap: true, saved: false }));
  assert.equal(deriveState(p, null, { phase: 'save', actor: 'orchestrator' }).workflow.state, 'bootstrap');
  assert.equal(deriveState(p, null, { phase: 'bootstrap-commit', actor: 'orchestrator' }).workflow.state, 'bootstrap');
});

test('asset and export projections validate the current scene and receipts', () => {
  const p = project(change({ saved: true, sealed: true, sceneHash: 'current' }), {
    assetUse: true,
    assetCheck: { sceneHash: 'current' },
    history: [{ sceneHash: 'previous' }],
    exports: [{ path: 'exports/scene.glb', sha256: 'abc' }],
  });
  assert.equal(deriveState(p).entities.assetCheck.state, 'checked');
  assert.equal(deriveState(p, null, null, { exportStatus: () => 'missing' }).entities.export.state, 'missing');
  assert.equal(deriveState(p, null, null, { exportStatus: () => 'changed' }).entities.export.state, 'changed');
});

test('a null project is unregistered rather than challenge-pending', () => {
  assert.equal(deriveState(null).project.registration, 'unregistered');
  assert.equal(deriveState(null).entities.registration.state, 'unregistered');
  assert.equal(deriveState(null).workflow.state, 'unregistered');
});

test('unknown persisted states are reported as invariant violations', () => {
  const p = project(change({ pending: 't', saved: true }), {
    tasks: [task('mystery')],
    media: { requests: [{ id: 'm1', status: 'mystery' }] },
    referenceIntake: { status: 'mystery' },
  });
  const state = deriveState(p, { tickets: { t: { state: 'mystery', operation: 'apply' } } });
  assert.equal(state.invariants.valid, false);
  assert.match(state.invariants.violations.join(' '), /unknown state/);
});
