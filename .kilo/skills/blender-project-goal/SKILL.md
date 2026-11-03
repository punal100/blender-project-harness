---
name: blender-project-goal
description: Use for Blender design requests and returns to paused projects. Defines discovery, bootstrap, project goal recording, and goal start/resume. Excludes read-only questions and workspace maintenance.
---

# Blender Project Goal

Blender production requires an active registered goal and current project records. Read-only
questions and workspace maintenance MUST NOT launch or modify Blender.

The orchestrator owns goal commands and continuation decisions. Users provide inputs, never goal
commands. If the goal is already paused, do not repeat the stop procedure. There is no successful action, final response, or runtime notice that is approval. A final response alone does not prove approval; a response is not approval without the runtime receipt.

Use `blender_document` `{action:"read"}` for structured project-document access; direct full-file
reads are acceptable but discouraged. Use `blender_workflow {action:"status"}` after compaction,
restart, or any gate error. Execute `status.nextStep.command`; it names the required goal, document,
registration, launch, or production step. The canonical goal template is
`../../../tools/harness/templates/project/Documents/Goals/01-project-brief.md`.

## New project

Requirements, workflow mode, review mode, and scaffolding happen in ordinary chat before a goal
starts. Kilo removes `question` during an active goal.

1. Confirm requirements with `blender-project-requirements`.
2. Ask the optional-workflow intake questions: generate references with Media MCP or supply them,
   use supplied, direct-download, browser/provider, or user-assisted assets, handle scripts as
   none/source-only, and required deliverable formats. Use `intake {scan:true}` to inspect supplied
   paths; it does not write the project. Do not generate paid images, download, or execute scripts
   without explicit consent. Record the media/download scope in the goal or decisions.
3. Collect workflow mode with `blender-project-workflow` and review mode with
   `blender-project-grading`.
4. Scaffold with `blender-project-scaffold`.
5. Create or update README, requirements, workflow, review, assets, decisions, and the filled goal
   with `bootstrap-document`. Use `capabilities.documentFormats`; the harness rejects malformed
   records.
6. Commit the exact scaffold with `bootstrap-commit`. NEVER stage or commit project paths manually.
7. Call `prepare` `{project,goal,scene}`. Pass its exact question and labels to `question`. Only the
   runtime answer registers the project.
8. Call `goal(action="start", objective=<the entire filled prompt>)`. End the turn after a
   successful start.
9. On the next goal turn, inspect `blender_workflow` `status` and continue with its `nextStep`.

NEVER start a goal to ask questions. NEVER create new project documents outside the harness. Update
existing documents only inside declared change paths.

## Return to paused project

1. Read `Documents/WORKFLOW.md`, `Documents/REVIEW.md`, the active goal, requirements, assets, and
   decisions needed for the pending work.
2. On a genuine later return, ask both mode questions only before registration. Once registered,
   requirements, workflow, review mode, and the active goal are frozen; do not reask or record a mode
   change inside the run. Routine approval, clarification, manual-edit pauses, automatic goal turns,
   and compaction are continuations: do not reask modes for those.
3. Confirm records remain current. Registration-changing edits require supported re-registration
   through `prepare`; current re-registration is limited to the capped-review escalation path. If the
   required path is unavailable, STOP and report the tooling blocker. Never edit external harness
   state.
4. Resume only when the pending answer permits continuation:
   `goal(action="resume")` for an unchanged objective. End the turn.
5. Changed scope MUST stop production and report the need for explicit re-registration. Do not edit
   the active goal or other registration documents inside a change. NEVER resume a stale objective.

## Required goal content

The filled goal MUST contain:

- Mission in the user's exact words.
- Project name and links to README, requirements, workflow, review, assets, decisions, and
  references.
- Visual outcome: subject, composition, camera, lighting, materials, colour, scale, mood.
- Scope: in, out, external dependencies.
- Deliverables: scene, review render, exports, documents.
- Acceptance checks observable in a render or readable in a file.
- Workflow: harness actions, autonomy mode, review mode, configured graders.
- Done: current documents, inspected sealed render, final applicable `PASS` when grading is enabled,
  and no genuine unresolved blocker or major finding.

## Goal state

Kilo stores the goal under session metadata `kilo.goal` with status `active`, `paused`, `blocked`, or
`complete`. A rejected tool call blocks the goal; `goal_report` is unavailable until
`goal {action:"resume"}` succeeds. The harness exposes `status.kiloGoal` and, when Kilo reports
`blocked` or `paused`, returns `nextStep.phase:"resume-goal"`. Follow it before any report or further
production action. A harness deny is not permission to bypass the gate.

## Input handoffs

Kilo has no `question` during an active goal.

1. If work cannot continue because approval or a decision is missing, call
   `goal_report(status="blocked", reason=<pending input>)` with the exact evidence. A blocked report
   does not require a commit. End the turn with the decision needed and the next change proposed for
   the user.
2. On the next ordinary user turn, ask the required `question` before resuming.
3. For approval, call `blender_workflow` `approval` and use its exact question and labels. Freeform
   direction does not replace the runtime receipt.
4. Resume with `goal(action="resume")` only after the answer authorizes continuation and records
   remain current. End the turn.
5. NEVER delegate goal commands to the user, self-approve, or resume an outdated goal.

## Rules

- Production MUST NOT start before registration, active goal, and committed valid records.
- Requirements are frozen after registration; a requested change stops production for explicit
  re-registration.
- Partially Autonomous approval is mandatory after every reviewable change before its commit.
- `review` mode `All` or `Single` requires configured grader receipts before approval or commit.
- Use harness document and commit actions. Manual project document writes and Git commits are
  blocked.
- Unsupported material is not made acceptable by a written goal. Stop for reviewed tooling.
- NEVER claim completion without a clean checkpoint, inspected sealed render, and final applicable
  `PASS` or recorded `Off` self-review. Call `goal_report(status="complete",reason=<evidence>)` only
  after that state; then give the final response. Stop Blender through `blender_workflow` unless it
  is intentionally left open for user inspection, and report which choice was made.
