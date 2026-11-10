# Requirements — Laundromat

Status: Confirmed
Defined: 2026-11-10
Last updated: 2026-11-10
Confirmed: 2026-11-10
Confirmation: "Confirm requirements" (runtime answer, 2026-11-10). Scope: interior-only realistic laundromat with lived-in evening realism, all geometry and materials modeled in-scene, 1920x1080 PNG hero render plus verified GLB export, Fully Autonomous workflow, Single review grader (visual), no reference images, source-only scripts permitted.

## Core value

A believable, lived-in laundromat interior at evening, presented as a single photorealistic hero render and a clean, verified GLB export.

## Confirmed requirements

### Purpose and audience

- REQ-01: The deliverable is a single interior laundromat scene approximately 10 m wide, 7 m deep, and 3.2 m high, with 1 Blender unit equal to 1 m. The front glazing shows a dark evening street beyond; no exterior facade is modeled.
- REQ-02: The equipment layout must read immediately as a laundromat: at least 10 front-load washing machines in one row against a wall and at least 6 dryers (stacked in pairs) opposite, each with a visible door, drum, control panel, and coin/card slot details.

### Visual outcome

- REQ-03: Furnishings and fixtures include at least two folding tables, bench or plastic-chair seating, laundry carts, trash bins, a detergent vending machine, and a change machine.
- REQ-04: Readable signage includes a main wall sign reading "LAUNDROMAT", an hours sign, machine instruction labels, and at least one posted notice.
- REQ-05: Architecture includes tiled floor, painted walls, a drop ceiling with recessed fluorescent fixtures, window frames, baseboards, and a visible entrance area.
- REQ-06: Lived-in detail includes detergent bottles, at least one laundry basket containing clothes, loose notices, and subtle wear such as scuffed floor tiles or aged wall paint.
- REQ-07: Evening lighting combines warm fluorescent interior light, cool dusk spill through the front windows, and small emissive accents on machines or the vending machine; exposure is balanced so both machine rows remain readable.
- REQ-08: Materials use deliberate base colour, roughness, metallic, emission, transmission, IOR, and alpha variation to approximate painted metal, stainless steel, glass, plastic, ceramic tile, paper, and fabric. No procedural bump or noise nodes are required.
- REQ-09: The camera is an eye-level three-quarter interior view from near the entrance, framing both machine rows, the folding area, and the room depth at a 16:9 aspect ratio.

### Scope and delivery

- REQ-10: The hero render is a 1920x1080 PNG saved under `renders/final/` and inspected with `blender_look` before completion.
- REQ-11: A GLB export of the scene is saved under `exports/` and recorded with a harness-verified export receipt; scene scale remains 1 unit = 1 m.
- REQ-12: The scene is a single saved `.blend` with clearly named objects and collections, no missing external files, and no linked or packed external assets.
- REQ-13: Project records stay current: README, requirements, workflow, review, assets, decisions, and the active goal. Scripts, if present, are source-only under `scripts/` and are never executed by the harness.

## Constraints

- Blender version: the workspace Blender instance launched through `blender_workflow`; exact version recorded at launch.
- File format / resolution: `.blend`; hero PNG at 1920x1080 (16:9); GLB export.
- Performance / delivery limits: single scene, one Blender instance, one writer; no external dependencies or runtime scripts.
- External assets: none. All geometry and materials are created in-scene from supported operations.
- Reference images / links: none (runtime reference answer "None", 2026-11-10).

## Deferred

- Additional interior camera angles or detail shots beyond the single hero render.
- Extra laundry props and signage beyond what the hero angle and requirements call for.
- Exterior facade detailing; only the dark evening view through the glazing is represented.

## Out of scope

- Exterior street and building modeling, because the brief is interior-only.
- People or characters in the scene.
- Animation, cloth or fluid simulation, and audio.
- Executable project scripts; only source-only scripts under `scripts/` are permitted.
- External assets, image textures, HDRIs, or downloaded content.

## Open questions

- None.

## Research notes

| Date | Question | Finding | Source | Effect |
|---|---|---|---|---|
| 2026-11-10 | Reference sourcing | User selected `None` for reference images or links. | Runtime reference answer | No external references are required; design follows the confirmed brief. |

## Change log

| Date | Change | Source | Confirmed by |
|---|---|---|---|
| 2026-11-10 | Initial draft created from the user request. | make realistic laundromat | Pending |
| 2026-11-10 | Requirements confirmed, including reference answer `None`, Fully Autonomous workflow, and Single visual review. | Runtime question answers | User: "Confirm requirements" |
