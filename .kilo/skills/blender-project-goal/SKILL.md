---
name: blender-project-goal
description: Use for Blender design requests and returns to paused projects. Defines discovery, bootstrap, project goal recording, and /goal-blender start/resume. Excludes read-only questions and workspace maintenance.
---

# Blender Project Goal

Blender production requires an active registered `/goal-blender` mission and current project records.
Read-only questions and workspace maintenance must not launch or modify Blender. The orchestrator owns
mission commands and continuation decisions; users provide inputs, never mission commands. A final response alone is not approval; only a runtime receipt counts.

Use `blender_document` for structured document access. Use `blender_workflow {action:"status"}` after
compaction, restart, or a gate error and execute `status.nextStep.command`. The canonical goal
template is under `../../../.kilo/blender-project-harness/tools/harness/templates/project/Documents/Goals/01-project-brief.md`.

## New project

Requirements, workflow mode, review mode, and scaffolding happen in ordinary chat before a mission
starts. `question` remains available during `/goal-blender`.

1. Discuss requirements with `blender-project-requirements`. Before confirming the brief, call
   `blender_workflow {action:"reference"}` and ask its exact question and labels: use my references,
   generate one (deferred until after registration), use web references, or none. "Fully modeled / no
   external assets" does not answer it. `prepare` rejects without the runtime answer. Use
   `intake {scan:true}` for supplied paths; it does not write the project.
2. Ask the remaining intake questions: generated media after registration versus supplied, downloaded,
   browser/provider, or user-assisted assets; scripts as none or source-only; required deliverable
   formats. Do not generate paid media during discovery. Then confirm the requirements brief.
3. Collect workflow mode with `blender-project-workflow` and review mode with
   `blender-project-grading`. Check `capabilities` against the confirmed visual requirements before
   scaffolding; drop, approximate, or defer anything the operations cannot express.
4. Scaffold with `blender-project-scaffold`.
5. Create or update README, requirements, workflow, review, assets, decisions, and the filled goal
   with `bootstrap-document`; use `capabilities.documentFormats`.
6. Commit the exact scaffold with `bootstrap-commit`. Never stage or commit project paths manually.
7. Call `prepare {project,goal,scene}`; pass its exact question and labels to `question`. Only the
   runtime answer registers.
8. Start the mission with `goal_blender {action:"start"}` (or `/goal-blender start`). The filled goal
   is already committed by the scaffold commit. End the turn after a successful start; do not call
   `begin` in the start turn. The mission loop opens the next turn.
9. On the next mission turn, inspect `blender_workflow` `status` and continue with `nextStep`.

Never start a mission to ask questions. Never create project documents outside the harness. Update
existing documents only inside declared change paths. Never call the built-in `/goal`, `goal`, or
`goal_report`; use `goal_blender` and `/goal-blender` only.

## Return to paused project

1. Read the workflow, review, active goal, requirements, assets, and decisions needed for the pending
   work.
2. On a genuine later return, ask both mode questions only before registration. Once registered,
   requirements, workflow, review mode, and the active goal document are frozen; do not reask or
   record a mode change inside the run. Routine approval, clarification, manual-edit pauses, automatic
   mission turns, and compaction are continuations.
3. Confirm records remain current. Registration-changing edits require supported re-registration
   through `prepare`; current re-registration is limited to the capped-review escalation path. If the
   required path is unavailable, stop and report the tooling blocker. Never edit external harness
   state.
4. Resume only when the pending answer permits continuation: `goal_blender {action:"resume"}` for an
   unchanged mission. End the turn. Never use the built-in goal tool.
5. Changed scope must stop production and request explicit re-registration. Never resume a stale
   objective.

## Required goal content

The filled goal must contain: the mission in the user's exact words; project name and links to
README, requirements, workflow, review, assets, decisions, and references; visual outcome (subject,
composition, camera, lighting, materials, colour, scale, mood); scope in/out and external
dependencies; deliverables; observable acceptance checks; workflow, autonomy mode, review mode, and
configured graders; and the done state.

## Mission state and input handoffs

Harness state is authoritative. `goal_blender` actions are `start`, `status`, `pause`, `resume`,
`complete`, and `clear`; status exposes `goalActive`, `goalSource`, `goalMeta`, `goalConflict`, and
`goalReport`. A mission started by `/goal-blender` never sets `kilo.goal`. If Kilo reports a built-in
goal active, paused, or blocked, the harness marks a conflict, stops production, and requires
`/goal clear`, closing any open change, and re-registration. A harness deny is not permission to bypass
the gate.

`question` remains available during `/goal-blender`. Use it for clarifications and for the exact
`approval` question and labels; freeform direction is not approval and does not replace the runtime
receipt. If an answer is still pending, ask the exact question and end the turn. Resume only after the
answer authorizes continuation and records remain current. Never use the built-in `goal` or
`goal_report` tools.

## Rules

- Production must not start before registration, active `/goal-blender` mission, and committed valid
  records.
- Requirements are frozen after registration; a requested change stops production for explicit
  re-registration.
- Partially Autonomous approval is mandatory after every reviewable change before its commit.
- Review mode `All` or `Single` requires configured grader receipts before approval or commit.
- Use harness document and commit actions. Manual project document writes and Git commits are blocked.
- Unsupported material is not made acceptable by a written goal. Stop for reviewed tooling.
- Never claim completion without a clean checkpoint, inspected sealed render, and final applicable
  `PASS` or recorded `Off` self-review. Call `goal_blender {action:"complete",evidence:<evidence>}`
  only after that state, then stop Blender through `blender_workflow` unless intentionally left open.
