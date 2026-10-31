---
name: blender-project-workflow
description: Select and enforce Fully Autonomous or Partially Autonomous work on new projects and returns to paused projects. Supports mid-work switches and gates partial-mode changes on user approval.
---

# Blender Project Workflow

Ask the workflow mode on new projects and genuine later returns to paused projects; never infer it
from a previous session. Requirements must be confirmed first. Mode selection happens before the
production goal starts, because Kilo removes `question` during an active goal. Workspace maintenance is
exempt from this project gate.

## Gate

- Follow `blender-project-goal` for goal recording and its turn boundary. Do not start the goal
  before requirements, workflow, and review records are complete.
- If requirements are unconfirmed, stop and resolve that first with `blender-project-requirements`.
- Ask the mode with `question` and wait for the answer. Do not start scene work or the goal before it.
- During an active goal, `question` is unavailable in either autonomy mode. For every necessary
  question, ask the user to run `/goal pause`, wait until paused, ask, and wait for every required
  answer. Resume with `goal(action="resume")` only when the answer permits continuation. If scope
  changes, update confirmed records and the active goal file; have the user replace the objective with
  `/goal <objective>` when ready to continue. That command starts it; do not resume an active goal.

## Fully Autonomous

- Work through the confirmed requirements without approval pauses.
- Save the authoritative `.blend` after each meaningful change and before risky work or handoff;
  inspect every visual change with `look`. Review git changes at major milestones and commit
  atomically after each verified change: one logical change per commit, never one end-of-task dump.
- Stop only for a requirements conflict, a destructive or irreversible choice, a missing asset or
  licence, or a technical blocker. Report the blocker and ask.

## Partially Autonomous

- Make one meaningful change at a time. A meaningful change is a new or removed object, collection,
  material, light, camera, render setting, imported asset, or a transform that changes the visible
  result or composition.
- After each meaningful change or new addition: save the `.blend`, inspect with `look`, complete
  required grading under `blender-project-grading`, record dispositions, summarize the result and
  recommendation, then pause and ask for approval or revision direction before continuing. When
  grading is `Off`, controller inspection still remains mandatory.
- Each delegated `blender-worker` task must contain one meaningful change. Apply the approval gate
  after each task, before dispatching the next change. The worker never asks the user; pause the goal
  first, then ask.
- Ask occasionally whether the user wants to modify anything, especially after a few approved
  changes or a direction shift.
- Never make the next meaningful change until the user approves.
- Grader findings do not authorize the next meaningful change. Disclose unresolved findings in the
  review question and obtain approval or explicit revision direction before correcting the scene.
  Do not label a change ready or complete while a genuine blocker or major finding remains.

Approval question:

```text
header: "Review"
question: "Review this saved change and completed review findings. How should I proceed?"
options:
- "Approve and continue"
- "Request changes"
- "I'll modify it manually"
- "Switch to Fully Autonomous"
- "Pause"
```

Handle answers explicitly:

- `Approve and continue`: record approval, then resume for the next authorized change. Approval does
  not waive genuine unresolved blockers or major findings or satisfy a required `PASS`.
- `Request changes`: obtain concrete revision direction while paused, then resume only for that
  revision. Save, inspect, complete required grading, and ask again before any further change.
- `Switch to Fully Autonomous`: record the exact switch in workflow and decisions, then resume
  within confirmed scope. Required reviews and blockers still apply.
- `Pause`, cancellation, or no answer: keep the goal paused and make no further scene changes.
- `I'll modify it manually`: keep the goal paused. Prepare only the requested manual handoff: select
  the relevant object, frame it, hide temporary helpers if useful, and save. Do not change the design.
  Ask with `question`:

```text
header: "Your turn"
question: "The scene is ready for your changes. Tell me when you are done."
options:
- "Done"
- "Still working"
```

`Still working` or no answer keeps the goal paused; do not resume or edit. After `Done`, inspect with
`get_scene_info` and `look`, save the authoritative result, complete required grading, and record
dispositions before the next change-review question. Ask what changed only if inspection leaves a
material ambiguity. Update `DECISIONS.md`, obtain explicit confirmation for requirements revisions,
and obtain approval of the inspected result before resuming production. Read-only review while
paused does not authorize scene changes.

## Select on a new project

After requirements are confirmed and before scaffolding, ask:

```text
header: "Workflow"
question: "How should I work on this project?"
options:
- "Fully Autonomous" — proceed within confirmed requirements without approval pauses
- "Partially Autonomous" — stop for approval after every meaningful change
```

Keep the exact answer in the conversation until scaffolding exists, then write it to
`Documents/WORKFLOW.md` with selection date and a change-log row. Collect the review answer with
`blender-project-grading` before scaffolding too; persist it in `Documents/REVIEW.md` afterward.
Do not reask either mode merely to write its record.

## Resume

On a genuine later return after the user ended or deferred the active task, read
`Documents/WORKFLOW.md` and `Documents/REVIEW.md`, then ask both workflow and review questions before
resuming. Routine approval, clarification, and manual-edit pauses within the same active task,
automatic goal turns, and compaction are continuations: retain selected modes without reasking.
For a genuine return, ask:

```text
header: "Workflow"
question: "Continue this project in <current mode>?"
options:
- "Continue <current mode>"
- "Switch to <other mode>"
- "Review requirements"
```

If the mode is `Unset`, ask the new-project mode question. Record the exact answer and date in
`WORKFLOW.md` even when continuing the same mode, and finish review selection through
`blender-project-grading` before resume. If the user chooses `Review requirements`, resolve and
confirm changes before either record or goal is treated as current.

## Change mode mid-work

The user may switch at any time. If confirmation needs a question, use the universal pause procedure.
Record the exact switch, update `Documents/WORKFLOW.md`, `DECISIONS.md`, and the active goal record,
then continue under the new mode. When switching to Partially Autonomous, ask whether the user wants
to review the current scene first; complete required grading before any change-review question.

## Enforcement

- Use `question` for approvals and workflow changes; do not treat a visual check as approval.
- If a question is cancelled or unanswered, pause; do not continue.
- Fully Autonomous still stops for blockers and scope changes.
- Requirements changes follow `blender-project-requirements`, not this skill.
