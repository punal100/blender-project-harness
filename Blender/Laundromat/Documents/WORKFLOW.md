# Workflow — Laundromat

Mode: Fully Autonomous
Selected: 2026-11-10
Last changed: 2026-11-10

## Current mode

- [x] Fully Autonomous
- [ ] Partially Autonomous

## Rules

- Fully Autonomous: proceed within confirmed requirements. Stop for blockers, destructive choices, or scope changes.
- Every reviewable change runs begin, apply tickets, seal, inspect with `look`, complete the required `Single` visual review and dispositions, commit, and checkpoint.
- `question` remains available during `/goal-blender` for necessary clarifications. The orchestrator follows `blender-project-goal` for required-input handoffs and resume; never delegate mission commands to the user.
- Commit through the harness `commit` action after each reviewed change: one scoped change per commit, never one end-of-task dump. Manual project Git commits are blocked.
- Requirements, workflow mode, review mode, and the active goal are frozen after registration. A requested change stops production for explicit re-registration.
- Require the final applicable `PASS` when grading is enabled and no genuine unresolved blocker or major finding before completion.

## Change log

| Date | Mode | Reason | Confirmed by |
|---|---|---|---|
| 2026-11-10 | Fully Autonomous | User selected Fully Autonomous for this new project. | User question answer |
