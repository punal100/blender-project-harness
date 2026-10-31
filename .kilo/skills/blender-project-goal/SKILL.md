---
name: blender-project-goal
description: Use for Blender design requests and returns to paused projects. Defines discovery, bootstrap, project goal recording, and goal start/resume. Excludes read-only questions and workspace maintenance.
---

# Blender Project Goal

Blender production requires an active goal and a recorded project prompt. Read-only questions and
workspace maintenance do not require a Blender goal. Do not launch or modify Blender for maintenance
unless the user separately requested it.

## Session start and reset

1. Read this skill and enough project context to identify the saved goal and pending work. These
   bootstrap reads are permitted before a goal exists.
2. For a new project, work in ordinary chat: confirm requirements with
   `blender-project-requirements`, collect workflow and review answers with
   `blender-project-workflow` and `blender-project-grading`, scaffold with
   `blender-project-scaffold`, then persist all three exact confirmation records. Fill the goal only
   after those records are complete; start it before launching Blender. Never use a discovery goal.
3. On a genuine later return to a paused project, read `Documents/WORKFLOW.md` and
   `Documents/REVIEW.md`, ask both selection questions in ordinary chat, and record the exact answers
   before resuming. Routine approval, clarification, and manual-edit pauses, automatic goal turns,
   and compaction within the same active task are continuations; do not reask modes for those pauses.
4. Resume saved work with `goal(action="resume")` only when its requirements, workflow, review, and
   goal records are current and the pending answer permits continuation. Do not duplicate an active
   goal or resume it again on automatic goal turns or after compaction.
5. For new work, write the filled goal prompt and start the production goal only after requirements,
   workflow, and review records are complete and the project is scaffolded.
6. Successful goal start/resume ends the current turn. Give a short response and continue when the
   goal resumes; do not call more tools or perform more work in that turn.
7. If a goal tool is unavailable or fails, report the exact error and stop production; a written
   prompt alone is not an active goal.

## Project goal steps

1. Confirm that requirements are confirmed, a workflow mode is selected, a review mode is recorded,
   and the project is scaffolded.
2. Read `AGENTS.md`, `README.md`, `Documents/REQUIREMENTS.md`, `Documents/WORKFLOW.md`,
   `Documents/REVIEW.md`, `Documents/ASSETS.md`, `Documents/DECISIONS.md`, and the existing goals.
3. For a new goal, choose `Blender/<Project>/Documents/Goals/NN-<slug>.md`; fill the scaffold's
   unfinished initial brief for the first goal. Never overwrite an earlier completed goal. For saved
   work, retain its actual active goal file instead of creating a duplicate.
4. For a new goal, start from
   `../blender-project-scaffold/templates/project/Documents/Goals/01-project-brief.md` and fill every
   section. For saved work, read its active goal file and update only confirmed revisions. Link
   `REQUIREMENTS.md`, `WORKFLOW.md`, and `REVIEW.md`; do not duplicate them.
   The `goal` objective must be the entire filled prompt text, not the raw request or a one-line
   summary; Kilo accepts at most 10,000 characters.
5. Identify the active goal's actual `Documents/Goals/NN-<slug>.md` path for production and grading.
   The initial brief is a bootstrap template, not a fixed target for later goals.
6. For a new goal, call `goal(action="start", objective=<the full prompt text>)` immediately. Writing
   the file without starting the goal is incomplete. For saved work, complete the return gates above
   and call `goal(action="resume")` instead. After success, end the turn and wait for continuation.

## Questions during a goal

Kilo removes `question` while a goal is active
(https://kilo.ai/docs/code-with-ai/agents/goals#clarification-questions). In either autonomy mode, when
a necessary question arises, ask the user to run `/goal pause` and wait until the goal is paused before
calling `question`. Wait for every required answer. Resume only when the answer authorizes the next
action and records are current; Pause, cancellation, unanswered questions, and manual editing keep
the goal paused. Follow `blender-project-workflow` for Partially Autonomous approval branches.

If an answer changes scope or requirements, obtain explicit confirmation, update the documents and
active goal file, then have the user replace the objective with `/goal <objective>` only when ready to
continue. That command starts the replacement objective; do not call resume again while it is active.
Never self-confirm requirements or record a directive the user did not give.

## Required goal content

- Mission in the user's own words.
- Project name and links to README, requirements, workflow, review mode, assets, decisions, references.
- Visual outcome: subject, composition, camera, lighting, materials, colour, scale, mood.
- Scope: in, out, and external dependencies.
- Deliverables: scene, review render, exports, documents.
- Acceptance checks that can be seen in a render or read from a file.
- Workflow: launch from the workspace root, verify the open file, save after every meaningful
  change and before risky work, inspect with `look`, render, and update docs. Review git changes at
  major milestones and commit atomically after each verified change. Include the selected autonomy
  mode and review mode, and run configured graders as defined in `blender-project-grading`.
- Done: require the review artifact, current documentation including `REVIEW.md`, and a final
  applicable `PASS` when grading is enabled. No genuine unresolved blocker or major finding permits
  completion; declining a genuine finding is not a waiver.

## Rules

- Do not perform Blender production without an active goal. Bootstrap and maintenance exceptions
  are defined above; they do not authorize scene edits.
- Requirements, workflow selection, review mode, and scaffolding happen before the goal. Do not
  create a project goal before requirements are confirmed or a workflow or review mode is selected.
- Do not start a goal to ask questions; Kilo disables `question` during goal execution.
- In either autonomy mode, pause before necessary questions and resume only on an answer that permits
  continuation. Do not reselect modes for routine approval pauses within the same active task.
- Never invent user confirmation or a session directive to bypass these gates.
- This is a design goal, not a coding plan. Do not create `PLAN/` or plan-check/verifier records.
- Multiple goals per project are allowed; one file per goal.
- Never claim production completion without a saved review render inspected with `look`. Viewport
  screenshots supplement the render; they do not replace the production acceptance artifact.
- Pass the user's exact words in the Mission and in `user_prompt` for Blender MCP calls.
- Keep external asset references pointed at `Documents/ASSETS.md`.
- Complete required grading before every Partially Autonomous approval or revision-direction
  question. Grader findings never authorize another meaningful change before the user's approval or
  revision direction.
- Update README, `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`, `DECISIONS.md`, and `ASSETS.md` before
  `goal_report(status="complete", reason=<evidence>)`. Report only after all checks pass, then give
  the final response without further actions.
