---
name: blender-project-goal
description: Use at session start or resume, and at the start of a Blender design request. Enforces an active goal, writes a goal prompt into Documents/Goals, and starts or resumes it with the goal tool.
---

# Blender Project Goal

Every session starts with an active goal. No goal means no work: stop and start one before reading
project files, planning, or touching Blender.

## Session start and reset

1. Call `goal(action="resume")` before any other work.
2. If no goal is active, start one immediately. For a new project, this is the requirements
   discovery goal; write the project goal file after requirements are confirmed and the project is
   scaffolded.
3. If a goal is already active, a pure read-only question may be answered without creating a new
   goal. Any file or scene change needs the project goal.
4. On resume, read `Documents/WORKFLOW.md` and ask the workflow question from
   `blender-project-workflow` before continuing.

## Project goal steps

1. Confirm that requirements are confirmed and a workflow mode is selected.
2. Read `AGENTS.md`, `README.md`, `Documents/REQUIREMENTS.md`, `Documents/WORKFLOW.md`,
   `Documents/ASSETS.md`, `Documents/DECISIONS.md`, and the existing goals.
3. Choose the next goal file: `Blender/<Project>/Documents/Goals/NN-<slug>.md`. Never overwrite an
   earlier goal.
4. Start from `blender-project-scaffold/templates/project/Documents/Goals/01-project-brief.md` and
   fill every section. Link `REQUIREMENTS.md` and `WORKFLOW.md`; do not duplicate them.
5. Call `goal(action="start", objective=<the full prompt text>)` immediately. Writing the file
   without starting the goal is incomplete.
6. If resuming existing work, call `goal(action="resume")` instead of creating a duplicate goal.

## Required goal content

- Mission in the user's own words.
- Project name and links to README, requirements, workflow, assets, decisions, references.
- Visual outcome: subject, composition, camera, lighting, materials, colour, scale, mood.
- Scope: in, out, and external dependencies.
- Deliverables: scene, review render, exports, documents.
- Acceptance checks that can be seen in a render or read from a file.
- Workflow: launch from the workspace root, verify the open file, save every few turns, commit
  major milestones, inspect with `look`, render, update docs. Include the selected autonomy mode.
- Done: no completion without the review artifact and current documentation.

## Rules

- Do not work without an active goal.
- Do not create a project goal before requirements are confirmed.
- Do not create a goal without a selected workflow mode.
- This is a design goal, not a coding plan. Do not create `PLAN/` or plan-check/verifier records.
- Multiple goals per project are allowed; one file per goal.
- Never claim completion without a review render or screenshot inspected with `look`.
- Pass the user's exact words in the Mission and in `user_prompt` for Blender MCP calls.
- Keep external asset references pointed at `Documents/ASSETS.md`.
- Update README, `REQUIREMENTS.md`, `WORKFLOW.md`, `DECISIONS.md`, and `ASSETS.md` before
  `goal_report complete`.
