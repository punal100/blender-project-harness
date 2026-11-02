# Workflow — CozyRoomDiorama

Mode: Fully Autonomous
Selected: 2026-11-03
Last changed: 2026-11-03

## Current mode

- [x] Fully Autonomous
- [ ] Partially Autonomous

## Rules

- Fully Autonomous: proceed within confirmed requirements. Stop for blockers, destructive choices, or scope changes.
- Partially Autonomous is not selected for this project.
- Kilo removes `question` during an active goal. The orchestrator follows `blender-project-goal` for required-input handoffs, questions, objective updates, and resume; never delegate goal commands to the user.
- Commit through the harness `commit` action after each reviewed change: one scoped change per commit, never one end-of-task dump. Manual project Git commits are blocked.
- Workflow and review answers were collected after requirements confirmation and before scaffolding.
- Require the final applicable `PASS` when grading is enabled and no genuine unresolved blocker or major finding before completion. User approval does not waive those findings.

## Change log

| Date | Mode | Reason | Confirmed by |
|---|---|---|---|
| 2026-11-03 | Unset | Project scaffolded. | Pending |
| 2026-11-03 | Fully Autonomous | User selected the workflow mode before scaffolding. | User |
