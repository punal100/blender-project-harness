const validDate = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value));
const activeWaits = (project) => (project?.waits ?? []).filter((wait) => !validDate(wait.dueAt) || Date.parse(wait.dueAt) > Date.now());
const latestOperationTask = (project, change) => [...(project?.tasks ?? [])].reverse().find((task) => task.kind === 'operation' && task.change === change?.id);

function projectState(project, state) {
  const waiting = activeWaits(project).length > 0;
  return {
    registration: project?.reregistering ? 'reregistering' : state?.challenge?.project === project?.project ? 'challenge-pending' : 'registered',
    lifecycle: project?.goalConflict ? 'goal-conflict' : project?.complete ? 'complete' : project?.paused ? 'paused' : project?.goalActive ? 'active' : 'inactive',
    mission: project?.goalConflict ? 'conflict' : project?.complete ? 'complete' : project?.paused ? 'paused' : waiting ? 'waiting' : project?.goalActive ? 'active' : 'inactive',
  };
}

function changePhase(project, change) {
  if (!change) return 'none';
  if (change.bootstrap && !change.saved) return 'bootstrap';
  if (change.pending) return 'pending';
  if (change.failure || Date.now() > change.deadline) return 'recovery';
  if (change.wip) return 'recovery';
  if (change.sealed) {
    if (!change.inspected) return 'sealed';
    if (!change.verdict) return 'reviewing';
    if (project?.records?.workflow === 'Partially Autonomous' && change.verdict === 'PASS' && !change.approval) return 'approval';
    return 'commit';
  }
  if (change.readyToSeal) return 'ready-to-seal';
  const wipDue = change.operations > 0 && change.operations % 3 === 0 && change.wipRender?.operations !== change.operations;
  if (wipDue) return 'wip-due';
  return 'open';
}

function changeState(project, change) {
  if (!change) return null;
  const wipDue = change.operations > 0 && change.operations % 3 === 0 && change.wipRender?.operations !== change.operations;
  return {
    phase: changePhase(project, change),
    outcome: change.final ? 'final' : 'milestone',
    mode: change.documentOnly ? 'document' : change.nonSceneOnly ? 'non-scene' : 'scene',
    exception: change.failure ? 'failed' : change.preserved ? 'preserved' : change.reopen ? 'reopened' : change.wip ? 'wip' : Date.now() > change.deadline ? 'expired' : null,
    wipDue,
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
  const reported = graders.filter((grader) => Boolean(grader.report || grader.verdict)).length;
  return {
    phase: !change.sealed ? 'not-started' : !change.inspected ? 'evidence' : change.verdict ? 'aggregated' : 'collecting',
    scope: change.final ? 'final' : 'milestone',
    verdict: change.verdict ?? null,
    blockingKind: change.blockingKind ?? null,
    approval: Boolean(change.approval),
    configured: project?.records?.roster?.length ?? 0,
    reported,
  };
}

function executionState(project, state, change) {
  const token = change?.pending ?? null;
  const ticket = token ? state?.tickets?.[token] : null;
  const task = token ? (project?.tasks ?? []).find((item) => item.token === token) : null;
  return {
    ticket: ticket ? { state: ticket.state, operation: ticket.operation, created: ticket.created ?? null, started: ticket.started ?? null } : null,
    task: task ? { id: task.id, state: task.state, child: task.child ?? null, commitPending: Boolean(task.commitPending), workerTurns: task.workerTurns ?? null } : null,
    worker: project?.worker ? { child: project.worker.child, turns: project.worker.turns ?? 0, maxTurns: project.worker.maxTurns ?? 10 } : null,
    workerRetired: project?.workerRetired ? { child: project.workerRetired.child, reason: project.workerRetired.reason, at: project.workerRetired.retiredAt } : null,
  };
}

function blockers(project, state, change) {
  const result = [];
  if (!change) return result;
  const token = change.pending;
  if (token) {
    const ticket = state?.tickets?.[token];
    const task = (project?.tasks ?? []).find((item) => item.token === token);
    if (!ticket) result.push({ kind: 'ticket', state: 'missing', retryable: true });
    else if (ticket.state === 'released') result.push({ kind: 'ticket', state: 'released', retryable: true });
    else if (['issued', 'authorized', 'running'].includes(ticket.state)) result.push({ kind: 'ticket', state: ticket.state, retryable: false });
    if (!task) result.push({ kind: 'task', state: 'missing', retryable: true });
  }
  if (project?.referenceIntake?.status === 'pending') result.push({ kind: 'reference-intake', state: 'pending', retryable: false });
  const openMedia = (project?.media?.requests ?? []).find((request) => ['requested', 'generating', 'generated', 'intaken'].includes(request.status));
  if (openMedia) result.push({ kind: 'media', state: openMedia.status, id: openMedia.id, retryable: openMedia.status === 'failed' });
  if (change.sealed && !change.inspected) result.push({ kind: 'render-inspection', state: 'required', retryable: false });
  if (change.verdict === 'BLOCKED') result.push({ kind: 'review', state: 'blocked', retryable: change.blockingKind === 'tooling' });
  if (change.failure || Date.now() > change.deadline) result.push({ kind: 'change', state: change.failure ? 'failed' : 'expired', retryable: true });
  if (activeWaits(project).length) result.push({ kind: 'wait', state: 'active', retryable: false });
  return result;
}

function violations(project, state, change) {
  const result = [];
  if (project?.complete && change) result.push('complete project still has an open change');
  if (project?.worker && (project.worker.turns ?? 0) > (project.worker.maxTurns ?? 10)) result.push('worker turn count exceeds its limit');
  if (!change) return result;
  const token = change.pending;
  if (token) {
    const ticket = state?.tickets?.[token];
    const task = (project?.tasks ?? []).find((item) => item.token === token);
    if (!ticket) result.push('pending change has no ticket');
    if (!task) result.push('pending change has no task record');
    if (ticket && task) {
      const allowed = {
        issued: ['issued'],
        authorized: ['issued', 'running'],
        running: ['running'],
        done: ['done'],
        failed: ['failed'],
        released: ['failed', 'abandoned'],
        abandoned: ['abandoned'],
      }[ticket.state] ?? [];
      if (!allowed.includes(task.state)) result.push(`ticket ${ticket.state} and task ${task.state} disagree`);
    }
  }
  if (change.sealed && !change.saved) result.push('sealed change is not marked saved');
  if (change.verdict && !change.inspected) result.push('change has a verdict before render inspection');
  if (change.approval && !change.verdict) result.push('change has approval before a verdict');
  return result;
}

export function deriveState(project, state = null) {
  const change = project?.change ?? null;
  const review = reviewState(project, change);
  return {
    version: 1,
    project: projectState(project, state),
    change: changeState(project, change),
    review,
    execution: executionState(project, state, change),
    blockers: blockers(project, state, change),
    invariants: { valid: violations(project, state, change).length === 0, violations: violations(project, state, change) },
    latestOperationTask: latestOperationTask(project, change)?.id ?? null,
  };
}
