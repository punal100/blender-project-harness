# Requirements — CozyComputerRoom

Status: Confirmed
Defined: 2026-11-05
Last updated: 2026-11-05
Confirmed: 2026-11-05
Confirmation: User direction: "Use a semi-realistic stylized look with warm evening lamps against a cool dusk window. Build the enclosed small full room (about 3.6 x 3.2 m, 2.6 m ceiling) with desk, desktop computer (monitor, tower, keyboard, mouse), chair, bed, bookshelf with books, rug, plant, and cozy props. Workflow: Fully Autonomous. Review mode: All with visual, technical, and spec graders. Save the scene as cozycomputerroom.blend and produce one 1920x1080 16:9 hero render. Procedural only, no project scripts, no external assets."

## Core value

A semi-realistic stylized cozy computer room at warm sunset with a cool dusk window, built as a complete lived-in interior around a desktop computer.

## Confirmed requirements

### Purpose and audience

- [x] REQ-01: A complete, enclosed, lived-in cozy room that reads as a calm evening study/bedroom built around a desktop computer, suitable as a self-contained Blender hero scene for a general audience.

### Visual outcome

- [x] REQ-02: The room is approximately 3.6 x 3.2 m with a 2.6 m ceiling and includes floor, four walls, ceiling, a window, and a door.
- [x] REQ-03: Desk workstation includes a wooden desk, desktop computer with monitor, tower, keyboard, mouse, office chair, and warm desk lamp.
- [x] REQ-04: Room is furnished with a bed, bookshelf with books, rug, potted plant, wall art, curtains, and small cozy props such as a mug, papers, and a soft blanket.
- [x] REQ-05: Semi-realistic stylized look: clean readable forms, believable proportions, and procedural materials for wood, fabric, plastic, metal, paper, ceramic, and plant.
- [x] REQ-06: Lighting is warm evening lamps against a cool dusk window, with soft shadows, a calm intimate mood, and the computer clearly readable.
- [x] REQ-07: One hero camera at eye level near 1.5 m in a wide three-quarter view showing the desk corner, window, and room atmosphere.

### Scope and delivery

- [x] REQ-08: Single Blender scene saved as `cozycomputerroom.blend` in the project root.
- [x] REQ-09: One 1920x1080 (16:9) hero PNG render in `renders/final/`.
- [x] REQ-10: Everything is modeled and shaded procedurally inside Blender; no external assets, no imported models or textures, and no project scripts.

## Constraints

- Blender version: live MCP session version recorded at launch.
- File format / resolution: `.blend`; 1920x1080 PNG, 16:9.
- Performance / delivery limits: one hero still; EEVEE; must render within a normal interactive session.
- Material support: base color, roughness, metallic, and emission only; no transmission or glass, bump, or procedural texture nodes.
- Geometry support: cube, UV sphere, plane, and cylinder primitives plus supported mesh creation; no boolean modifier or displacement.
- Lighting support: point, area, and sun lights plus world colour; no volumetrics or haze.
- External assets: none. Everything is authored in Blender.
- Reference images / links: none.

## Deferred

- Additional camera angles and close-up detail renders.
- Animation, camera walkthrough, and interactive or game-engine setup.
- GLB/FBX export.
- Outdoor environment beyond the window.
- Characters, pets, and people.

## Out of scope

- Photoreal texture sourcing or external asset downloads.
- Glass transmission, volumetrics, and other unsupported material or lighting features.
- Scripts or generated media.
- Multiple rooms or building exteriors.

## Open questions

- None.

## Research notes

| Date | Question | Finding | Source | Effect |
|---|---|---|---|---|
| 2026-11-05 | Material and lighting limits | The harness material operation supports base color, roughness, metallic, and emission; lights have no size or rotation fields, and no volumetrics are available. | Harness capabilities | Design uses matte and satin materials, emission for glows, and light placement through transforms instead of glass or haze. |

## Change log

| Date | Change | Source | Confirmed by |
|---|---|---|---|
| 2026-11-05 | Initial confirmed requirements recorded. | User direction (Agent Manager): semi-realistic stylized cozy room, 3.6 x 3.2 x 2.6 m, full furnishing, procedural only, cozycomputerroom.blend, 1920x1080 hero render, Fully Autonomous, Review All. | User |
