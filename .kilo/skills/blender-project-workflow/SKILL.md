---
name: blender-project-workflow
description: Select and enforce Fully Autonomous or Partially Autonomous work. Asks the mode on every new project and every resume, supports mid-work switches, and gates partial-mode changes on user approval.
---

# Blender Project Workflow

Ask the workflow mode; never infer it from a previous session. Requirements must be confirmed and
a goal active before this skill is used.

## Gate

- On resume, call `goal(action="resume")` before this skill.
- If requirements are unconfirmed or no goal is active, stop and resolve that first.
- Ask the mode with `question` and wait for the answer. Do not start scene work before it.

## Fully Autonomous

- Work through the confirmed requirements without approval pauses.
- Still save the `.blend` every few turns, commit major milestones, and inspect every visual change
  with `look`.
- Stop only for a requirements conflict, a destructive or irreversible choice, a missing asset or
  licence, or a technical blocker. Report the blocker and ask.

## Partially Autonomous

- Make one meaningful change at a time. A meaningful change is a new or removed object, collection,
  material, light, camera, render setting, imported asset, or a transform that changes the visible
  result or composition.
- After each meaningful change or new addition: save the `.blend`, inspect with `look`, summarize
  what changed, give a recommendation or insight, and ask for approval before continuing.
- When the controller delegates to a `blender-worker`, apply the approval gate after each worker
  task. The worker never asks the user.
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

If the user requests changes, revise, save, inspect with `look`, and ask again. If the user chooses
manual modification, prepare the scene for them: select the relevant object, frame the camera,
hide temporary helpers if useful, save the `.blend`, then ask with `question`:

```text
header: "Your turn"
question: "The scene is ready for your changes. Tell me when you are done."
options:
- "Done"
- "Still working"
```

Wait until the user says done. Then ask what they changed, inspect with
`blender_get_scene_info` and `look`, update `DECISIONS.md` and requirements if needed, and confirm
the result before continuing.

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

On every resume, read `Documents/WORKFLOW.md`, then ask:

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
