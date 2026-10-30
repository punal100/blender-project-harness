# Goal: {{GOAL_TITLE}} ({{DATE}})

Read `../../../../AGENTS.md` first and obey it. Read `blender-project-goal`,
`blender-project-requirements`, `blender-project-workflow`, `blender-project-readme`, and
`blender-assets` when relevant. This is a design goal, not a coding plan: do not create a `PLAN/`
folder and do not use coding plan/check/verifier gates.

## Mission

{{GOAL}}

## Project

{{PROJECT_NAME}} — {{DESCRIPTION}}

- Project README: `../../README.md`
- Confirmed requirements: `../REQUIREMENTS.md`
- Workflow mode: `../WORKFLOW.md`
- Asset register: `../ASSETS.md`
- Decisions: `../DECISIONS.md`
- References: `../References/README.md`

## Visual outcome

Describe the result the viewer should see: subject, composition, camera, lighting, materials,
colour, scale, and mood. Name the review image or render that will prove it.

## Scope

- In scope:
- Out of scope:
- External dependencies:

## Deliverables

- [ ] Updated scene saved as `{{PROJECT_SLUG}}.blend` in the project root.
- [ ] Review render in `renders/final/`.
- [ ] README and `DECISIONS.md` updated.
- [ ] External assets registered in `ASSETS.md`.

## Acceptance

- [ ] The scene opens without missing external files.
- [ ] The camera framing and visual direction match the brief.
- [ ] Materials, lighting, and scale are deliberate and documented.
- [ ] A review render exists and has been inspected with `look`.
- [ ] The README reflects the delivered state.

## Workflow

1. Start this goal only after requirements are confirmed, the workflow mode is recorded, and every
   open question is answered. Call `goal(action="start", objective=<this entire filled prompt>)`; a
   one-line summary is not an objective. A successful goal call ends the turn; continue when the goal
   resumes. Do not repeat start/resume on automatic goal turns or after compaction.
2. Read the README, `REQUIREMENTS.md`, `WORKFLOW.md`, asset register, decisions, and references.
3. Stop if requirements are unconfirmed or the workflow mode is `Unset`; resolve both before editing.
4. From the workspace root, launch this project with
   `.\tools\start-blender.cmd "Blender\{{PROJECT_NAME}}"`. The launcher validates project records,
   path containment, the workspace port, and one-instance rules.
5. Call `blender_get_addon_status`; verify `blender_get_scene_info(fields=["settings"])` reports
   this project's `.blend` before editing.
6. Build in small steps. Save the authoritative `.blend` after every meaningful scene change and
   before risky work or handoff. Inspect every scene, material, lighting, and camera change with `look`.
7. In Partially Autonomous mode, save, inspect, and ask for approval via `question` after every
   meaningful change. Kilo removes `question` during an active goal: ask the user to run `/goal pause`,
   ask, wait for the answer, then resume with `goal(action="resume")`. If the user modifies the scene
   manually, wait, inspect, and confirm afterward.
8. Save, render a review image, and inspect it before calling the goal complete.
9. Update README, `REQUIREMENTS.md`, `WORKFLOW.md`, `DECISIONS.md`, and `ASSETS.md`. Review git changes
   at milestones and commit atomically after each verified change: one logical change per commit. Once
   acceptance passes, call `goal_report(status="complete", reason=<evidence>)`, then give the final
   response without further actions.

## Done

The goal is complete only when acceptance checks pass, requirements and workflow are current, the
scene and review render are saved, no external asset is missing or unregistered, and the documents
are current.
