---
name: blender-project-workflow
description: Select and enforce Fully Autonomous or Partially Autonomous work on new projects and returns to paused projects. Defines approval gates and mode switches.
---

# Blender Project Workflow

Workflow mode MUST be selected in ordinary chat before the production goal starts, after
requirements are confirmed. Ask it again on a genuine later return before resume. Workspace
maintenance is exempt.

## Rules

- Read `AGENTS.md` and `blender-workflow-harness`. Follow `status.nextStep`.
- Requirements MUST be confirmed before either mode starts.
- `question` is unavailable during an active goal. Use `blender-project-goal` for the required-input
  handoff before asking approval or changing mode.
- A **reviewable change** is one bounded change with at least one apply operation. The bootstrap save
  is not reviewable.
- Each reviewable change follows `begin` → apply tickets → `seal` → `look` → review → approval when
  required → `commit` → `checkpoint`.
- Project documents and project commits MUST use harness actions. Manual project writes and Git
  commits are blocked.

## Fully Autonomous

- Proceed within confirmed requirements without approval pauses.
- Complete review and `checkpoint` for every reviewable change. With `Off`, call `commit` after
  self-review. With `All` or `Single`, `review` auto-commits the change; go directly to `checkpoint`.
- STOP for a requirements conflict, destructive or irreversible choice, missing asset or licence,
  missing required grader, or technical blocker.

## Partially Autonomous

- Obtain approval after every reviewable change and before its commit.
- After `seal` and `look`, complete required review and record every finding disposition.
- Call `approval` `{}` with the goal stopped when `question` is unavailable. Pass its exact question
  and labels to `question`: `Approve change`, `Request revision`, `Pause`.
- Only a runtime answer counts. NEVER self-approve or record approval the user did not give.
- `Approve change`: `commit` the exact reviewed change, then `checkpoint`.
- `Request revision`: obtain concrete direction while stopped; commit the failed round; resume only
  for a bounded `begin` with `revision:true`; repeat review and approval.
- `Pause`, cancellation, or no answer: make no further scene changes.
- Findings do not authorize fixes or the next change without approval or revision direction.

## New-project question

```text
header: "Workflow"
question: "How should I work on this project?"
options:
- "Fully Autonomous" — proceed within confirmed requirements without approval pauses
- "Partially Autonomous" — stop for approval after every reviewable change
```

Record the exact answer in `Documents/WORKFLOW.md` with `Mode:`, `Selected:`, `Last changed:`, and a
change-log row. Do not reask an answer already collected for the current task.

## Return question

On a genuine later return, read `Documents/WORKFLOW.md` and `Documents/REVIEW.md` and ask:

```text
header: "Workflow"
question: "Continue this project in <current mode>?"
options:
- "Continue <current mode>"
- "Switch to <other mode>"
- "Review requirements"
```

Record the exact answer and date in `WORKFLOW.md` even when retaining the mode. Complete review-mode
selection through `blender-project-grading` before resume. If `Review requirements` is chosen,
resolve requirements before either record or the goal is current.

## Mode switch

1. Obtain explicit user direction.
2. Update `Documents/WORKFLOW.md`, `Documents/DECISIONS.md`, and the active goal through harness
   document actions.
3. Resolve registration facts through supported tooling. If re-registration is unavailable, stop and
   report the exact blocker; do not resume stale work.
4. When switching to Partially Autonomous, ask whether the user wants to review the current scene
   first. Complete required review before any change approval question.

## Manual edits

If the user requests manual scene edits, keep the goal paused. Do not use raw Python or shell edits
to prepare the scene. After the user reports completion, inspect `status`; resolve stale state
through reviewed recovery. Required review and approval remain mandatory before further production.
