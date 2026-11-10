# Goal: Initial Brief (2026-11-11)

Read `../../../../AGENTS.md` and the matching skills before acting. This is a design goal, not a coding plan. Do not create `PLAN/` or verifier records.

## Mission

make realistic laundromat

## Project

Urban Laundromat — Gritty realistic urban laundromat interior with glass storefront

- README: `../../README.md`
- Requirements: `../REQUIREMENTS.md`
- Workflow: `../WORKFLOW.md`
- Review: `../REVIEW.md`
- Assets: `../ASSETS.md`
- Decisions: `../DECISIONS.md`
- References: `../References/README.md`

## Visual outcome

A realistic, gritty urban laundromat interior at dusk, approximately 8 m wide x 12 m deep with a 3 m ceiling, metric scale. An aluminum-framed glass storefront and glass street door span the front, with sidewalk and street visible beyond. Two aligned banks of front-load washers and dryers, folding tables, a laundry cart, plastic baskets, a vending/soap machine, wall signage and price board, bench, and trash bin fill the room. Surfaces are worn: scuffed linoleum with grout lines, aged paint, chipped enamel, varied machine colors and roughness. Warm-white fluorescent tube fixtures light the interior while cool blue dusk and street light spill through the glass. The hero camera sits at about 1.65 m, angled three-quarters down the aisle with a 24-28 mm equivalent lens in 16:9, showing storefront and machine rows. Realism comes only from geometry, flat-color materials, roughness/metallic variation, and modeled lighting; no image textures, HDRIs, or external assets. The inspected sealed hero render is the primary proof image.

## Scope

- In scope: one interior scene; storefront glass and door; at least 8 washers, 6 dryers, 2 folding tables, cart, 2+ baskets, vending/soap machine, signage/price board, bench, trash bin; worn materials; fluorescent plus dusk lighting; hero and 3 detail stills; .blend and GLB delivery; project documents.
- Out of scope: image textures, HDRIs, downloaded or generated image assets, project scripts, animation, rigging, simulation, geometry nodes, volumetrics, people, readable brand logos, and street detail beyond what is visible through the glass.
- External dependencies: none. Everything is modeled from primitives and custom meshes through reviewed operations.

## Deliverables

- [ ] Scene saved as `urban-laundromat.blend` in the project root.
- [ ] 1920x1080 hero PNG and three detail PNGs in `renders/final/`.
- [ ] `exports/urban-laundromat.glb` with a verified harness export receipt.
- [ ] README, requirements, workflow, review, decisions, and assets current.
- [ ] Single visual review rounds completed and committed with a final PASS.

## Acceptance

- [ ] Scene opens without missing external files.
- [ ] Interior, storefront, machine inventory, and worn gritty look match the confirmed brief.
- [ ] Machines are aligned with readable doors, drums, and control panels; no floating or intersecting props.
- [ ] Fluorescent interior and cool dusk street light read clearly; no unlit black zones.
- [ ] Hero framing is eye-level three-quarter aisle, 16:9, and the three detail stills are present.
- [ ] Metric scale is consistent and documented.
- [ ] Sealed review render exists and was inspected with `look`.
- [ ] GLB export receipt verifies the exported file.
- [ ] README reflects the delivered state.
- [ ] Final applicable review is `PASS`.
- [ ] No genuine unresolved blocker or major remains.

## Workflow

- Workflow mode: Fully Autonomous.
- Review mode: Single, grader `visual`.
- Registered graders: visual only; technical and spec graders are configured but not selected.
- 1. Confirm requirements, collect modes, scaffold, fill records, bootstrap-commit, prepare, answer registration, start `/goal-blender`.
- 2. Inspect `blender_workflow` `status` and follow `nextStep` for every lifecycle action.
- 3. Launch and stop only through `blender_workflow`. Save the first scene through a bounded `begin` and ticketed `save`; commit and checkpoint without sealing the bootstrap save.
- 4. For every reviewable change: apply tickets through `blender-worker`, WIP render every three applies, seal, inspect the sealed render with `blender_look`, complete Single visual review, commit, and checkpoint.
- 5. Keep project documents current inside the change that changes them. Commit through the harness.
- 6. Complete final review, inspect the final sealed render, verify the GLB receipt, and call `goal_blender {action:"complete", evidence:<evidence>}` only after every acceptance check passes.

## Done

All acceptance checks pass; records are current; the scene and inspected sealed render are saved; no external asset is used; the final Single visual review is PASS with no unresolved blocker or major; the GLB receipt is valid; and `checkpoint` is clean.
