# Requirements — RetroTerminalNook

Status: Confirmed
Defined: 2026-10-31
Last updated: 2026-10-31
Confirmed: 2026-10-31
Confirmation: User selected "Confirm requirements" for the presented draft: desk-corner vignette, late 70s/early 80s, wooden desk, beige CRT with green phosphor, warm practical lamp, late-night room, cassette deck + tapes, floppies + manuals, mug + plant, posters + corkboard, stylized realistic, one 16:9 hero render, procedural primitives only, no external assets.

Confirmed requirements are the source of truth. Add or change them only after explicit user confirmation.

## Core value

A cozy late-70s/early-80s desk corner built around a glowing green-phosphor CRT computer.

## Confirmed requirements

### Purpose and audience

- [x] REQ-01: Deliver a single inviting desk-corner scene for a general viewer, readable as a retro home-computing nook at first glance. No people appear.
- [x] REQ-02: The CRT computer is the clear focal point and includes a beige monitor with a green phosphor screen, a visible keyboard, and a computer unit.

### Visual outcome

- [x] REQ-03: Scene contains a wooden desk, chair, shelf, back and side walls, floor, and a window showing night. Composition is a tight desk-corner vignette, not a full room.
- [x] REQ-04: Late 70s/early 80s dressing: wood-panelled walls, shag rug, earthy browns with mustard, avocado, and burnt-orange accents, beige computer plastics, woodgrain surfaces.
- [x] REQ-05: CRT screen shows legible green text lines or a terminal-like readout with a cursor; green light spills onto the desk, keyboard, and nearby surfaces.
- [x] REQ-06: All four prop groups are present and identifiable: cassette deck with tapes, floppy disks with manuals, mug with a plant, and posters with a corkboard.
- [x] REQ-07: Late-night lighting: room mostly dark, warm desk lamp as key, green CRT as fill/accent, small practical glow. No daylight through the window.
- [x] REQ-08: Stylized-realistic style with believable proportions and simplified detail. Palette is warm and cohesive, with the green screen as the strongest colour contrast.

### Scope and delivery

- [x] REQ-09: Deliver one 16:9 hero render at 1600x900 or larger, saved under `renders/final/`, plus the authoritative `retroterminalnook.blend`.
- [x] REQ-10: Save and render a camera view at roughly seated eye level, three-quarter toward the desk, with the monitor, keyboard, and props readable and no key object cropped.

## Constraints

- Blender version: current workspace session.
- File format / resolution: `.blend`; hero PNG at 16:9, minimum 1600x900.
- Performance / delivery limits: workspace harness cap of 40 operations per bounded change.
- External assets: none. No imports, external textures, HDRI, or generated assets. All geometry from supported primitive operations; materials procedural.
- No animation, rigging, or simulation.

## Deferred

- Alternate camera angles.
- Turntable or fly-through animation.
- Higher-detail photoreal material pass.

## Out of scope

- Full four-wall room, bed, couch, or doorway: desk corner only.
- People or animals in frame.
- Game-engine export or interactive scene.
- External asset sourcing and licensing.
- Photoreal reproduction of a specific real computer model.

## Open questions

- None.

## Research notes

| Date | Question | Finding | Source | Effect |
|---|---|---|---|---|
| 2026-10-31 | Retro computer reference | Early-80s CRT cabinets commonly used simulated woodgrain and boxy beige forms. | [CRT Database — Sony KV-1961](https://crtdatabase.com/crts/sony/sony-kv-1961) | Informs monitor/case shape and woodgrain accent. |
| 2026-10-31 | 70s interior cues | Shag carpet, wood panelling, and earthy mustard/avocado/burnt-orange palettes define the period look. | [Flooring America — 1970s interior design](https://www.flooringamerica.com/blog/70s-inspired-interior-design-ideas-trends) | Informs rug, wall treatment, and palette. |

## Change log

| Date | Change | Source | Confirmed by |
|---|---|---|---|
| 2026-10-31 | Initial draft created. | make cozy retro room with computer | Pending |
| 2026-10-31 | Requirements confirmed as presented; status set to Confirmed. | Requirements confirmation question | "Confirm requirements" |
