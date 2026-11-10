# Workflow — Urban Laundromat

Mode: Fully Autonomous
Selected: 2026-11-11
Last changed: 2026-11-11

## Current mode

- [x] Fully Autonomous
- [ ] Partially Autonomous

## Rules

- Fully Autonomous: proceed within confirmed requirements. Stop for blockers, destructive choices, or scope changes.
- Partially Autonomous: after every reviewable change (a bounded change with at least one apply), seal, inspect with `look`, complete required grading and dispositions, then ask for approval or revision direction before commit. Grader findings do not authorize corrections without that direction.
- `question` remains available during `/goal-blender` in either mode. Follow `blender-project-goal` for required-input handoffs, approvals, and resume; never delegate mission commands to the user.
- Commit through the harness `commit` action after each reviewed change: one scoped change per commit, never one end-of-task dump. Manual project Git commits are blocked.
- Workflow and review modes are frozen after registration. A requested mode change stops production for explicit re-registration.
- Require the final applicable `PASS` with no genuine unresolved blocker or major finding before completion.

## Change log

| Date | Mode | Reason | Confirmed by |
|---|---|---|---|
| 2026-11-11 | Unset | Project scaffolded. | Pending |
| 2026-11-11 | Fully Autonomous | User selected Fully Autonomous for this project. | User |
