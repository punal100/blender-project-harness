# Workflow — CozyRetroRoom

Mode: Partially Autonomous
Selected: 2026-10-31
Last changed: 2026-10-31

## Current mode

- [ ] Fully Autonomous
- [x] Partially Autonomous

## Rules

- Fully Autonomous: proceed within confirmed requirements. Stop for blockers, destructive choices, or scope changes.
- Partially Autonomous: after every meaningful change or addition, save, inspect with `look`, and ask for approval before continuing.
- Kilo removes `question` during an active goal. In Partially Autonomous mode, ask the user to run `/goal pause`, ask, wait for every answer, then resume with `goal(action="resume")`.
- Commit atomically after each verified change: one logical change per commit, never one end-of-task dump.
- Ask the mode on every new project and every return to a paused project. Automatic goal turns and
  compaction within the same active task continue the selected mode without repeating the question.
  The user may switch at any time.

## Change log

| Date | Mode | Reason | Confirmed by |
|---|---|---|---|
| 2026-10-31 | Unset | Project scaffolded. | Pending |
| 2026-10-31 | Partially Autonomous | User selected the mode in the initial request. | User: "Partial autonomous" |
