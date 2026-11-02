# Requirements — CozyRoomLive

Status: Confirmed
Defined: 2026-11-02
Last updated: 2026-11-02
Confirmed: 2026-11-02
Confirmation: User confirmed reusing the previously confirmed CozyRoom brief for a full live-test project named CozyRoomLive, with Fully Autonomous workflow and All-grader review using the visual, technical, and spec graders.

Confirmed requirements are the source of truth. Add or change them only after explicit user confirmation.

## Core value

A warm, stylized evening interior whose computer desk is the unmistakable focal point, delivered as one polished hero render.

## Confirmed requirements

### Purpose and audience

- REQ-01: Deliver a single warm, stylized 3D interior scene of a cozy room with a computer desk, saved as a Blender project, for portfolio and mood presentation.

### Visual outcome

- REQ-02: Build a fully enclosed room shell approximately 4.0 × 3.5 m with a 2.7 m ceiling, including floor, walls, ceiling, and at least one window with curtains; no visible gaps or black voids.
- REQ-03: Include a workstation with desk, chair, monitor, keyboard, mouse, mug, and desk lamp; the computer monitor is the focal point of the composition.
- REQ-04: Include cozy set dressing: rug, bookshelf with books, at least one plant, wall art, curtains, and a soft blanket or cushion.
- REQ-05: Light the scene as a warm stylized evening: warm practical lamp and monitor glow plus a cool dusk window fill, soft shadows, warm amber/terracotta palette against teal-blue dusk accents, with no blown highlights.
- REQ-06: Frame one hero shot from about 1.25 m (seated monitor height), at a 3/4 angle toward the desk, with the computer centered, in 16:9.

### Scope and delivery

- REQ-07: Render one still with EEVEE at 1920×1080 and seal it as the review image.
- REQ-08: Save the authoritative scene as `cozyroomlive.blend` at the project root with no missing external files.
- REQ-09: Model all furniture and props in-scene from harness-supported primitives; no external models. Optional CC0 Poly Haven textures or HDRI only if needed, registered in `Documents/ASSETS.md` before use.
- REQ-10: Every reviewable change is graded by all three configured graders: visual, technical, and spec.

## Constraints

- Blender version: the live workspace instance reported by MCP.
- File format / resolution: `.blend`; one 1920×1080 PNG still, 16:9, EEVEE.
- Performance / delivery limits: single still only; no animation or exports.
- External assets: none required; any CC0 texture or HDRI must be registered before use.
- Scene operations are limited to harness-supported operations and primitives: cube, uv_sphere, plane, cylinder.

## Deferred

- Turntable animation and additional camera angles.
- GLB or other scene exports.
- Interactive or configurable room elements.

## Out of scope

- Characters, rigs, animation, sound, and game-engine setup; not needed for a single mood still.

## Open questions

- None; the brief is confirmed and frozen after registration.

## Research notes

Sources that informed a requirement or a pending decision. Keep long material in `References/`.

| Date | Question | Finding | Source | Effect |
|---|---|---|---|---|
| 2026-11-02 | Initial scope | Brief captured from the user's request and reused from the confirmed CozyRoom requirements; no external research was needed for this stylized still. | User chat | Requirement set fixed. |

## Change log

| Date | Change | Source | Confirmed by |
|---|---|---|---|
| 2026-11-02 | Requirements adapted to CozyRoomLive from the confirmed CozyRoom brief. | User confirmed reuse for a live-test project. | User |
