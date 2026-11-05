# Goal: Initial Brief (2026-11-05)

Read `../../../../AGENTS.md` and the matching skills before acting. This is a design goal, not a coding plan. Do not create `PLAN/` or verifier records.

## Mission

make realistic cozy laundromat

## Project

CozyLaundromat — Realistic cozy neighborhood laundromat interior at evening

- README: `../../README.md`
- Requirements: `../REQUIREMENTS.md`
- Workflow: `../WORKFLOW.md`
- Review: `../REVIEW.md`
- Assets: `../ASSETS.md`
- Decisions: `../DECISIONS.md`
- References: `../References/README.md`

## Visual outcome

A wide eye-level interior render of a small neighborhood laundromat in the evening. The camera sits at about 1.6 m with a 35-50 mm equivalent view, framing at least six front-loading washers with visible doors and drums, a folding counter, a waiting nook with seating, a window with an evening exterior glimpse, and lived-in props such as wire baskets, detergent bottles, a noticeboard, and a potted plant. The room is about 6 x 5 m with a 2.8 m ceiling; machines are about 0.85 m tall and the counter about 0.9 m. Lighting is warm tungsten with amber practicals and soft shadows; the palette is cream, amber, and muted teal with no blown-out whites. Materials read as painted wall, stainless and white appliance fronts, tinted low-roughness glass, worn tile or linoleum, wood counter, and fabric seating. The mood is quiet, safe, and lived-in. The sealed camera PNG is the review image that proves the result.

## Scope

- In scope: one interior scene, room shell and window, at least six front-loading machines, counter and props, waiting nook, warm practical lighting, one hero camera, materials and colour, one sealed hero render, project documentation.
- Out of scope: animation, simulation, people, full exterior street, downloaded or user-supplied third-party assets, project Python scripts, GLB or other exports.
- External dependencies: one generated reference image after registration; optional generated textures only after intake; no third-party assets planned.

## Deliverables

- [ ] Scene saved as `cozylaundromat.blend` in the project root.
- [ ] Inspected review render in `renders/final/`.
- [ ] README, requirements, workflow, review, decisions, and assets updated.
- [ ] Required review rounds completed and committed.

## Acceptance

- [ ] Scene opens without missing external files.
- [ ] Visual direction and camera framing match the confirmed brief.
- [ ] Materials, lighting, and scale are deliberate and documented.
- [ ] Sealed review render exists and was inspected with `look`.
- [ ] README reflects the delivered state.
- [ ] Final applicable review is `PASS` and no genuine blocker or major remains.
- [ ] No project scripts, unregistered assets, or unsupported operations are used.

## Workflow

1. Read `blender-project-goal` and `blender-workflow-harness`. Before this mission: confirm requirements, collect workflow and review answers, scaffold, fill all records through `bootstrap-document`, commit with `bootstrap-commit`, call `prepare`, answer its exact question, then start `/goal-blender` with this filled goal.
2. Inspect `blender_workflow` `status` and follow `nextStep` for every lifecycle action.
3. Launch and stop only through `blender_workflow`. Save the first scene through a bounded `begin` and ticketed `save`; commit and checkpoint without sealing the bootstrap save.
4. For every reviewable change: apply tickets from `blender-worker`, `seal`, inspect the returned render with `blender_look`, complete all configured grading, obtain approval in Partially Autonomous mode, `commit`, and `checkpoint`.
5. Keep project documents current inside the change that changes them. Create new markdown through `bootstrap-document` or `document`; commit through the harness.
6. Complete final grading, inspect the final sealed render, and call `goal_blender {action:"complete",evidence:<evidence>}` only after every acceptance check passes.

Autonomy: Partially Autonomous. Review mode: All, with configured graders `visual`, `technical`, and `spec`. Each reviewable change requires grading and approval before commit, within `max_rounds` 2.

## Done

All acceptance checks pass; records are current; the scene and inspected review render are saved; no external asset is missing or unregistered; the final applicable review is `PASS` and no genuine blocker or major remains; and `checkpoint` is clean.
