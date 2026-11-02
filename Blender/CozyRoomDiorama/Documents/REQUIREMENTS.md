# Requirements — CozyRoomDiorama

Status: Confirmed
Defined: 2026-11-03
Last updated: 2026-11-03
Confirmed: 2026-11-03
Confirmation: "Confirm requirements" — confirmed the drafted brief: low-poly diorama, rainy evening, listed room contents, three-quarter 16:9 hero render, built-in primitives only, Fully Autonomous, all three graders.

Confirmed requirements are the source of truth. Add or change them only after explicit user confirmation.

## Core value

A low-poly room diorama that reads instantly as cozy and lived-in, with the computer desk as its focal point and rainy-evening warmth as the mood.

## Confirmed requirements

### Purpose and audience

- [x] REQ-01: Deliver a self-contained low-poly Blender scene of a cozy computer room presented as an open-corner diorama (floor plus two walls), readable as one hero image for a general audience.

### Visual outcome

- [x] REQ-02: Style is low-poly diorama: faceted, simplified geometry with deliberate low-poly silhouettes; no photoreal textures.
- [x] REQ-03: Setting is rainy evening: cool blue exterior light through the window, visible rain, dark outdoor backdrop; interior lit by warm desk lamp, floor lamp, and monitor glow.
- [x] REQ-04: The room includes a desk with monitor, keyboard, mouse, PC tower, and desk chair; a window with curtains; a filled bookshelf; a rug; a floor lamp; at least two potted plants; wall art; and mug/papers clutter.
- [x] REQ-05: The computer desk is the clear focal point; a three-quarter camera view frames the full room at 16:9 and shows the diorama walls, floor, and contents legibly.
- [x] REQ-06: Colour palette is cohesive: warm amber interior, cool blue window light, muted wood and teal accents; mood is calm and cozy.
- [x] REQ-07: Scene scale is believable room scale in metres; diorama geometry is clean and intentional.

### Scope and delivery

- [x] REQ-08: Save the authoritative scene as `cozyroomdiorama.blend` at the project root; no external assets or missing files.
- [x] REQ-09: Render a 1920x1080 EEVEE hero image to `renders/final/`; keep a sealed review render as evidence.
- [x] REQ-10: Keep README, requirements, workflow, review, assets, decisions, and goal documents current; complete review via the configured visual, technical, and spec graders.

## Constraints

- Blender version: the current workspace-launched Blender, verified at launch.
- File format / resolution: `.blend` project file; 1920x1080 PNG hero render; EEVEE.
- Performance / delivery limits: harness limits; at most 20 declared objects per bounded change and 20 apply tickets per change; one Blender writer at a time.
- External assets: none; built-in primitives and procedural materials only; no textures, HDRIs, models, or downloads.

## Deferred

- Additional camera angles or a turntable view.
- Animation, sound, or an interactive scene.
- Bed or sofa lounge furniture.
- Game-engine export or GLB/FBX delivery.

## Out of scope

- Photoreal rendering or external scanned assets: the user selected a low-poly diorama and built-in-only geometry.
- Bed or sofa: not selected in the confirmed room contents.
- Animation and audio: the deliverable is a single still diorama.
- Exports beyond the `.blend` and PNG render.
- Packed or embedded third-party data: no external assets are permitted.

## Open questions

- None; the confirmed brief is sufficient for production.

## Research notes

Internal design judgment only; no external sources were required for this brief.

| Date | Question | Finding | Source | Effect |
|---|---|---|---|---|
| 2026-11-03 | Low-poly diorama readability | Open-corner dioramas read best with faceted silhouettes, limited palette, and a clear focal light. | Internal design judgment | Informs REQ-02, REQ-05, and REQ-06. |

## Change log

| Date | Change | Source | Confirmed by |
|---|---|---|---|
| 2026-11-03 | Initial draft created. | Make a cozy room with computer | Pending |
| 2026-11-03 | Requirements confirmed: low-poly diorama, rainy evening, listed contents, three-quarter 16:9 hero, built-in primitives only, Fully Autonomous, all three graders. | User answer "Confirm requirements" | User |
