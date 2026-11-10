# Requirements — Urban Laundromat

Status: Confirmed
Defined: 2026-11-11
Last updated: 2026-11-11
Confirmed: 2026-11-11
Confirmation: User selected "Confirm requirements" after reviewing the draft brief: interior + glass storefront, gritty urban style, hero plus detail stills, no external images, no scripts, PNG + .blend + GLB, Fully Autonomous workflow, Single visual review.

Confirmed requirements are the source of truth. Add or change them only after explicit user confirmation.

## Core value

A gritty, realistic urban laundromat interior at dusk, readable at a glance as a working neighborhood laundry: aluminum-framed storefront glass, rows of front-load washers and dryers, folding tables, carts and baskets, worn surfaces, and mixed fluorescent and street lighting. Built entirely from modeled geometry and flat-color materials without image textures or external assets.

## Confirmed requirements

### Purpose and audience

- [ ] REQ-01: Deliver a standalone, realistic urban laundromat interior suitable as a portfolio-style still visualization, immediately recognizable as a working laundromat.

### Visual outcome

- [ ] REQ-02: Interior approximately 8 m wide x 12 m deep with a 3 m ceiling, modeled at metric scale (1 Blender unit = 1 m), with an aluminum-framed glass storefront and glass street door across the front and sidewalk/street visible beyond.
- [ ] REQ-03: Include at least 8 front-load washers, 6 dryers (stacked pairs allowed), 2 folding tables, 1 laundry cart, at least 2 plastic baskets, a vending/soap machine, wall signage and a price board, a bench, and a trash bin. Machines must be aligned in rows with readable doors, drums, and control panels.
- [ ] REQ-04: Gritty worn look: scuffed linoleum with grout lines, aged painted walls, worn table and counter edges, varied machine colors and roughness, and believable clutter.
- [ ] REQ-05: Lighting: overhead fluorescent tube fixtures (warm white) plus cool dusk/street spill through the storefront; no unlit black zones; warm interior contrasted against cool exterior.
- [ ] REQ-06: Hero camera at eye level (~1.65 m), slight three-quarter angle down the aisle, wide lens (24-28 mm equivalent), 16:9 composition showing both the storefront and the machine rows.
- [ ] REQ-07: Detail stills: (a) washer bank close-up, (b) folding table with baskets and soap machine, (c) storefront/street angle from inside.

### Scope and delivery

- [ ] REQ-08: Produce a 1920x1080 PNG hero render and 3 detail PNG renders in renders/final/.
- [ ] REQ-09: Save the scene as urban-laundromat.blend at the project root and export GLB to exports/urban-laundromat.glb with a verified harness export receipt.
- [ ] REQ-10: Use no external images, HDRIs, texture maps, or project scripts; realism must come from geometry, flat-color materials with roughness/metallic variation, and modeled lights.
- [ ] REQ-11: No animation, volumetrics, geometry nodes, simulation, or rigging.
- [ ] REQ-12: README, ASSETS, and DECISIONS stay current; the final sealed render is inspected; the Single visual grader returns PASS.

## Constraints

- Blender version: workspace-managed Blender through the MCP harness.
- File format / resolution: .blend scene; PNG 1920x1080; GLB export.
- Performance / delivery limits: one scene; EEVEE render path; no volumetrics; harness limits of 20 objects and 20 applies per bounded change.
- External assets: none. No downloaded, generated, or supplied images, HDRIs, textures, models, or audio.
- Reference images / links: none
- Units: metric; 1 unit = 1 m.
- Materials: flat-color base color, roughness, metallic, emission, transmission, IOR, and alpha only; no bump or procedural texture support.

## Deferred

- Camera animation or turntable render.
- Detailed street life, vehicles, or buildings beyond what is visible through the storefront.
- Volumetric haze, steam, or dust.
- Human characters or readable brand logos.

## Out of scope

- Image-based textures, HDRIs, or downloaded assets; the user chose no external images, so realism is geometry and material based.
- Project Python scripts; the harness never executes them and none are needed.
- Animation, simulation, rigging, geometry nodes, and volumetrics; unsupported by the reviewed operation set.

## Open questions

- None.

## Research notes

| Date | Question | Finding | Source | Effect |
|---|---|---|---|---|
| 2026-11-11 | How to achieve realism without image textures | Materials support base color, roughness, metallic, emission, transmission, IOR, and alpha but not bump or procedural noise; realism must come from geometry, roughness/metallic variation, and lighting. | Harness capabilities | REQ-10 constrains realism approach; detail is modeled rather than textured. |

## Change log

| Date | Change | Source | Confirmed by |
|---|---|---|---|
| 2026-11-11 | Initial draft created. | make realistic laundromat | Pending |
| 2026-11-11 | Requirements confirmed and filled with scope, constraints, and acceptance. | make realistic laundromat | User selected "Confirm requirements" |
