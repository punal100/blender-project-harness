const validDate = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value));
const APPLY_BUDGET = 20;
const activeWaits = (project) => (project?.waits ?? []).filter((wait) => !validDate(wait.dueAt) || Date.parse(wait.dueAt) > Date.now());
const latestOperationTask = (project, change) => {
  const tasks = project?.tasks ?? [];
  for (let index = tasks.length - 1; index >= 0; index -= 1) {
    const task = tasks[index];
    if (task.kind === 'operation' && task.change === change?.id) return task;
  }
  return undefined;
};

function projectState(project, state) {
  const waiting = activeWaits(project).length > 0;
  return {
    registration: project?.reregistering ? 'reregistering' : state?.challenge?.project === project?.project ? 'challenge-pending' : 'registered',
    lifecycle: project?.goalConflict ? 'goal-conflict' : project?.complete ? 'complete' : project?.paused ? 'paused' : project?.goalActive ? 'active' : 'inactive',
    mission: project?.goalConflict ? 'conflict' : project?.complete ? 'complete' : project?.paused ? 'paused' : waiting ? 'waiting' : project?.goalActive ? 'active' : 'inactive',
  };
}

function wipGates(change) {
  const operations = change?.operations ?? 0;
  const renderCurrent = operations > 0 && change?.wipRender?.operations === operations;
  const lookCurrent = renderCurrent && change?.wipLook?.operations === operations;
  const everyThird = operations > 0 && operations % 3 === 0;
  return {
    renderCurrent,
    lookCurrent,
    due: operations > 0 && (everyThird || Boolean(change?.readyToSeal)) && (!renderCurrent || !lookCurrent),
    wipDue: everyThird && !renderCurrent,
    lookDue: everyThird && renderCurrent && !lookCurrent,
  };
}

function changePhase(project, change, step = null) {
  if (!change) return 'none';
  if (typeof step?.phase === 'string') return step.phase;
  if (change.bootstrap && !change.saved) return 'bootstrap';
  if (change.pending) return 'pending';
  if (change.wip) return 'checkpoint';
  if (change.sealed) {
    if (!change.inspected) return 'sealed';
    if (!change.verdict) return 'reviewing';
    if (change.verdict === 'BLOCKED') return 'blocked';
    if (project?.records?.workflow === 'Partially Autonomous' && !change.approval) return 'approval';
    return 'commit';
  }
  if (change.bootstrap && change.saved) return 'bootstrap-commit';
  if (change.failure || Date.now() > change.deadline) {
    if (change.operations >= APPLY_BUDGET) return 'wip';
    if (change.operations === 0 && !change.failure && !change.pending) return 'abandon';
    return 'recovery';
  }
  if ((change.documentOnly || change.nonSceneOnly) && change.operations === 0) return 'commit';
  const gates = wipGates(change);
  if (gates.due) return gates.renderCurrent ? 'wip-inspect' : 'wip';
  if (change.readyToSeal) return 'ready-to-seal';
  return 'open';
}

function changeState(project, change, step = null) {
  if (!change) return null;
  const gates = wipGates(change);
  const expired = !change.sealed && !change.wip && Date.now() > change.deadline;
  return {
    phase: changePhase(project, change, step),
    outcome: change.final ? 'final' : 'milestone',
    mode: change.documentOnly ? 'document' : change.nonSceneOnly ? 'non-scene' : 'scene',
    exception: change.failure ? 'failed' : change.preserved ? 'preserved' : change.reopen ? 'reopened' : change.wip ? 'wip' : expired ? 'expired' : null,
    wipDue: gates.wipDue,
    wipLookDue: gates.lookDue,
    pending: Boolean(change.pending),
    sealed: Boolean(change.sealed),
    inspected: Boolean(change.inspected),
    operations: change.operations ?? 0,
    round: change.round ?? null,
  };
}

function reviewState(project, change) {
  if (!change) return null;
  const graders = Object.values(change.graders ?? {});
  return {
    phase: !change.sealed ? 'not-started' : !change.inspected ? 'evidence' : change.verdict ? 'aggregated' : 'collecting',
    scope: change.final ? 'final' : 'milestone',
    verdict: change.verdict ?? null,
    blockingKind: change.blockingKind ?? null,
    approval: Boolean(change.approval),
    configured: project?.records?.roster?.length ?? 0,
    dispatched: graders.filter((grader) => Boolean(grader.token || grader.report)).length,
    reported: graders.filter((grader) => Boolean(grader.verdict)).length,
  };
}

function executionState(project, state, change, pendingTask) {
  const token = change?.pending ?? null;
  const ticket = token ? state?.tickets?.[token] : null;
  const task = token ? pendingTask : null;
  return {
    ticket: ticket ? { state: ticket.state, operation: ticket.operation, created: ticket.created ?? null, started: ticket.started ?? null } : null,
    task: task ? { id: task.id, state: task.state, child: task.child ?? null, commitPending: Boolean(task.commitPending), workerTurns: task.workerTurns ?? null } : null,
    worker: project?.worker ? { child: project.worker.child, turns: project.worker.turns ?? 0, maxTurns: project.worker.maxTurns ?? 10 } : null,
    workerRetired: project?.workerRetired ? { child: project.workerRetired.child, reason: project.workerRetired.reason, at: project.workerRetired.retiredAt } : null,
  };
}

function blockers(project, state, change) {
  const result = [];
  if (project?.referenceIntake?.status === 'pending') result.push({ kind: 'reference-intake', state: 'pending', retryable: false });
  const openMedia = (project?.media?.requests ?? []).find((request) => ['requested', 'generating', 'generated'].includes(request.status));
  if (openMedia) result.push({ kind: 'media', state: openMedia.status, id: openMedia.id, retryable: false });
  if (activeWaits(project).length) result.push({ kind: 'wait', state: 'active', retryable: false });
  if (!change) return result;
  const token = change.pending;
  if (token) {
    const ticket = state?.tickets?.[token];
    const task = (project?.tasks ?? []).find((item) => item.token === token);
    if (!ticket || ticket.state === 'released') result.push({ kind: 'ticket', state: ticket?.state ?? 'missing', retryable: Boolean(!ticket || ticket.state === 'released') });
    if (!task) result.push({ kind: 'task', state: 'missing', retryable: true });
  }
  if (change.sealed && !change.inspected) result.push({ kind: 'render-inspection', state: 'required', retryable: false });
  if (change.verdict === 'BLOCKED') result.push({ kind: 'review', state: 'blocked', retryable: change.blockingKind === 'tooling' });
  if (!change.sealed && !change.wip && (change.failure || Date.now() > change.deadline)) result.push({ kind: 'change', state: change.failure ? 'failed' : 'expired', retryable: true });
  const gates = wipGates(change);
  if (!change.sealed && gates.due) result.push({ kind: 'wip', state: gates.renderCurrent ? 'look' : 'render', retryable: false });
  return result;
}

function violations(project, state, change, pendingTask) {
  const result = [];
  if (project?.complete && change) result.push('complete project still has an open change');
  if (project?.worker && (project.worker.turns ?? 0) > (project.worker.maxTurns ?? 10)) result.push('worker turn count exceeds its limit');
  if (!change) return result;
  const token = change.pending;
  if (token) {
    const ticket = state?.tickets?.[token];
    const task = pendingTask;
    if (!ticket) result.push('pending change has no ticket');
    if (!task) result.push('pending change has no task record');
    if (ticket && task) {
      const allowed = {
        issued: ['issued', 'running'],
        authorized: ['issued', 'running'],
        running: ['issued', 'running', 'failed', 'cancelled'],
        done: ['done'],
        failed: ['failed', 'cancelled'],
        released: ['failed', 'abandoned', 'cancelled'],
        abandoned: ['abandoned', 'cancelled'],
      }[ticket.state] ?? [];
      if (!allowed.includes(task.state)) result.push(`ticket ${ticket.state} and task ${task.state} disagree`);
    }
  }
  if (change.sealed && !change.saved) result.push('sealed change is not marked saved');
  if (change.verdict && !['WIP', 'BOOTSTRAP', 'DOCUMENT'].includes(change.verdict) && !change.inspected) result.push('change has a verdict before render inspection');
  if (change.approval && !change.verdict) result.push('change has approval before a verdict');
  return result;
}

export function deriveState(project, state = null, step = null) {
  const change = project?.change ?? null;
  const pendingTask = change?.pending ? (project?.tasks ?? []).find((item) => item.token === change.pending) : null;
  const problems = violations(project, state, change, pendingTask);
  return {
    version: 1,
    project: projectState(project, state),
    change: changeState(project, change, step),
    review: reviewState(project, change),
    execution: executionState(project, state, change, pendingTask),
    blockers: blockers(project, state, change),
    invariants: { valid: problems.length === 0, violations: problems },
    latestOperationTask: latestOperationTask(project, change)?.id ?? null,
  };
}
