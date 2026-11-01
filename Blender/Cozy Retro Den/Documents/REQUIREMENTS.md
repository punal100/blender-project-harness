# Requirements — Cozy Retro Den

Status: Confirmed
Defined: 2026-11-01
Last updated: 2026-11-01
Confirmed: 2026-11-01
Confirmation: "Confirm requirements (Recommended)" — user confirmed the drafted scope in ordinary chat before scaffolding (1980s home computer den, stylized realism, wide three-quarter hero camera, window, shelves, posters, rug, 1920×1080 still, procedural-only assets).

Confirmed requirements are the source of truth. Add or change them only after explicit user confirmation.

## Core value

A cozy 1980s home computer den rendered in stylized realism as one wide three-quarter hero still.

## Confirmed requirements

### Purpose and audience

- [x] REQ-01: Deliver one nostalgic still of a lived-in 1980s home computer den for viewers who want a warm, cozy retro workspace scene.

### Visual outcome

- [x] REQ-02: The room must contain a desk with a CRT computer setup (monitor, keyboard, mouse, and tower), wood-panel walls, a window with night light, shelves with clutter, retro posters or wall art, a rug, soft seating, and a warm desk lamp.
- [x] REQ-03: Render style is stylized realism: believable surface materials and soft lighting with clean, slightly idealized proportions.
- [x] REQ-04: Lighting must read as evening, with warm interior lamp light contrasted against cool night light from the window.
- [x] REQ-05: One wide three-quarter interior camera framing must show the desk and enough room context to establish the den; the computer is the focal point.
- [x] REQ-06: Scale must be consistent and human-readable; props sit on surfaces with no floating, clipping, or obvious interpenetration.

### Scope and delivery

- [x] REQ-07: Authoritative scene saved as `cozy-retro-den.blend` in the project root.
- [x] REQ-08: Final render saved as a 1920×1080 PNG in `renders/final/`.
- [x] REQ-09: Scene content is built procedurally in Blender with generated geometry and materials only; no external model, texture, or HDRI imports.

## Constraints

- Blender version: read from the live session at launch; record the actual version.
- File format / resolution: `.blend` scene plus one 1920×1080 PNG still.
- Performance / delivery limits: single still image; no animation or export formats required.
- External assets: none. Harness tooling blocks import and generation operations, so all content is procedural.

## Deferred

- Additional camera angles or a closer desk detail render.
- Animation, turntable frames, and interactive exports.
- Room extensions beyond the den (hallway, second room).

## Out of scope

- Animation and game-ready export: the confirmed deliverable is a single hero still.
- External asset imports: blocked by current harness tooling and not required for the brief.
- Multiple deliverable camera views: the confirmed framing is one wide three-quarter interior shot.

## Open questions

- None.

## Research notes

| Date | Question | Finding | Source | Effect |
|---|---|---|---|---|
| 2026-11-01 | Can external models, textures, or HDRIs be imported? | Production imports are blocked; unsupported operations stop for reviewed tooling extension. | `AGENTS.md`, `blender-workflow-harness` | Requirements limited to procedural geometry and materials. |

## Change log

| Date | Change | Source | Confirmed by |
|---|---|---|---|
| 2026-11-01 | Initial draft created. | make cozy retro room with computer | Pending |
| 2026-11-01 | Requirements confirmed: 1980s den, stylized realism, wide three-quarter camera, listed extras, 1920×1080 still, procedural-only. | User discussion in ordinary chat | "Confirm requirements (Recommended)" |
