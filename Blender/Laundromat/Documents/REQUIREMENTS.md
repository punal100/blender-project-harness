# Requirements — Laundromat

Status: Confirmed
Defined: 2026-11-10
Last updated: 2026-11-10
Confirmed: 2026-11-10
Confirmation: User confirmed the brief on 2026-11-10 with: American coin laundromat; interior only; blend + hero render; aisle view from entrance; references None; model everything with no external assets or generated media; no scripts.

## Core value

A believable American coin laundromat interior that reads as a real neighborhood business, delivered as one hero still from the entrance aisle.

## Confirmed requirements

### Purpose and audience

- REQ-01: The deliverable is a realistic American coin laundromat interior, interior only, at real-world metric scale in a room about 8 m wide x 12 m deep with a 2.9 m ceiling. No storefront exterior is modeled.
- REQ-02: The scene targets a portfolio or cinematic environment audience; it must read as a specific, lived-in laundromat rather than a generic room.

### Visual outcome

- REQ-03: Two facing rows of front-loading laundry machines run along the left and right sides of a central aisle, with at least 10 machines total (washers and dryers). Each machine has a body, a coin/control panel, a round glass door, and a visible drum rim.
- REQ-04: The room contains folding tables, bench or plastic seating, at least one soap/change vending machine, wall signage, a wall clock, and trash bins, plus a tiled floor grid and a drop ceiling with fluorescent light panels.
- REQ-05: Materials are physically plausible and simple: painted metal, stainless steel, glass, glazed tile, matte wall paint, and vinyl floor, using base color, roughness, metallic, transmission, IOR, and alpha only. No bump, procedural noise, displacement, or texture maps.
- REQ-06: Lighting combines warm-white fluorescent ceiling panels with cooler daylight spill from the storefront entrance behind the camera, producing readable brightness and clear depth down the aisle without blown highlights.
- REQ-07: Hero camera at eye height (about 1.6 m) at the entrance, 35-50 mm equivalent, looking straight down the aisle in correct one-point perspective. The hero render is 1920x1080.
- REQ-08: Colour direction: off-white walls, teal or sage machine faces, stainless steel trim, warm grey floor, restrained small-business wear. No people or loose clothing props.

### Scope and delivery

- REQ-09: Deliver `laundromat.blend` saved at the project root and one hero PNG render in `renders/final/`.
- REQ-10: README, requirements, workflow, review, assets, and decisions records reflect the delivered state.

## Constraints

- Blender version: Blender 5.2 through the harness (verify the live version at launch).
- File format / resolution: `.blend` scene; hero PNG at 1920x1080.
- Performance / delivery limits: one interior scene; no external assets; simple materials only; no bump, procedural noise, displacement, geometry nodes, rigging, or animation.
- External assets: none; every prop and surface is modeled from reviewed primitives and simple materials.
- Reference images / links: none

## Deferred

- Storefront exterior facade, signage, and street.
- Additional render angles, a 4K still, or a turntable.
- glTF or FBX exports.
- People, customers, and loose clothing props.
- Procedural wear textures or decals.

## Out of scope

- Exterior or street scene: the user chose interior only.
- Characters and animation: unsupported by the confirmed operation set and not requested.
- Bump, procedural noise, and image textures: unsupported by the material operation.
- Downloaded or generated assets and paid media: the user chose to model everything.

## Open questions

- None.

## Research notes

| Date | Question | Finding | Source | Effect |
|---|---|---|---|---|
| 2026-11-10 | Reference sourcing | User answered `None` to the runtime reference question; no files or links to intake. | User answer (HARNESS REFERENCE e6a79e3c-4aaa-4eaa-b307-12634b291703) | Scene built from general laundromat knowledge; no reference assets. |
| 2026-11-10 | Material realism within the harness | Reviewed materials support color, roughness, metallic, emission, transmission, IOR, and alpha only; bump and procedural detail are unavailable. | `blender_workflow` capabilities | Realism relies on geometry, layout, and lighting; no texture-detail requirement. |

## Change log

| Date | Change | Source | Confirmed by |
|---|---|---|---|
| 2026-11-10 | Initial draft created. | make realistic laundromat | Pending |
| 2026-11-10 | Requirements confirmed from the chat discussion and question answers. | User answers | User confirmed brief |
