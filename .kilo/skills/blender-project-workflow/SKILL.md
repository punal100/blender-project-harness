---
name: blender-project-workflow
description: Select and enforce Fully Autonomous or Partially Autonomous work on new projects and returns to paused projects. Defines approval gates and mode switches.
---

# Blender Project Workflow

Workflow mode must be selected in ordinary chat before the `/goal-blender` mission starts, after
requirements are confirmed. Ask it again on a genuine later return before resume. Workspace
maintenance is exempt. Read `AGENTS.md`, `blender-project-goal`, and `blender-workflow-harness`; follow
`status.nextStep`.

## Rules

- Requirements must be confirmed before either mode starts.
- `question` remains available during `/goal-blender`. Use it for clarifications, approvals, and
  required registration questions; never use `goal_report`.
- A reviewable change is one bounded change with at least one apply operation. The bootstrap save is
  not reviewable.
- Each reviewable change follows `begin` → apply tickets → `seal` → `look` → review → approval when
  required → `commit` → `checkpoint`.
- Project documents and project commits use harness actions. Manual project writes and Git commits are
  blocked.

## Fully Autonomous

- Proceed within confirmed requirements without approval pauses.
- Complete review and `checkpoint` for every reviewable change. With `Off`, call `commit` after
  self-review. With `All` or `Single`, `review` auto-commits the change; go directly to `checkpoint`.
- Stop for a requirements conflict, destructive or irreversible choice, missing asset or licence,
  missing required grader, or technical blocker.

## Capped-review escalation

When `max_rounds` is exhausted, `escalate` is an intentional user gate, not a silent retry. It records
the reason and enters re-registration. `prepare` returns one exact registration question; only a
runtime answer may register the new cap. Use `question` for that exact registration question and wait.
Never auto-confirm, raise `max_rounds` without `escalate`, or continue with the old cap.

## Partially Autonomous

- Obtain approval after every reviewable change and before its commit.
- After `seal` and `look`, complete required review and record every finding disposition.
- Call `approval {}` and pass its exact question and returned labels, in order, to `question`; set the
  question default to `defaultLabel`. A failed review omits `Approve change`. `question` is available
  during the mission.
- Only a runtime answer counts. Never self-approve or record approval the user did not give.
- `Approve change`: `commit` the exact reviewed change, then `checkpoint`.
- `Request revision`: obtain concrete direction with `question`; commit the failed round; resume only
  for a bounded `begin` with `revision:true`; repeat review and approval.
- `Pause`, cancellation, or no answer: make no further scene changes.
- Findings do not authorize fixes or the next change without approval or revision direction.

## Questions and mode switches

New project: ask "How should I work on this project?" with `Fully Autonomous` and
`Partially Autonomous` options. Record the exact answer in `Documents/WORKFLOW.md` with `Mode:`,
`Selected:`, `Last changed:`, and a change-log row. Do not reask an answer already collected.

On a genuine later return, read `Documents/WORKFLOW.md` and `Documents/REVIEW.md` and ask
"Continue this project in <current mode>?" with `Continue <current mode>`, `Switch to <other mode>`,
and `Review requirements`. Continue without rewriting frozen records. If switch or review is chosen
after registration, stop and report the need for explicit re-registration before resume.

If the user requests manual scene edits, pause the mission with `/goal-blender pause`. Do not use raw
Python or shell edits. After the user reports completion, inspect `status`; resolve stale state through
reviewed recovery. Required review and approval remain mandatory before further production.
