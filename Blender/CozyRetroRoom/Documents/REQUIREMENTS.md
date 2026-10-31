# Requirements — CozyRetroRoom

Status: Confirmed
Defined: 2026-10-31
Last updated: 2026-10-31
Confirmed: 2026-10-31
Confirmation: "Confirm requirements (Recommended)" — confirms the brief presented in chat: 1970s era with wood & warm orange; CRT monitor + desktop tower; corner desk vignette framing; one hero render + saved .blend; acceptance as listed below.

Confirmed requirements are the source of truth. Add or change them only after explicit user confirmation.

## Core value

A cozy 1970s wood-panelled room with a bulky CRT computer as its focal point, delivered as one polished hero still.

## Confirmed requirements

### Purpose and audience

- [x] REQ-01: Deliver a single hero still image of a cozy retro computer room for a general viewer; the image must read as "1970s cozy computer room" at a glance without caption.
- [x] REQ-02: The computer setup (CRT monitor, desktop tower, keyboard) is the clear focal subject, with the room supporting it.

### Visual outcome

- [x] REQ-03: Era reads 1970s: wood wall panelling, warm orange/brown/beige palette, shag or textured rug, period-correct chunky hardware.
- [x] REQ-04: Composition is an eye-level 3/4 corner desk vignette: desk corner in frame with the CRT and tower, a warm desk lamp, a window, and a chair; cozy accessories (books, mug, plant, posters) allowed as support.
- [x] REQ-05: Lighting is warm, soft, and interior: lamp key light plus window fill; mood cozy, lived-in, inviting. No harsh flat lighting.
- [x] REQ-06: Materials are deliberately assigned: wood grain, beige CRT plastic, fabric, metal; no default gray surfaces.

### Scope and delivery

- [x] REQ-07: Scene saved as `cozyretroroom.blend` in the project root.
- [x] REQ-08: One final hero render at 1920x1080 in `renders/final/`.
- [x] REQ-09: Scene hygiene: no floating, clipping, or intersecting props; no missing files; a clean, legible lit render at review resolution.
- [x] REQ-10: Build from primitive-level geometry through supported harness operations; no external assets are required.

## Constraints

- Blender version: the live workspace Blender instance (verified at launch).
- File format / resolution: `.blend`; hero PNG at 1920x1080.
- Performance / delivery limits: hobby still; moderate polycount and render time.
- External assets: none required. Procedural geometry and materials only.

## Deferred

- Turntable animation and extra detail renders (user chose one hero render).
- Additional eras or alternate room layouts.
- Characters or animation.

## Out of scope

- Animation, game export, and interactive scene (not requested; single still chosen).
- Exterior views, floor plans, and multi-room sets (outside the corner vignette).
- Photoreal product-accurate hardware replication (stylized retro reading is enough).

## Open questions

- None.

## Research notes

| Date | Question | Finding | Source | Effect |
|---|---|---|---|---|
| 2026-10-31 | 1970s interior palette | 1970s interiors commonly use warm browns, burnt orange, avocado green, and wood panelling; beige plastics dominate period office hardware. | General design knowledge; no binding source | Guided REQ-03 colour and material choices. |

## Change log

| Date | Change | Source | Confirmed by |
|---|---|---|---|
| 2026-10-31 | Initial draft created. | Make cozy retro room with computer | Pending |
| 2026-10-31 | Requirements confirmed with era, prop, composition, and deliverable selections. | Chat confirmation | User: "Confirm requirements (Recommended)" |
