# Requirements — CozyStudyRoom

Status: Confirmed
Defined: 2026-11-03
Last updated: 2026-11-03
Confirmed: 2026-11-03
Confirmation: User answered "Confirm requirements" to the drafted scope: warm evening lamp-lit single interior scene; desktop PC workstation focal point; desk-corner three-quarter hero camera; CC0 Poly Haven assets permitted; deliverables .blend plus 1920x1080 PNG; animation, characters, exterior and audio out of scope.

Confirmed requirements are the source of truth. Add or change them only after explicit user confirmation.

## Core value

A cozy, lived-in evening study corner that reads instantly as a comfortable room with a desktop computer as its focal point. Warm lamp light, believable materials, and a deliberate desk-corner composition carry the mood.

## Confirmed requirements

### Purpose and audience

- [x] REQ-01: A single interior scene of a cozy study room, presented as a hero still image and a saved Blender project.
- [x] REQ-02: The room must read as occupied and personal through supporting props: mug, notebook, chair, rug, shelf or wall art, plant, and soft fabric/textile detail.

### Visual outcome

- [x] REQ-03: Lighting is warm evening lamp-lit with a visible warm desk lamp as the key light, deep but soft shadows, and cool low-level ambient fill so the room never goes flat or black.
- [x] REQ-04: The desktop computer setup (monitor, keyboard, mouse, tower) sits on a wooden desk and is the clear focal point of the frame.
- [x] REQ-05: Hero camera is a three-quarter desk-corner view at 16:9 that frames desk, monitor, chair, lamp, and wall decor together without clipping.
- [x] REQ-06: Materials are physically plausible: wood grain, fabric weave, painted wall, metal accents, and emissive screen/lamp surfaces; colour palette warm amber, wood brown, muted ochre and cream.
- [x] REQ-07: Scale is real-world metric: room roughly 4 m x 4 m, desk 0.75 m high, monitor 0.55 m wide, typical residential proportions.

### Scope and delivery

- [x] REQ-08: Save the scene as `cozystudyroom.blend` at the project root and pack/verify all external data so the file opens without missing assets.
- [x] REQ-09: Produce a final 1920x1080 PNG render in `renders/final/` as the review deliverable.
- [x] REQ-10: Record all third-party assets with source and licence in `Documents/ASSETS.md`; CC0 Poly Haven downloads are permitted.
- [x] REQ-11: Keep README, decisions, and assets records current with the delivered state.

## Constraints

- Blender version: live session version reported through the harness; no dependency on version-specific add-ons.
- File format / resolution: `.blend`; final PNG 1920x1080 at 16:9; render engine chosen in-session for reliable EEVEE-class results.
- Performance / delivery limits: single scene, still image; no animation, no simulation, no characters.
- External assets: free CC0 Poly Haven textures, HDRIs, or models only; every asset registered with source and licence before commit.

## Deferred

- Rain-on-window effect and animated curtain motion.
- Additional room views or turntable animation.
- Night-time city view through the window.

## Out of scope

- Animation, camera moves, and video export.
- Character or animal models.
- Exterior architecture visible beyond a simple window treatment.
- Audio and interactive walkthrough.
- Paid or non-CC0 assets.

## Open questions

- None; requirements confirmed before scaffolding.

## Research notes

Sources that informed a requirement or a pending decision. Keep long material in `References/`.

| Date | Question | Finding | Source | Effect |
|---|---|---|---|---|
| 2026-11-03 | Asset licensing | Poly Haven publishes CC0 HDRIs, textures and models, so downloaded assets can be used and redistributed with attribution recorded. | https://polyhaven.com/license | Confirms CC0 asset approach. |

## Change log

| Date | Change | Source | Confirmed by |
|---|---|---|---|
| 2026-11-03 | Initial draft created. | Make a cozy room with computer | Pending |
| 2026-11-03 | Requirements confirmed after chat discussion. | User reply "Confirm requirements" | User |
