# Goal: Initial Brief (2026-11-10)

Read `../../../../AGENTS.md` and the matching skills before acting. This is a design goal, not a coding plan. Do not create `PLAN/` or verifier records.

## Mission

make realistic laundromat

## Project

Laundromat — Realistic lived-in laundromat interior at evening

- README: `../../README.md`
- Requirements: `../REQUIREMENTS.md`
- Workflow: `../WORKFLOW.md`
- Review: `../REVIEW.md`
- Assets: `../ASSETS.md`
- Decisions: `../DECISIONS.md`
- References: `../References/README.md`

## Visual outcome

A single photorealistic interior image of a lived-in neighborhood laundromat at evening. The room is about 10 x 7 x 3.2 m with tiled floor, painted walls, drop ceiling with recessed fluorescent fixtures, and front glazing showing a dark evening street. At least 10 front-load washers line one wall and at least 6 dryers in stacked pairs line the opposite wall. Folding tables, plastic seating, carts, bins, detergent vending, and a change machine fill the middle. A readable "LAUNDROMAT" sign, hours sign, machine labels, and posted notices establish the place. Detergent bottles, a basket of clothes, and subtle wear make it feel used. Warm fluorescent interior light mixes with cool dusk spill and small emissive accents; exposure keeps both machine rows readable. Materials approximate painted metal, stainless steel, glass, plastic, ceramic tile, paper, and fabric through colour, roughness, metallic, emission, transmission, IOR, and alpha variation. The eye-level three-quarter camera from near the entrance frames both rows and the room depth in 16:9. The review image is the 1920x1080 sealed hero render.

## Scope

- In scope: one interior laundromat room; washers and dryers; folding and seating areas; carts, bins, vending and change machines; signage and notices; lived-in props and wear; full lighting and camera setup; 1920x1080 hero render; verified GLB export; current project records.
- Out of scope: exterior facade or street modeling beyond the dark view through the glazing; people; animation, simulation, or audio; external assets, textures, or HDRIs; executable scripts.
- External dependencies: none. Reference answer is `None`; all geometry and materials are built in-scene.

## Deliverables

- [ ] Scene saved as `laundromat.blend` in the project root.
- [ ] Hero render `renders/final/laundromat-hero-1920x1080.png`, inspected with `blender_look`.
- [ ] Verified GLB export under `exports/`.
- [ ] README, requirements, workflow, review, assets, and decisions current.
- [ ] Required review rounds completed and committed.

## Acceptance

- [ ] REQ-01: Single interior room about 10 x 7 x 3.2 m, 1 unit = 1 m, with glazing onto a dark evening street and no exterior facade.
- [ ] REQ-02: At least 10 front-load washers in one row and at least 6 dryers in stacked pairs opposite, each with recognizable door, drum, controls, and payment detail.
- [ ] REQ-03: Two folding tables, bench or chair seating, carts, bins, detergent vending machine, and change machine are present.
- [ ] REQ-04: "LAUNDROMAT" signage, hours sign, machine labels, and at least one notice are readable.
- [ ] REQ-05: Tiled floor, painted walls, drop ceiling with fluorescent fixtures, window frames, baseboards, and entrance are present.
- [ ] REQ-06: Lived-in props and wear are visible, including detergent bottles and a laundry basket with clothes.
- [ ] REQ-07: Warm interior light, cool dusk spill, and emissive accents produce a balanced evening exposure.
- [ ] REQ-08: Material variation is deliberate across metal, steel, glass, plastic, tile, paper, and fabric.
- [ ] REQ-09: Eye-level three-quarter camera frames both machine rows and room depth at 16:9.
- [ ] REQ-10: 1920x1080 PNG hero render exists and was inspected.
- [ ] REQ-11: GLB export exists with a harness-verified receipt; scale is 1 unit = 1 m.
- [ ] REQ-12: Single clean `.blend` with named objects and no missing or external files.
- [ ] REQ-13: Records current; any scripts are source-only and unexecuted.
- [ ] Sealed review render exists and was inspected with `look`.
- [ ] Final applicable review is `PASS` from the `visual` grader, or `Off` self-review is recorded.
- [ ] No genuine unresolved blocker or major remains.

## Workflow

1. Read `blender-project-goal` and `blender-workflow-harness`. Before this mission: confirm requirements, collect workflow and review answers, scaffold, fill all records through `bootstrap-document`, commit with `bootstrap-commit`, call `prepare`, answer its exact question, then start `/goal-blender` with this filled goal.
2. Inspect `blender_workflow` `status` and follow `nextStep` for every lifecycle action.
3. Launch and stop only through `blender_workflow`. Save the first scene through a bounded `begin` and ticketed `save`; commit and checkpoint without sealing the bootstrap save.
4. For every reviewable change: apply tickets from `blender-worker`, WIP-inspect every three applies and before seal, `seal`, inspect the returned render with `blender_look`, complete `visual` grader review, `commit`, and `checkpoint`.
5. Keep project documents current inside the change that changes them. Create new markdown through `bootstrap-document` or `document`; commit through the harness.
6. Complete final grading, inspect the final sealed render, and call `goal_blender {action:"complete", evidence:<evidence>}` only after every acceptance check passes.

Autonomy: Fully Autonomous. Review: Single grader `visual`. Configured graders available: `visual`, `technical`, `spec`; only `visual` is assigned. Maximum review rounds: 2.

## Done

All acceptance checks pass; records are current; the scene and inspected review render are saved; no external asset is missing or unregistered; the final applicable review is `PASS` from the `visual` grader; the GLB export has a verified receipt; and `checkpoint` is clean.
