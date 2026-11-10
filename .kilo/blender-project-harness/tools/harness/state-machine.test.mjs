import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PHASE_TO_WORKFLOW,
  STATE_MACHINE_CATALOG,
  STATE_MACHINES,
  WORKFLOW_STATES,
  WORKFLOW_TRANSITIONS,
  allowedTransitions,
  canTransition,
  isKnownState,
  isTerminalState,
  reviewAssignmentState,
} from './state-machine.mjs';

const knownPhases = [
  'unregistered', 'scaffold', 'registration', 'registration-pending',
  'prepare', 'goal-document', 'bootstrap-document', 'bootstrap-commit', 'reregister',
  'reregister-document', 'reregister-commit', 'reregister-prepare', 'escalate',
  'bootstrap-save', 'bootstrap-checkpoint', 'goal-blender', 'wait', 'begin', 'revision-begin',
  'reference-scan', 'reference-intake', 'media-request', 'media-generate', 'media-record',
  'media-intake', 'apply', 'wip', 'wip-inspect', 'seal', 'inspect', 'review',
  'save', 'grader-ticket', 'self-review', 'retry-grader', 'approval', 'commit', 'checkpoint',
  'abandon', 'recover', 'preserve', 'goal-conflict', 'complete', 'owned',
];

test('every machine declares states, transitions, and terminal reachability', () => {
  for (const [name, machine] of Object.entries(STATE_MACHINES)) {
    assert.ok(machine.states.includes(machine.initial), `${name} initial state is declared`);
    assert.ok(machine.transitions && typeof machine.transitions === 'object', `${name} has transitions`);
    if (machine.kind === 'phase') continue;
    for (const state of machine.states) {
      assert.ok(Array.isArray(machine.transitions[state]), `${name}.${state} has a transition list`);
      for (const target of machine.transitions[state]) {
        assert.ok(machine.states.includes(target), `${name}.${state} targets a known state`);
      }
    }
  }
});

test('catalog includes the coarse workflow and all declared targets', () => {
  assert.equal(STATE_MACHINE_CATALOG.version, 1);
  assert.ok(STATE_MACHINE_CATALOG.machines.workflow);
  assert.deepEqual(STATE_MACHINE_CATALOG.machines.workflow.states, Object.keys(WORKFLOW_STATES));
  assert.deepEqual(STATE_MACHINE_CATALOG.machines.workflow.transitions, WORKFLOW_TRANSITIONS);
  assert.equal(isKnownState('workflow', 'ready'), true);
  assert.equal(canTransition('workflow', 'ready', 'applying'), true);
  for (const [name, machine] of Object.entries(STATE_MACHINE_CATALOG.machines)) {
    assert.ok(machine.states.includes(machine.initial), `${name} catalog initial is declared`);
    for (const [state, targets] of Object.entries(machine.transitions)) {
      assert.ok(machine.states.includes(state), `${name} catalog transition source ${state} is declared`);
      for (const target of targets) assert.ok(machine.states.includes(target), `${name} catalog target ${target} is declared`);
    }
  }
});

test('catalog classifies non-machine observations', () => {
  const names = Object.keys(STATE_MACHINE_CATALOG.observations);
  for (const name of names) {
    const observation = STATE_MACHINE_CATALOG.observations[name];
    assert.equal(STATE_MACHINE_CATALOG.machines[name], undefined, `${name} is not both a machine and an observation`);
    assert.ok(['one-shot', 'process', 'connection', 'config', 'external', 'outcome', 'document', 'fact', 'ephemeral'].includes(observation.authority), `${name} has a known authority`);
    assert.ok(Array.isArray(observation.fields) && observation.fields.length > 0, `${name} declares observed fields`);
    assert.ok(typeof observation.note === 'string' && observation.note.length > 0, `${name} explains why it is not a machine`);
  }
  assert.ok(names.includes('installer'));
  assert.ok(names.includes('mcpProxy'));
  assert.ok(names.includes('agentManager'));
  assert.ok(names.includes('autoContinuation'));
});

test('ticket and task transitions match the harness lifecycle', () => {
  assert.equal(canTransition('ticket', 'issued', 'authorized'), true);
  assert.equal(canTransition('ticket', 'authorized', 'running'), true);
  assert.equal(canTransition('ticket', 'running', 'done'), true);
  assert.equal(canTransition('ticket', 'done', 'failed'), false);
  assert.equal(canTransition('task', 'issued', 'done'), true);
  assert.equal(canTransition('task', 'running', 'cancelled'), true);
  assert.equal(canTransition('task', 'done', 'failed'), false);
  assert.equal(isTerminalState('task', 'cancelled'), true);
});

test('media and reference intake transitions cover retry and completion', () => {
  assert.equal(canTransition('media', 'requested', 'generating'), true);
  assert.equal(canTransition('media', 'generated', 'intaken'), true);
  assert.equal(canTransition('media', 'generated', 'requested'), true);
  assert.equal(canTransition('media', 'intaken', 'committed'), true);
  assert.equal(canTransition('media', 'failed', 'requested'), false);
  assert.equal(canTransition('referenceIntake', 'none', 'pending'), true);
  assert.equal(canTransition('referenceIntake', 'pending', 'complete'), true);
  assert.equal(canTransition('referenceIntake', 'complete', 'pending'), true);
});

test('workflow phases map to known coarse states', () => {
  for (const phase of knownPhases) {
    assert.ok(PHASE_TO_WORKFLOW[phase], `phase ${phase} has a workflow state`);
    assert.ok(WORKFLOW_STATES[PHASE_TO_WORKFLOW[phase]], `phase ${phase} maps to a declared workflow state`);
  }
  for (const [state, targets] of Object.entries(WORKFLOW_TRANSITIONS)) {
    assert.ok(WORKFLOW_STATES[state], `workflow state ${state} is declared`);
    for (const target of targets) assert.ok(WORKFLOW_STATES[target], `${state} targets a declared workflow state`);
  }
});

test('review assignment states are derived from assignment evidence', () => {
  assert.equal(reviewAssignmentState({}), null);
  assert.equal(reviewAssignmentState({ token: 'token', report: 'REPORT.md' }), 'dispatched');
  assert.equal(reviewAssignmentState({ token: 'token', child: 'ses_child' }), 'running');
  assert.equal(reviewAssignmentState({ token: 'token', verdict: 'PASS' }), 'verdict');
  assert.equal(reviewAssignmentState({ token: 'token', cancelled: true }), 'cancelled');
  assert.equal(reviewAssignmentState({ token: 'token', error: 'failed' }), 'failed');
  assert.equal(reviewAssignmentState({ token: 'token', child: 'ses_child', timedOut: 'now' }), 'failed');
});

test('task recovery and review retry transitions are explicit', () => {
  assert.equal(canTransition('taskRecovery', 'failed', 'done'), true);
  assert.equal(isTerminalState('task', 'failed'), true);
  assert.equal(canTransition('review', 'aggregated', 'collecting'), true);
  assert.equal(isTerminalState('change', 'open'), false);
});

test('unknown states and transitions are rejected', () => {
  assert.equal(isKnownState('ticket', 'expired'), false);
  assert.equal(canTransition('ticket', 'toString', 'done'), false);
  assert.deepEqual(allowedTransitions('ticket', 'constructor'), []);
  const before = allowedTransitions('ticket', 'issued');
  before.push('made-up');
  assert.deepEqual(allowedTransitions('ticket', 'issued'), ['authorized', 'released', 'abandoned']);
});
