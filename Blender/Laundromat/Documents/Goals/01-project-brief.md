# Goal: Initial Brief (2026-11-10)

This is a design goal, not a coding plan. Do not create `PLAN/` or verifier records.

## Mission

make realistic laundromat

## Project

Laundromat — Realistic American coin laundromat interior with a hero aisle camera.

- README: `../../README.md`
- Requirements: `../REQUIREMENTS.md`
- Workflow: `../WORKFLOW.md`
- Review: `../REVIEW.md`
- Assets: `../ASSETS.md`
- Decisions: `../DECISIONS.md`
- References: `../References/README.md`

## Visual outcome

A realistic interior-only American coin laundromat, about 8 x 12 m with a 2.9 m ceiling. Two facing rows of front-loading washers and dryers with coin panels, round glass doors, and stainless drum rims flank a central aisle. Folding tables, plastic bench seating, soap/change vending, wall signage, a clock, and trash bins fill the room; the floor is a light tile grid and the ceiling is a drop grid with fluorescent panels. Materials are simple but physically plausible: painted metal, stainless steel, glass, glazed tile, matte paint, and vinyl. Lighting mixes warm-white ceiling fluorescents with cool daylight spilling from the storefront entrance behind the camera. The hero camera sits at eye height (~1.6 m) at the entrance, 35-50 mm equivalent, looking straight down the aisle in one-point perspective.

## Scope

- In scope: one interior room; 10 or more front-loading machines with door and panel detail; tables, seating, vending, signage, clock, bins; tile floor; drop ceiling with light panels; fluorescent and daylight lighting; hero camera; one 1920x1080 render; project records.
- Out of scope: storefront exterior, street, people, loose clothing, animation, turntable, 4K still, glTF/FBX exports, bump/procedural textures, external or generated assets.
- External dependencies: none.

## Deliverables

- [ ] Scene saved as `laundromat.blend` in the project root.
- [ ] Inspected hero render in `renders/final/` at 1920x1080.
- [ ] README, requirements, workflow, review, decisions, and assets updated.
- [ ] Required review rounds completed and committed.

## Acceptance

- [ ] REQ-01: Interior-only room at about 8 x 12 m with a 2.9 m ceiling; no exterior visible.
- [ ] REQ-03: At least 10 front-loading machines in two facing rows, each with body, coin panel, round glass door, and drum rim.
- [ ] REQ-04: Folding tables, seating, vending, signage, clock, trash bins, tiled floor, and drop ceiling with fluorescent panels are present.
- [ ] REQ-05: Materials use only simple physically plausible parameters; no missing or broken materials.
- [ ] REQ-06: Warm fluorescent plus cool daylight lighting reads clearly down the aisle.
- [ ] REQ-07: Hero camera at eye height at the entrance, straight down the aisle, 1920x1080 render delivered.
- [ ] Scene opens without missing external files.
- [ ] Sealed review render exists and was inspected with `look`; final applicable review is `PASS` with no genuine unresolved blocker or major.
- [ ] README reflects the delivered state.

## Workflow

- Mode: Fully Autonomous.
- Review: `Single`, configured grader `visual` (composition, camera, lighting, colour, materials, mood).
- Every reviewable change: begin, apply tickets through one `blender-worker`, WIP check every three applies, finalize, seal, inspect the sealed render, complete the visual review with dispositions, commit, checkpoint.
- Launch and stop only through `blender_workflow`; never invoke Blender from the shell.
- Save the first scene through a bounded `begin` and ticketed `save`; commit and checkpoint without sealing the bootstrap save.
- Keep project documents current inside the change that changes them.
- Complete final grading, inspect the final sealed render, and call `goal_blender {action:"complete",evidence:<evidence>}` only after every acceptance check passes.

## Done

All acceptance checks pass; records are current; the scene and inspected hero render are saved; requirements are satisfied; the final applicable review is `PASS` with no genuine unresolved blocker or major; and `checkpoint` is clean.
