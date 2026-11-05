# Workflow — CozyLaundromat

Mode: Partially Autonomous
Selected: 2026-11-05
Last changed: 2026-11-05

## Current mode

- [ ] Fully Autonomous
- [x] Partially Autonomous

## Rules

- Partially Autonomous: after every reviewable change (a bounded change with at least one apply), seal, inspect with `look`, complete required grading and dispositions, then ask for approval or revision direction before commit.
- Grader findings do not authorize corrections without approval or revision direction.
- `question` remains available during `/goal-blender` in either mode. Follow `blender-project-goal` for required-input handoffs, approvals, and resume; never delegate mission commands to the user.
- Commit through the harness `commit` action after each reviewed change: one scoped change per commit. Manual project Git commits are blocked.
- The selected mode is frozen after registration. A requested mode change stops production for explicit re-registration.
- Require the final applicable `PASS` when grading is enabled and no genuine unresolved blocker or major finding before completion.

## Change log

| Date | Mode | Reason | Confirmed by |
|---|---|---|---|
| 2026-11-05 | Partially Autonomous | User selected workflow mode before scaffolding. | User |
