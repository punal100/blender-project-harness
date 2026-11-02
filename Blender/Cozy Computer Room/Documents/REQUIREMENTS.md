# Requirements — Cozy Computer Room

Status: Confirmed
Defined: 2026-11-02
Last updated: 2026-11-02
Confirmed: 2026-11-02
Confirmation: The user answered "Confirm requirements" to the displayed draft covering: stylized low-poly cutaway diorama; desk with single monitor, tower, keyboard, mouse, mug, headphones, and chair; window and curtains; rug and plants; wall art and shelf decor; warm amber evening against teal-blue night; code-editor screen; one hero still plus WIP; Fully Autonomous; All three graders.

Confirmed requirements are the source of truth. Add or change them only after explicit user confirmation.

## Core value

A warm, quiet, low-poly evening workspace that reads instantly as cozy and lived-in in a single hero still.

## Confirmed requirements

### Purpose and audience

- REQ-01: The deliverable is a self-contained Blender scene and one polished hero still of a cozy computer room; it is not a game asset, animation, or photoreal study.

### Visual outcome

- REQ-02: Use a stylized low-poly aesthetic with chunky simplified forms, clean facets, and simple PBR materials; no photorealism and no imported scans.
- REQ-03: Present the room as a cutaway corner with a floor and two perpendicular walls; the camera looks into the corner from a three-quarter front angle.
- REQ-04: Include a desk with one monitor, a PC tower, a mechanical keyboard, a mouse, a mug, headphones, and a chair.
- REQ-05: Include a window with curtains, a rug, potted plants, wall art, and a wall shelf with small decor.
- REQ-06: Use a warm amber, wood, and cream interior palette against a cool teal-blue night exterior.
- REQ-07: Light the room for late evening with a warm desk lamp, monitor glow, and subtle shelf lighting, with low warm ambient fill and cool window light.
- REQ-08: Show an emissive warm code editor with legible text blocks on the monitor.
- REQ-09: Compose the camera so the desk is the focal point, the window balances the frame, the room fills the image without clipping, and the diorama reads clearly.

### Scope and delivery

- REQ-10: Deliver one hero still at 1920x1080 or larger, saved under `renders/final/`, plus intermediate WIP renders during production.
- REQ-11: Save the authoritative scene as `cozy-computer-room.blend` at the project root; it must open with no missing external files.
- REQ-12: Keep all geometry and materials self-contained and procedural; no third-party assets are required.
- REQ-13: Keep project documents current and complete the configured review with a final applicable `PASS` and no unresolved blocker or major finding.

## Constraints

- Blender version: the connected workspace instance and add-on version.
- File format / resolution: `.blend` scene; hero PNG at 1920x1080 or larger.
- Performance / delivery limits: single still; no animation; geometry kept simple enough for quick renders.
- External assets: none; harness-supported primitives and procedural materials only.
- Scale and units: metric; room corner about 4.2 m by 3.6 m, wall height 2.6 m, desk 1.4 m wide.

## Deferred

- A short camera fly-through animation.
- A game-ready glTF export with optimized topology.
- Additional rooms or an expanded apartment layout.
- Imported asset packs, HDRIs, or scanned textures.

## Out of scope

- Bed, couch, and bookshelf: not selected for this room.
- Photoreal interior rendering: conflicts with the confirmed low-poly style.
- Animation, interactivity, and game-engine delivery.
- Third-party models, textures, or HDRIs: no licence or sourcing work is planned.

## Open questions

- None. All choices needed for production were confirmed on 2026-11-02.

## Research notes

| Date | Question | Finding | Source | Effect |
|---|---|---|---|---|
| 2026-11-02 | Visual direction and palette | The user selected the stylized low-poly style, cutaway presentation, amber-and-teal night palette, single-monitor setup, and code-editor screen. | User answers in the project discussion | Set the confirmed visual scope. |

## Change log

| Date | Change | Source | Confirmed by |
|---|---|---|---|
| 2026-11-02 | Initial draft created from the request "make cozy room with computer". | User request | Pending |
| 2026-11-02 | Requirements confirmed and status set to Confirmed. | User answer "Confirm requirements" | User |
