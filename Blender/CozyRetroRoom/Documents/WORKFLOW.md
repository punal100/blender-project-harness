# Workflow — CozyRetroRoom

Mode: Partially Autonomous
Selected: 2026-10-31
Last changed: 2026-10-31

## Current mode

- [ ] Fully Autonomous
- [x] Partially Autonomous

Selection evidence: user wrote "Partial autonomous" with the initial request on 2026-10-31.

## Rules

- Partially Autonomous: after every meaningful change or addition, save, inspect with `look`, complete
  required grading and dispositions, then ask for approval or revision direction before the next
  meaningful change. Grader findings do not authorize corrections without that direction.
- Fully Autonomous: proceed within confirmed requirements. Stop for blockers, destructive choices, or scope changes.
- Kilo removes `question` during an active goal in either mode. For necessary questions, ask the user
  to run `/goal pause`, wait until paused, ask, and wait for every answer. Resume only when the answer
  permits the next action. Pause, cancellation, no answer, and manual editing keep the goal paused.
- Commit atomically after each verified change: one logical change per commit, never one end-of-task dump.
- Routine approval, clarification, and manual-edit pauses within the same task, automatic goal turns,
  and compaction retain modes without reasking. The user may switch at any time.
- Require the final applicable `PASS` when grading is enabled and no genuine unresolved blocker or
  major finding before completion. User approval does not waive those findings.

## Change log

| Date | Mode | Reason | Confirmed by |
|---|---|---|---|
| 2026-10-31 | Unset | Project scaffolded. | Pending |
| 2026-10-31 | Partially Autonomous | User request specified partial autonomy. | User: "Partial autonomous" |
