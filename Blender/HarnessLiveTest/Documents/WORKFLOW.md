# Workflow — HarnessLiveTest

Mode: Fully Autonomous
Selected: 2026-11-02
Last changed: 2026-11-02

## Current mode

- [x] Fully Autonomous
- [ ] Partially Autonomous

## Rules

- Fully Autonomous: proceed within confirmed requirements. Stop for blockers, destructive choices, or scope changes.
- Partially Autonomous: after every reviewable change, seal, inspect, grade, and obtain approval before commit.
- Kilo removes `question` during an active goal; follow `blender-project-goal` for required-input handoffs.
- Commit through the harness after each reviewed change. Manual project Git commits are blocked.
- Complete required grading before completion; no genuine unresolved blocker or major is permitted.
- Review mode is Single with grader `visual` for this validation run.

## Change log

| Date | Mode | Reason | Confirmed by |
|---|---|---|---|
| 2026-11-02 | Fully Autonomous | User-requested live harness validation run. | User request |
