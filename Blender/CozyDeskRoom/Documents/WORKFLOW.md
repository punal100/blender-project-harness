# Workflow — CozyDeskRoom

Mode: Fully Autonomous
Selected: 2026-11-03
Last changed: 2026-11-03

## Current mode

- [x] Fully Autonomous
- [ ] Partially Autonomous

## Rules

- Fully Autonomous: proceed within confirmed requirements. Stop for blockers, destructive choices, or scope changes.
- Partially Autonomous: after every reviewable change (a bounded change with at least one apply),
  seal, inspect with `look`, complete required grading and dispositions, then ask for approval or
  revision direction before commit. Grader findings do not authorize corrections without that
  direction.
- Kilo removes `question` during an active goal in either mode. The orchestrator follows
  `blender-project-goal` for required-input handoffs, questions, objective updates, and resume; never
  delegate goal commands to the user or repeat the stop procedure for already stopped work. Wait for
  every required answer. Pause, cancellation, no answer, and manual editing keep work stopped.
- Commit through the harness `commit` action after each reviewed change: one scoped change per
  commit, never one end-of-task dump. Manual project Git commits are blocked.
- Collect workflow and review answers after requirements confirmation and before scaffolding, then
  persist their exact records before filling and starting the goal. Ask both modes before resuming a
  genuine later return. Routine approval, clarification, and manual-edit pauses within the same task,
  automatic goal turns, and compaction retain modes without reasking. The user may switch at any time.
- Require the final applicable `PASS` when grading is enabled and no genuine unresolved blocker or
  major finding before completion. User approval does not waive those findings.

## Change log

| Date | Mode | Reason | Confirmed by |
|---|---|---|---|
| 2026-11-03 | Unset | Project scaffolded. | Pending |
| 2026-11-03 | Fully Autonomous | User selected "Fully Autonomous (Recommended)" before scaffolding. | User |
