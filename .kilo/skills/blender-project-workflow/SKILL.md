---
name: blender-project-workflow
description: Select and enforce Fully Autonomous or Partially Autonomous work on new projects and returns to paused projects. Supports mid-work switches and gates partial-mode changes on user approval.
---

# Blender Project Workflow

Ask the workflow mode on new projects and returns to paused projects; never infer it from a previous
session. Requirements must be confirmed first. Mode selection happens in ordinary chat before the
production goal starts, because Kilo removes `question` during an active goal. Workspace maintenance is
exempt from this project gate.

## Gate

- Follow `blender-project-goal` for goal recording and its turn boundary. Do not start the goal
  before requirements are confirmed and the mode is recorded.
- If requirements are unconfirmed, stop and resolve that first with `blender-project-requirements`.
- Ask the mode with `question` and wait for the answer. Do not start scene work or the goal before it.
- During an active goal, `question` is unavailable. In Partially Autonomous mode, ask the user to run
  `/goal pause` before an approval or clarification, wait for the answer, then resume with
  `goal(action="resume")`. If the answer changes scope, update the records and have the user replace
  the objective with `/goal <objective>`.

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
- After each meaningful change or new addition: save the `.blend`, inspect with `look`, summarize
  what changed, give a recommendation or insight, and ask for approval before continuing.
- Each delegated `blender-worker` task must contain one meaningful change. Apply the approval gate
  after each task, before dispatching the next change. The worker never asks the user; pause the goal
  first, then ask.
- Ask occasionally whether the user wants to modify anything, especially after a few approved
  changes or a direction shift.
- Never make the next meaningful change until the user approves.

Approval question:

```text
header: "Review"
question: "This change is ready. How should I proceed?"
options:
- "Approve and continue"
- "Request changes"
- "I'll modify it manually"
- "Switch to Fully Autonomous"
- "Pause"
```

If the user requests changes, revise, save, inspect with `look`, and ask again. Approval questions
require an unblocked `question` tool: ask the user to run `/goal pause` first, then ask, then resume
the goal after the answer. If the user chooses manual modification, prepare the scene for them: select
the relevant object, frame the camera, hide temporary helpers if useful, save the `.blend`, then ask
with `question`:

```text
header: "Your turn"
question: "The scene is ready for your changes. Tell me when you are done."
options:
- "Done"
- "Still working"
```

Wait until the user says done. Inspect with `get_scene_info` and `look`; ask what changed only if
inspection leaves a material ambiguity. Update `DECISIONS.md`, obtain explicit confirmation for
any requirements revision, and confirm the inspected result before continuing.

## Select on a new project

After requirements are confirmed and the project is scaffolded, ask:

```text
header: "Workflow"
question: "How should I work on this project?"
options:
- "Fully Autonomous" — proceed within confirmed requirements without approval pauses
- "Partially Autonomous" — stop for approval after every meaningful change
```

Write the answer to `Documents/WORKFLOW.md` and add a change-log row.

## Resume

On every return to a paused project, read `Documents/WORKFLOW.md`, then ask. Automatic goal turns
and compaction within the same active task are continuations, not returns to a paused project:

```text
header: "Workflow"
question: "Continue this project in <current mode>?"
options:
- "Continue <current mode>"
- "Switch to <other mode>"
- "Review requirements"
```

If the mode is `Unset`, ask the new-project mode question. Always update `WORKFLOW.md` after a
switch.

## Change mode mid-work

The user may switch at any time. Confirm the switch, update `Documents/WORKFLOW.md` and
`DECISIONS.md`, then continue under the new mode. When switching to Partially Autonomous, ask
whether the user wants to review the current scene first.

## Enforcement

- Use `question` for approvals and workflow changes; do not treat a visual check as approval.
- If a question is cancelled or unanswered, pause; do not continue.
- Fully Autonomous still stops for blockers and scope changes.
- Requirements changes follow `blender-project-requirements`, not this skill.
