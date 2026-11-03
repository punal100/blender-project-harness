# Requirements — CozyDeskRoom

Status: Confirmed
Defined: 2026-11-03
Last updated: 2026-11-03
Confirmed: 2026-11-03
Confirmation: User selected "Confirm requirements" for the drafted brief: warm evening lamp light; fully dressed desk corner; three-quarter desk view; Fully Autonomous; All graders.

## Core value

A cozy, warm evening study corner with a believable computer workstation that reads clearly as one inviting room.

## Confirmed requirements

### Purpose and audience

- [x] REQ-01: Deliver a single hero view of a warm, lived-in study corner containing a desk, chair, computer tower, monitor, keyboard, mouse, desk lamp, window, wall shelf, rug, potted plant, and small desk decor.

### Visual outcome

- [x] REQ-02: Use warm golden practical lamp light, a cool twilight window fill, soft shadows, and deep but readable contrast to create a cozy evening mood.
- [x] REQ-03: Use warm wood, soft fabric, painted plaster, dark metal, and emissive screen/lamp materials with a restrained warm palette plus cool twilight accents.
- [x] REQ-04: Frame the desk from a three-quarter view at standing/eye height, with the desk as the main subject and the window and room behind it.

### Scope and delivery

- [x] REQ-05: Build geometry only from Blender primitives and simple Principled materials; do not use external models, textures, HDRIs, or downloaded assets.
- [x] REQ-06: Keep human-scale proportions in a roughly 3.6 × 3.6 × 2.7 m room with grounded, non-intersecting furniture.
- [x] REQ-07: Save the scene as `cozydeskroom.blend` at the project root and render one 1920×1080 PNG hero image to `renders/final/`.
- [x] REQ-08: Keep README, requirements, workflow, review, assets, and decisions current; complete the configured review with no unresolved blocker or major finding.

## Constraints

- Blender version: confirmed at launch through the MCP addon; do not assume a version-specific API.
- File format / resolution: `.blend` project file; 1920×1080 PNG render; EEVEE-compatible simple materials.
- Performance / delivery limits: primitives only; one hero camera; no animation or simulation.
- External assets: none; no models, textures, HDRIs, fonts, or references are embedded or linked.

## Deferred

- Additional camera angles or turntable views.
- Animation or interactive elements.
- Text objects, custom fonts, or book titles.
- External PBR materials and HDRI lighting.

## Out of scope

- Whole apartment or other rooms.
- Bed, sofa, wardrobe, or larger architectural layout.
- Characters or creatures.
- Downloaded or generated 3D models and image textures.
- Physics, animation, and game-engine export.

## Open questions

- None. Requirements are confirmed.

## Research notes

| Date | Question | Finding | Source | Effect |
|---|---|---|---|---|
| 2026-11-03 | Primitive-only feasibility | The harness supports cube, plane, cylinder, and UV-sphere meshes; transforms; simple Principled materials; point, area, sun, and spot lights; camera; and resolution/sample settings. | `blender_workflow` capabilities | Design uses only these operations. No unsupported API is assumed. |

## Change log

| Date | Change | Source | Confirmed by |
|---|---|---|---|
| 2026-11-03 | Initial draft created. | make cozy room with computer | Pending |
| 2026-11-03 | Requirements confirmed with warm evening direction, dressed desk corner, three-quarter camera, Fully Autonomous, All graders. | Draft brief confirmation | User |
