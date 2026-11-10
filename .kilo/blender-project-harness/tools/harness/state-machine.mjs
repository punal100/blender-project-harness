const STATE_MACHINE_DOMAIN = {
  registration: {
    initial: 'unregistered',
    states: ['unregistered', 'scaffold', 'registration-pending', 'registration', 'registered', 'reregistering', 'owned'],
    transitions: {
      unregistered: ['scaffold', 'registration', 'owned'],
      scaffold: ['registration', 'registration-pending', 'unregistered'],
      'registration-pending': ['registration', 'unregistered'],
      registration: ['registered', 'unregistered'],
      registered: ['reregistering'],
      reregistering: ['registration'],
      owned: [],
    },
  },
  mission: {
    initial: 'inactive',
    states: ['inactive', 'active', 'waiting', 'paused', 'complete', 'conflict', 'reregistering'],
    transitions: {
      inactive: ['active', 'conflict', 'reregistering'],
      active: ['waiting', 'paused', 'complete', 'conflict', 'reregistering'],
      waiting: ['active', 'paused', 'complete', 'conflict', 'reregistering'],
      paused: ['active', 'conflict', 'reregistering'],
      complete: ['reregistering'],
      conflict: ['reregistering'],
      reregistering: ['inactive', 'active'],
    },
  },
  ticket: {
    initial: 'issued',
    states: ['issued', 'authorized', 'running', 'done', 'failed', 'released', 'abandoned'],
    transitions: {
      issued: ['authorized', 'released', 'abandoned'],
      authorized: ['running', 'released', 'abandoned'],
      running: ['done', 'failed', 'abandoned'],
      done: [],
      failed: [],
      released: [],
      abandoned: [],
    },
  },
  task: {
    initial: 'issued',
    states: ['issued', 'running', 'done', 'failed', 'cancelled', 'abandoned'],
    transitions: {
      issued: ['running', 'done', 'failed', 'cancelled', 'abandoned'],
      running: ['done', 'failed', 'cancelled', 'abandoned'],
      done: [],
      failed: [],
      cancelled: [],
      abandoned: [],
    },
  },
  taskRecovery: {
    initial: 'failed',
    states: ['failed', 'done'],
    transitions: {
      failed: ['done'],
      done: [],
    },
  },
  worker: {
    initial: 'unbound',
    states: ['unbound', 'active', 'retired'],
    transitions: {
      unbound: ['active'],
      active: ['active', 'retired'],
      retired: ['active', 'retired'],
    },
  },
  media: {
    initial: 'none',
    states: ['none', 'requested', 'generating', 'generated', 'intaken', 'committed', 'failed'],
    transitions: {
      none: ['requested'],
      requested: ['requested', 'generating', 'generated', 'failed'],
      generating: ['generated', 'failed', 'requested'],
      generated: ['intaken', 'failed', 'requested'],
      intaken: ['committed', 'failed', 'requested'],
      committed: [],
      failed: [],
    },
  },
  referenceIntake: {
    initial: 'none',
    states: ['none', 'pending', 'complete'],
    transitions: {
      none: ['pending', 'complete'],
      pending: ['pending', 'complete'],
      complete: ['pending'],
    },
  },
  reviewAssignment: {
    initial: 'dispatched',
    states: ['dispatched', 'running', 'verdict', 'cancelled', 'failed'],
    transitions: {
      dispatched: ['running', 'verdict', 'cancelled', 'failed'],
      running: ['verdict', 'cancelled', 'failed'],
      verdict: ['dispatched'],
      cancelled: ['dispatched'],
      failed: ['dispatched'],
    },
  },
  review: {
    initial: 'not-started',
    states: ['not-started', 'evidence', 'collecting', 'aggregated'],
    transitions: {
      'not-started': ['evidence'],
      evidence: ['collecting'],
      collecting: ['aggregated'],
      aggregated: ['not-started', 'collecting'],
    },
  },
  wait: {
    initial: 'none',
    states: ['none', 'active', 'expired', 'removed'],
    transitions: {
      none: ['active'],
      active: ['expired', 'removed'],
      expired: ['removed'],
      removed: [],
    },
  },
  intake: {
    initial: 'none',
    states: ['none', 'scanned', 'copied', 'rejected'],
    transitions: {
      none: ['scanned', 'copied'],
      scanned: ['copied', 'scanned'],
      copied: ['copied', 'scanned'],
      rejected: ['scanned'],
    },
  },
  shellApproval: {
    initial: 'pending',
    states: ['pending', 'approved', 'expired', 'denied'],
    transitions: {
      pending: ['approved', 'expired', 'denied'],
      approved: [],
      expired: [],
      denied: [],
    },
  },
  assetCheck: {
    initial: 'not-required',
    states: ['not-required', 'required', 'checked', 'stale'],
    transitions: {
      'not-required': ['required', 'checked'],
      required: ['checked'],
      checked: ['required', 'stale'],
      stale: ['required', 'checked'],
    },
  },
  export: {
    initial: 'none',
    states: ['none', 'recorded', 'missing', 'changed'],
    transitions: {
      none: ['recorded'],
      recorded: ['recorded', 'missing', 'changed'],
      missing: ['recorded'],
      changed: ['recorded'],
    },
  },
  change: {
    kind: 'phase',
    initial: 'none',
    states: ['none', 'bootstrap', 'bootstrap-save', 'bootstrap-commit', 'bootstrap-checkpoint', 'open', 'apply', 'save', 'pending', 'wip', 'wip-inspect', 'ready-to-seal', 'seal', 'sealed', 'inspect', 'reviewing', 'blocked', 'approval', 'commit', 'checkpoint', 'recovery', 'abandon', 'preserve', 'complete', 'unregistered', 'scaffold', 'registration', 'registration-pending', 'prepare', 'reregister', 'reregister-document', 'reregister-commit', 'reregister-prepare', 'goal-document', 'bootstrap-document', 'escalate', 'goal-blender', 'wait', 'begin', 'revision-begin', 'reference-scan', 'reference-intake', 'media-request', 'media-generate', 'media-record', 'media-intake', 'grader-ticket', 'self-review', 'retry-grader', 'goal-conflict', 'owned'],
    transitions: {},
  },
};

export const WORKFLOW_STATES = Object.freeze({
  unregistered: { owner: 'orchestrator', terminal: false },
  scaffold: { owner: 'orchestrator', terminal: false },
  registration: { owner: 'orchestrator', terminal: false },
  mission: { owner: 'orchestrator', terminal: false },
  ready: { owner: 'orchestrator', terminal: false },
  waiting: { owner: 'none', terminal: false },
  'reference-intake': { owner: 'orchestrator', terminal: false },
  media: { owner: 'orchestrator', terminal: false },
  applying: { owner: 'blender-worker', terminal: false },
  saving: { owner: 'orchestrator', terminal: false },
  wip: { owner: 'orchestrator', terminal: false },
  'wip-inspect': { owner: 'orchestrator', terminal: false },
  sealing: { owner: 'orchestrator', terminal: false },
  inspecting: { owner: 'orchestrator', terminal: false },
  reviewing: { owner: 'orchestrator', terminal: false },
  'retrying-review': { owner: 'orchestrator', terminal: false },
  approving: { owner: 'human', terminal: false },
  committing: { owner: 'orchestrator', terminal: false },
  checkpointing: { owner: 'orchestrator', terminal: false },
  recovery: { owner: 'orchestrator', terminal: false },
  bootstrap: { owner: 'orchestrator', terminal: false },
  paused: { owner: 'human', terminal: false },
  conflict: { owner: 'human', terminal: true },
  complete: { owner: 'none', terminal: true },
  owned: { owner: 'other-session', terminal: true },
});

export const WORKFLOW_TRANSITIONS = Object.freeze({
  unregistered: ['scaffold', 'registration', 'owned'],
  scaffold: ['registration'],
  registration: ['mission', 'ready', 'unregistered', 'registration'],
  mission: ['ready', 'waiting', 'paused', 'conflict', 'complete', 'registration'],
  ready: ['applying', 'saving', 'media', 'reference-intake', 'waiting', 'checkpointing', 'paused', 'conflict', 'complete', 'registration'],
  waiting: ['ready', 'applying', 'mission', 'paused', 'conflict', 'complete'],
  'reference-intake': ['ready', 'applying', 'registration', 'media'],
  media: ['applying', 'reference-intake', 'ready', 'recovery'],
  applying: ['wip', 'sealing', 'saving', 'recovery', 'paused', 'conflict'],
  saving: ['ready', 'bootstrap', 'checkpointing', 'recovery', 'paused', 'conflict'],
  wip: ['wip-inspect', 'applying', 'sealing', 'checkpointing', 'recovery'],
  'wip-inspect': ['applying', 'sealing', 'recovery'],
  sealing: ['inspecting', 'recovery', 'paused', 'conflict'],
  inspecting: ['reviewing', 'recovery', 'paused', 'conflict'],
  reviewing: ['retrying-review', 'approving', 'committing', 'recovery', 'paused', 'conflict'],
  'retrying-review': ['reviewing', 'recovery', 'paused', 'conflict'],
  approving: ['committing', 'ready', 'recovery', 'paused'],
  committing: ['checkpointing', 'recovery'],
  checkpointing: ['ready', 'mission', 'complete', 'registration'],
  recovery: ['ready', 'registration', 'checkpointing', 'paused'],
  bootstrap: ['ready', 'saving', 'checkpointing'],
  paused: ['mission', 'ready', 'registration', 'conflict'],
  conflict: ['registration'],
  complete: ['registration'],
  owned: [],
});

export const STATE_MACHINES = Object.freeze({
  ...STATE_MACHINE_DOMAIN,
  workflow: Object.freeze({
    kind: 'workflow',
    initial: 'unregistered',
    states: Object.freeze(Object.keys(WORKFLOW_STATES)),
    transitions: WORKFLOW_TRANSITIONS,
    owners: Object.freeze(Object.fromEntries(Object.entries(WORKFLOW_STATES).map(([name, state]) => [name, state.owner]))),
  }),
});

export const STATE_MACHINE_CATALOG = Object.freeze({
  version: 1,
  machines: STATE_MACHINES,
});

export const PHASE_TO_WORKFLOW = Object.freeze({
  unregistered: 'unregistered',
  scaffold: 'scaffold',
  registration: 'registration',
  'registration-pending': 'registration',
  prepare: 'registration',
  'goal-document': 'registration',
  'bootstrap-document': 'registration',
  'bootstrap-commit': 'bootstrap',
  reregister: 'registration',
  'reregister-document': 'registration',
  'reregister-commit': 'registration',
  'reregister-prepare': 'registration',
  escalate: 'registration',
  'bootstrap-save': 'bootstrap',
  save: 'saving',
  'bootstrap-checkpoint': 'checkpointing',
  'goal-blender': 'mission',
  wait: 'waiting',
  begin: 'ready',
  'revision-begin': 'ready',
  'reference-scan': 'reference-intake',
  'reference-intake': 'reference-intake',
  'media-request': 'media',
  'media-generate': 'media',
  'media-record': 'media',
  'media-intake': 'media',
  apply: 'applying',
  wip: 'wip',
  'wip-inspect': 'wip-inspect',
  seal: 'sealing',
  inspect: 'inspecting',
  review: 'reviewing',
  'grader-ticket': 'reviewing',
  'self-review': 'reviewing',
  'retry-grader': 'retrying-review',
  approval: 'approving',
  commit: 'committing',
  checkpoint: 'checkpointing',
  abandon: 'recovery',
  recover: 'recovery',
  preserve: 'recovery',
  'goal-conflict': 'conflict',
  complete: 'complete',
  owned: 'owned',
});

export const REVIEW_ASSIGNMENT_STATES = Object.freeze({
  dispatched: 'dispatched',
  running: 'running',
  verdict: 'verdict',
  cancelled: 'cancelled',
  failed: 'failed',
});

export function isKnownState(machine, state) {
  return Boolean(STATE_MACHINE_CATALOG.machines[machine]?.states.includes(state));
}

export function allowedTransitions(machine, state) {
  const definition = STATE_MACHINE_CATALOG.machines[machine];
  if (!definition || !isKnownState(machine, state) || !Object.hasOwn(definition.transitions, state)) return [];
  return [...(definition.transitions[state] ?? [])];
}

export function isTerminalState(machine, state) {
  const definition = STATE_MACHINE_CATALOG.machines[machine];
  if (!definition || !isKnownState(machine, state)) return false;
  if (definition.kind === 'phase') return false;
  return allowedTransitions(machine, state).length === 0;
}

export function canTransition(machine, from, to) {
  const definition = STATE_MACHINE_CATALOG.machines[machine];
  if (!definition || !isKnownState(machine, from) || !isKnownState(machine, to) || !Object.hasOwn(definition.transitions, from)) return false;
  return definition.transitions[from].includes(to);
}

export function assertTransition(machine, from, to) {
  if (!canTransition(machine, from, to)) throw new Error(`Invalid ${machine} transition: ${from} -> ${to}`);
  return to;
}

export function reviewAssignmentState(assignment) {
  if (!assignment) return null;
  if (assignment.cancelled) return 'cancelled';
  if (assignment.verdict) return 'verdict';
  if (assignment.timedOut) return 'failed';
  if (assignment.error && !assignment.child) return 'failed';
  if (assignment.child) return 'running';
  if (assignment.token || assignment.report) return 'dispatched';
  return null;
}
