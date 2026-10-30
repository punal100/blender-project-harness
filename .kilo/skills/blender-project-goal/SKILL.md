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
2. Resume saved work with `goal(action="resume")`. Do not duplicate an existing active goal or
   call resume again on automatic goal turns or after compaction within the same active task.
3. If no goal exists for a new project, start a requirements discovery goal using the user's exact
   request and the confirmation gate. No project folder or goal file is required for discovery.
4. Successful goal start/resume ends the current turn. Give a short response and continue when the
   goal resumes; do not call more tools or perform more work in that turn.
5. During discovery, confirm requirements, scaffold, record requirements, and select workflow in
   that order. These bootstrap steps must precede production and do not require a project goal file.
6. On a return to a paused project, read `Documents/WORKFLOW.md` and ask the workflow question from
   `blender-project-workflow` before production. Do not repeat that question on automatic goal turns
   or compaction within the same active task.
7. When discovery is finished, report its concrete outcome, then record and start the production
   goal on the next continuation. If a goal tool is unavailable or fails, report the exact error
   and stop production; a written prompt alone is not an active goal.

## Project goal steps

1. Confirm that requirements are confirmed and a workflow mode is selected.
2. Read `AGENTS.md`, `README.md`, `Documents/REQUIREMENTS.md`, `Documents/WORKFLOW.md`,
   `Documents/ASSETS.md`, `Documents/DECISIONS.md`, and the existing goals.
3. Choose the next goal file: `Blender/<Project>/Documents/Goals/NN-<slug>.md`. Fill the scaffold's
   unfinished initial brief for the first goal. Never overwrite an earlier recorded goal.
4. Start from `blender-project-scaffold/templates/project/Documents/Goals/01-project-brief.md` and
   fill every section. Link `REQUIREMENTS.md` and `WORKFLOW.md`; do not duplicate them.
5. Call `goal(action="start", objective=<the full prompt text>)` immediately. Writing the file
   without starting the goal is incomplete. After success, end the turn and wait for continuation.
6. If resuming existing work, call `goal(action="resume")` instead of creating a duplicate goal.

## Required goal content

- Mission in the user's own words.
- Project name and links to README, requirements, workflow, assets, decisions, references.
- Visual outcome: subject, composition, camera, lighting, materials, colour, scale, mood.
- Scope: in, out, and external dependencies.
- Deliverables: scene, review render, exports, documents.
- Acceptance checks that can be seen in a render or read from a file.
- Workflow: launch from the workspace root, verify the open file, save after every meaningful
  change and before risky work, inspect with `look`, render, and update docs. Review git changes at
  major milestones; commit only with explicit user authorization. Include the selected autonomy mode.
- Done: no completion without the review artifact and current documentation.

## Rules

- Do not perform Blender production without an active goal. Bootstrap and maintenance exceptions
  are defined above; they do not authorize scene edits.
- Do not create a project goal before requirements are confirmed.
- Do not create a production goal without a selected workflow mode. Discovery precedes selection.
- This is a design goal, not a coding plan. Do not create `PLAN/` or plan-check/verifier records.
- Multiple goals per project are allowed; one file per goal.
- Never claim production completion without a saved review render inspected with `look`. Viewport
  screenshots supplement the render; they do not replace the production acceptance artifact.
- Pass the user's exact words in the Mission and in `user_prompt` for Blender MCP calls.
- Keep external asset references pointed at `Documents/ASSETS.md`.
- Update README, `REQUIREMENTS.md`, `WORKFLOW.md`, `DECISIONS.md`, and `ASSETS.md` before
  `goal_report(status="complete", reason=<evidence>)`. Report only after all checks pass, then give
  the final response without further actions.
