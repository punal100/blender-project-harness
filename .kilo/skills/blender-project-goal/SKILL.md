---
name: blender-project-goal
description: Use for Blender design requests and returns to paused projects. Defines discovery, bootstrap, project goal recording, and goal start/resume. Excludes read-only questions and workspace maintenance.
---

# Blender Project Goal

Blender production requires an active registered goal and current project records. Read-only
questions and workspace maintenance MUST NOT launch or modify Blender.

The orchestrator owns goal commands and continuation decisions. Users provide inputs, never goal
commands. If the goal is already paused, do not repeat the stop procedure. There is no successful action, final response, or runtime notice that is approval. A final response alone does not prove approval; a response is not approval without the runtime receipt.

Use `blender_workflow {action:"status"}` after compaction, restart, or any gate error. Execute
`status.nextStep.command`; it names the required goal, document, registration, launch, or production
step. The canonical goal template is
`../blender-project-scaffold/templates/project/Documents/Goals/01-project-brief.md`.

## New project

Requirements, workflow mode, review mode, and scaffolding happen in ordinary chat before a goal
starts. Kilo removes `question` during an active goal.

1. Confirm requirements with `blender-project-requirements`.
2. Collect workflow mode with `blender-project-workflow` and review mode with
   `blender-project-grading`.
3. Scaffold with `blender-project-scaffold`.
4. Create or update README, requirements, workflow, review, assets, decisions, and the filled goal
   with `bootstrap-document`. Use `capabilities.documentFormats`; the harness rejects malformed
   records.
5. Commit the exact scaffold with `bootstrap-commit`. NEVER stage or commit project paths manually.
6. Call `prepare` `{project,goal,scene}`. Pass its exact question and labels to `question`. Only the
   runtime answer registers the project.
7. Call `goal(action="start", objective=<the entire filled prompt>)`. End the turn after a
   successful start.
8. On the next goal turn, inspect `blender_workflow` `status` and continue with its `nextStep`.

NEVER start a goal to ask questions. NEVER create new project documents outside the harness. Update
existing documents only inside declared change paths.

## Return to paused project

1. Read `Documents/WORKFLOW.md`, `Documents/REVIEW.md`, the active goal, requirements, assets, and
   decisions needed for the pending work.
2. On a genuine later return, ask both mode questions in ordinary chat and record exact answers.
   Routine approval, clarification, manual-edit pauses, automatic goal turns, and compaction are
   continuations: do not reask modes for those.
3. Confirm records remain current. Registration-changing edits require supported re-registration
   through `prepare`; current re-registration is limited to the capped-review escalation path. If the
   required path is unavailable, STOP and report the tooling blocker. Never edit external harness
   state.
4. Resume only when the pending answer permits continuation:
   `goal(action="resume")` for an unchanged objective. End the turn.
5. Changed scope requires an updated goal document through `document` inside an authorized change,
   followed by supported re-registration. NEVER resume a stale objective.

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

## Input handoffs

Kilo has no `question` during an active goal.

1. If work cannot continue because approval or a decision is missing, call
   `goal_report(status="blocked", reason=<pending input>)` after committing exact project files with
   the harness. End the turn with the decision needed and the next change proposed for the user.
2. On the next ordinary user turn, ask the required `question` before resuming.
3. For approval, call `blender_workflow` `approval` and use its exact question and labels. Freeform
   direction does not replace the runtime receipt.
4. Resume with `goal(action="resume")` only after the answer authorizes continuation and records
   remain current. End the turn.
5. NEVER delegate goal commands to the user, self-approve, or resume an outdated goal.

## Rules

- Production MUST NOT start before registration, active goal, and committed valid records.
- Requirements change only after explicit user confirmation and a harness-recorded update.
- Partially Autonomous approval is mandatory after every reviewable change before its commit.
- `review` mode `All` or `Single` requires configured grader receipts before approval or commit.
- Use harness document and commit actions. Manual project document writes and Git commits are
  blocked.
- Unsupported material is not made acceptable by a written goal. Stop for reviewed tooling.
- NEVER claim completion without a clean checkpoint, inspected sealed render, and final applicable
  `PASS` or recorded `Off` self-review. Call `goal_report(status="complete",reason=<evidence>)` only
  after that state; then give the final response.
