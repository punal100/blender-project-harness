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
- Follow `AGENTS.md` for the canonical runtime harness contract. Before launch, commit completed
  scaffold/goal records, call `blender_workflow` `prepare`, and ask its exact registration question
  with exact labels, `custom:false,multiple:false`. Only runtime answers grant registration.
- Ask the mode with `question` and wait for the answer. Do not start scene work or the goal before it.
- During an active goal, `question` is unavailable in either autonomy mode. For every necessary
  question, follow `blender-project-goal` for the orchestrator-owned required-input handoff, questions,
  and start/resume. Never delegate goal commands to the user. Already stopped work needs no second
  pause. Confirmed scope or mode changes require supported registration before objective replacement.

## Fully Autonomous

- Work through the confirmed requirements without approval pauses.
- Save the authoritative `.blend` after each meaningful change and before risky work or handoff;
  use ticketed harness operations and inspect every visual change with `look`. Each `begin` has one
  outcome, exact objects/paths, and a 40-operation/15-minute apply budget; recovery save/seal remain
  available. Seal, inspect the returned final PNG, complete review, inspect status/diff/log, stage only
  scoped paths, commit atomically, then `checkpoint` before another `begin`. Never one end-of-task dump.
- Stop only for a requirements conflict, a destructive or irreversible choice, a missing asset or
  licence, or a technical blocker. Report the blocker and ask.

## Partially Autonomous

- Make one meaningful change at a time. A meaningful change is a new or removed object, collection,
  material, light, camera, render setting, imported asset, or a transform that changes the visible
  result or composition.
- After each meaningful change or new addition: save the `.blend`, inspect with `look`, complete
  required grading under `blender-project-grading`, record dispositions, summarize the result and
  recommendation, then follow the required-input handoff and ask for approval or revision direction.
  When grading is `Off`, orchestrator inspection still remains mandatory.
- Current workers inspect only; the orchestrator makes each meaningful change through the harness.
  Delegated writes require explicit assignment and reviewed support. Workers never ask the user.
- Ask occasionally whether the user wants to modify anything, especially after a few approved
  changes or a direction shift.
- Never make the next meaningful change until the user approves.
- Grader findings do not authorize the next meaningful change. Disclose unresolved findings in the
  review question and obtain approval or explicit revision direction before correcting the scene.
  Do not label a change ready or complete while a genuine blocker or major finding remains.

Approval is runtime-captured: after saved render inspection, required grading, and dispositions, use
the `blender-project-goal` handoff if execution is active; if already stopped, ask directly in ordinary
chat. Call `blender_workflow` `approval` with `{}`; pass its returned question unchanged to `question`,
with exactly `Approve change`, `Request revision`, `Pause`, `custom:false,multiple:false`. Never
substitute a hand-written approval question or approved
JSON. Forged JSON is ignored. Other questions and mode changes remain separate paused-goal steps.

Handle answers explicitly:

- `Approve change`: record the runtime answer, inspect status/diff/log, stage exact scoped paths,
  commit the change and review artifacts, then `checkpoint` before resuming authorized work. Approval
  does not waive genuine unresolved blockers or major findings or satisfy a required `PASS`.
- `Request revision`: obtain concrete direction while paused; commit the failed round and checkpoint
  before fixes. Resume only for a bounded `begin` with `revision:true`; save, seal, inspect, complete
  review, and ask again. Runtime caps the chain at the configured `max_rounds`; exhausting it needs
  explicit user escalation and re-registration handling, never a silent override.
- `Pause`, cancellation, or no answer: keep the goal paused and make no further scene changes.
- For a separate request to modify manually, keep the goal paused. Do not use raw Python to prepare
  the scene or silently edit sealed work. Manual Blender or external-shell edits invalidate evidence;
  inspect harness `status` and resolve re-registration/review before production continues. Ask with
  `question`:

```text
header: "Your turn"
question: "The scene is ready for your changes. Tell me when you are done."
options:
- "Done"
- "Still working"
```

`Still working` or no answer keeps work stopped; do not resume or edit. After `Done`, inspect with
`get_scene_info` and `look`; resolve stale harness state through reviewed tooling. Inspection while
stopped is read-only; ticketed save/seal requires supported recovery, current registration, and an
agent-resumed active goal. Complete required grading before the next change-review question. Never
edit external harness state or reuse stale approval. Ask what changed only if inspection leaves a
material ambiguity. Update `DECISIONS.md`, obtain explicit confirmation for requirements revisions,
and obtain approval of the inspected result before further scene changes. Read-only review while
stopped does not authorize scene changes.

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

The user may switch at any time. If confirmation needs a question, follow `blender-project-goal`.
Record the exact switch, update `Documents/WORKFLOW.md`, `DECISIONS.md`, and the active goal record,
then resolve changed registration facts through supported tooling before the orchestrator starts the
updated objective. If unsupported, report the tooling blocker instead of resuming stale work. When
switching to Partially Autonomous, ask whether the user wants to review the current scene first;
complete required grading before any change-review question.

## Enforcement

- Use `question` for approvals and workflow changes; do not treat a visual check as approval.
- If a question is cancelled or unanswered, keep work stopped; do not continue or ask for goal commands.
- Fully Autonomous still stops for blockers and scope changes.
- Requirements changes follow `blender-project-requirements`, not this skill.
- `status` recovers phase after compaction/restart. `checkpoint` requires exactly one scoped commit,
  clean project state, and matching hashes. Neither mode bypasses registration, sealed-render
  inspection, review receipts, or the final clean-checkpoint/`PASS` completion hook.
