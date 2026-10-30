---
name: blender-project-goal
description: Use at the start of a Blender design request. Writes a /goal prompt into the project's Documents/Goals and starts it with the goal tool; supports multiple goals and forbids coding PLAN records.
---

# Blender Project Goal

Every design request starts a session goal before building or editing the scene. The only exception
is a pure read-only question that produces no files or scene changes.

## Steps

1. Read `AGENTS.md`, the project `README.md`, `Documents/ASSETS.md`, `Documents/DECISIONS.md`, and
   the existing goals.
2. Choose the next goal file: `Blender/<Project>/Documents/Goals/NN-<slug>.md`. Never overwrite an
   earlier goal.
3. Start from `blender-project-scaffold/templates/project/Documents/Goals/01-project-brief.md` and
   fill every section.
4. Call `goal(action="start", objective=<the full prompt text>)` immediately. Writing the file
   without starting the goal is incomplete.
5. If resuming existing work, call `goal(action="resume")` instead of creating a duplicate goal.

## Required goal content

- Mission in the user's own words.
- Project name and links to README, assets, decisions, references.
- Visual outcome: subject, composition, camera, lighting, materials, colour, scale, mood.
- Scope: in, out, and external dependencies.
- Deliverables: scene, review render, exports, documents.
- Acceptance checks that can be seen in a render or read from a file.
- Workflow: launch Blender from the workspace root, verify the open file, inspect with `look`, save
  and render, update docs. Only one Blender project from this workspace may be active at a time.
- Done: no completion without the review artifact and current documentation.

## Rules

- This is a design goal, not a coding plan. Do not create `PLAN/` or plan-check/verifier records.
- Multiple goals per project are allowed; one file per goal.
- Never claim completion without a review render or screenshot inspected with `look`.
- Pass the user's exact words in the Mission and in `user_prompt` for Blender MCP calls.
- Keep external asset references pointed at `Documents/ASSETS.md`.
- Update the README, `DECISIONS.md`, and `ASSETS.md` before `goal_report complete`.
