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
2. A new project starts in ordinary chat, not in a goal. Confirm requirements with
   `blender-project-requirements`, select the mode with `blender-project-workflow`, and scaffold the
   project first. Kilo removes `question` while a goal is active, so every clarification must happen
   before the goal starts.
3. Resume saved work with `goal(action="resume")` when a recorded goal exists and its requirements and
   workflow records are current. Do not duplicate an active goal or call resume again on automatic
   goal turns or after compaction within the same active task.
4. Write the goal prompt and start the production goal only after requirements are confirmed, the
   workflow mode is selected, and the project is scaffolded. Never start a discovery goal to ask
   questions.
5. Successful goal start/resume ends the current turn. Give a short response and continue when the
   goal resumes; do not call more tools or perform more work in that turn.
6. On a return to a paused project, read `Documents/WORKFLOW.md` and ask the workflow question from
   `blender-project-workflow` in ordinary chat before resuming.
7. If a goal tool is unavailable or fails, report the exact error and stop production; a written
   prompt alone is not an active goal.

## Project goal steps

1. Confirm that requirements are confirmed, a workflow mode is selected, and the project is scaffolded.
2. Read `AGENTS.md`, `README.md`, `Documents/REQUIREMENTS.md`, `Documents/WORKFLOW.md`,
   `Documents/ASSETS.md`, `Documents/DECISIONS.md`, and the existing goals.
3. Choose the next goal file: `Blender/<Project>/Documents/Goals/NN-<slug>.md`. Fill the scaffold's
   unfinished initial brief for the first goal. Never overwrite an earlier recorded goal.
4. Start from `blender-project-scaffold/templates/project/Documents/Goals/01-project-brief.md` and
   fill every section. Link `REQUIREMENTS.md` and `WORKFLOW.md`; do not duplicate them. The `goal`
   objective must be the entire filled prompt text, not the raw request or a one-line summary; Kilo
   accepts at most 10,000 characters.
5. Call `goal(action="start", objective=<the full prompt text>)` immediately. Writing the file
   without starting the goal is incomplete. After success, end the turn and wait for continuation.
6. If resuming existing work, call `goal(action="resume")` instead of creating a duplicate goal.

## Questions during a goal

Kilo removes `question` while a goal is active
(https://kilo.ai/docs/code-with-ai/agents/goals#clarification-questions). In Partially Autonomous mode,
when an approval or clarification is needed, ask the user to run `/goal pause`, ask with `question`,
wait for every answer, then call `goal(action="resume")`. If an answer changes scope or requirements,
update the documents and goal file first; the user replaces the objective with `/goal <objective>`.
Never self-confirm requirements or record a directive the user did not give.

## Required goal content

- Mission in the user's own words.
- Project name and links to README, requirements, workflow, assets, decisions, references.
- Visual outcome: subject, composition, camera, lighting, materials, colour, scale, mood.
- Scope: in, out, and external dependencies.
- Deliverables: scene, review render, exports, documents.
- Acceptance checks that can be seen in a render or read from a file.
- Workflow: launch from the workspace root, verify the open file, save after every meaningful
  change and before risky work, inspect with `look`, render, and update docs. Review git changes at
  major milestones and commit atomically after each verified change. Include the selected autonomy mode.
- Done: no completion without the review artifact and current documentation.

## Rules

- Do not perform Blender production without an active goal. Bootstrap and maintenance exceptions
  are defined above; they do not authorize scene edits.
- Requirements, workflow selection, and scaffolding happen before the goal. Do not create a project
  goal before requirements are confirmed or a workflow mode is selected.
- Do not start a goal to ask questions; Kilo disables `question` during goal execution.
- In Partially Autonomous mode, pause the goal before asking and resume it after the answers.
- Never invent user confirmation or a session directive to bypass these gates.
- This is a design goal, not a coding plan. Do not create `PLAN/` or plan-check/verifier records.
- Multiple goals per project are allowed; one file per goal.
- Never claim production completion without a saved review render inspected with `look`. Viewport
  screenshots supplement the render; they do not replace the production acceptance artifact.
- Pass the user's exact words in the Mission and in `user_prompt` for Blender MCP calls.
- Keep external asset references pointed at `Documents/ASSETS.md`.
- Update README, `REQUIREMENTS.md`, `WORKFLOW.md`, `DECISIONS.md`, and `ASSETS.md` before
  `goal_report(status="complete", reason=<evidence>)`. Report only after all checks pass, then give
  the final response without further actions.
