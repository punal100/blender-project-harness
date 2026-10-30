# Goal: {{GOAL_TITLE}} ({{DATE}})

Read `../../../../AGENTS.md` first and obey it. Load `blender-project-goal`, `blender-project-readme`,
and `blender-assets` when relevant. This is a design goal, not a coding plan: do not create a
`PLAN/` folder and do not use coding plan/check/verifier gates.

## Mission

{{GOAL}}

## Project

{{PROJECT_NAME}} — {{DESCRIPTION}}

- Project README: `../../README.md`
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

1. Call `goal(action="start", objective=<this prompt>)`.
2. Read the README, asset register, decisions, and references.
3. From the workspace root, launch this project with
   `.\tools\start-blender.cmd Blender\{{PROJECT_NAME}}`. Only one Blender instance from this workspace may
   be open at a time.
4. Call `blender_get_addon_status`; verify `blender_get_scene_info(fields=["settings"])` reports
   this project's `.blend` before editing.
5. Build in small steps. Verify each material, lighting, and camera change with `look`.
6. Save, render a review image, and inspect it before calling the goal complete.
7. Update README, `DECISIONS.md`, and `ASSETS.md`; then call `goal_report complete`.

## Done

The goal is complete only when the acceptance checks pass, the scene and review render are saved,
the documents are current, and no external asset is missing or unregistered.
