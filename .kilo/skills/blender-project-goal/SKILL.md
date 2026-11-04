---
name: blender-project-goal
description: Use for Blender design requests and returns to paused projects. Defines discovery, bootstrap, project goal recording, and goal start/resume. Excludes read-only questions and workspace maintenance.
---

# Blender Project Goal

Blender production requires an active registered goal and current project records. Read-only questions
and workspace maintenance must not launch or modify Blender. The orchestrator owns goal commands and
continuation decisions; users provide inputs, never goal commands. A final response alone is not
approval; only a runtime receipt counts.

Use `blender_document` for structured document access. Use `blender_workflow {action:"status"}` after
compaction, restart, or a gate error and execute `status.nextStep.command`. The canonical goal
template is under `../../../.kilo/blender-project-harness/tools/harness/templates/project/Documents/Goals/01-project-brief.md`.

## New project

Requirements, workflow mode, review mode, and scaffolding happen in ordinary chat before a goal
starts. Kilo removes `question` during an active goal.

1. Confirm requirements with `blender-project-requirements`.
2. Ask the optional-workflow intake questions: generated media after registration versus supplied,
   downloaded, browser/provider, or user-assisted assets; scripts as none or source-only; required
   deliverable formats. Use `intake {scan:true}` for supplied paths; it does not write the project.
   Do not generate paid media during discovery.
3. Collect workflow mode with `blender-project-workflow` and review mode with
   `blender-project-grading`.
4. Scaffold with `blender-project-scaffold`.
5. Create or update README, requirements, workflow, review, assets, decisions, and the filled goal
   with `bootstrap-document`; use `capabilities.documentFormats`.
6. Commit the exact scaffold with `bootstrap-commit`. Never stage or commit project paths manually.
7. Call `prepare {project,goal,scene}`; pass its exact question and labels to `question`. Only the
   runtime answer registers.
 8. Start or resume the goal with the entire filled prompt: `goal(action="start", objective=<filled prompt>)`. End the turn after a successful start.
9. On the next goal turn, inspect `status` and continue with `nextStep`.

Never start a goal to ask questions. Never create project documents outside the harness. Update
existing documents only inside declared change paths.

## Return to paused project

1. Read the workflow, review, active goal, requirements, assets, and decisions needed for the pending
   work.
2. On a genuine later return, ask both mode questions only before registration. Once registered,
   requirements, workflow, review mode, and the active goal are frozen; do not reask or record a mode
   change inside the run. Routine approval, clarification, manual-edit pauses, automatic goal turns,
   and compaction are continuations.
3. Confirm records remain current. Registration-changing edits require supported re-registration
   through `prepare`; current re-registration is limited to the capped-review escalation path. If the
   required path is unavailable, stop and report the tooling blocker. Never edit external harness
   state.
 4. Resume only when the pending answer permits continuation: `goal(action="resume")` for an
    unchanged objective. End the turn.
5. Changed scope must stop production and request explicit re-registration. Never resume a stale
   objective.

## Required goal content

The filled goal must contain: the mission in the user's exact words; project name and links to
README, requirements, workflow, review, assets, decisions, and references; visual outcome (subject,
composition, camera, lighting, materials, colour, scale, mood); scope in/out and external
dependencies; deliverables; observable acceptance checks; workflow, autonomy mode, review mode, and
configured graders; and the done state.

## Goal state and input handoffs

Kilo stores the goal under session metadata `kilo.goal` with status `active`, `paused`, `blocked`, or
`complete`. A rejected tool call blocks the goal; `goal_report` is unavailable until
`goal(action="resume")` succeeds. The harness exposes `status.kiloGoal` and returns
`nextStep.phase:"resume-goal"` when Kilo reports paused or already paused; follow it before any report
or further production action. `no successful action` completes a blocked goal turn; resume first.
A harness deny is not permission to bypass the gate.

Kilo has no `question` during an active goal. If work cannot continue because approval or a decision
is missing, call `goal_report(status="blocked", reason=<pending input>)` with the exact evidence. A
blocked report does not require a commit. End the turn with the decision needed and the next change
proposed. On the next ordinary user turn, ask the required `question` before resuming. For approval,
call `blender_workflow` `approval` and use its exact question and labels; freeform direction is
not approval and does not replace the runtime receipt. A final response alone does not prove that
approval was recorded. Resume only after the answer authorizes continuation and records remain current.

## Rules

- Production must not start before registration, active goal, and committed valid records.
- Requirements are frozen after registration; a requested change stops production for explicit
  re-registration.
- Partially Autonomous approval is mandatory after every reviewable change before its commit.
- Review mode `All` or `Single` requires configured grader receipts before approval or commit.
- Use harness document and commit actions. Manual project document writes and Git commits are blocked.
- Unsupported material is not made acceptable by a written goal. Stop for reviewed tooling.
- Never claim completion without a clean checkpoint, inspected sealed render, and final applicable
  `PASS` or recorded `Off` self-review. Call `goal_report(status="complete",reason=<evidence>)` only
  after that state, then stop Blender through `blender_workflow` unless intentionally left open.
