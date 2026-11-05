# Requirements — CozyLaundromat

Status: Confirmed
Defined: 2026-11-05
Last updated: 2026-11-05
Confirmed: 2026-11-05
Confirmation: User answered "Confirm requirements" to the full draft brief on 2026-11-05: realistic cozy laundromat interior; wide eye-level hero shot; warm evening tungsten mood; generated reference and generated media after registration; `.blend` plus a sealed 1920x1080 hero PNG; no scripts.

Confirmed requirements are the source of truth. Change them only after explicit user confirmation.

## Core value

A realistic, cozy neighborhood laundromat interior at evening, delivered as a saved Blender scene and a sealed hero render that reads as lived-in and inviting.

## Confirmed requirements

### Purpose and audience

- [x] REQ-01: Deliver one self-contained Blender scene of a small neighborhood laundromat interior that reads as a real working laundromat without people.
- [x] REQ-02: Target reviewers judging realism, coziness, composition, and deliverable completeness.

### Visual outcome

- [x] REQ-03: Hero camera is a wide eye-level interior shot at about 1.6 m, using a 35-50 mm equivalent field of view, framed to show the machine wall, folding counter, waiting area, window, and room depth without clipping.
- [x] REQ-04: Room is approximately 6 x 5 m with a 2.8 m ceiling; front-loading washers and dryers are about 0.85 m tall; counter is about 0.9 m; all objects use realistic scale in metres.
- [x] REQ-05: Scene includes at least six front-loading machines with visible doors and drums, a folding counter, wire baskets, detergent and soap props, a noticeboard, seating, a potted plant, and a window showing an evening exterior glimpse.
- [x] REQ-06: Lighting is warm evening tungsten: amber practical lights, soft shadows, cream and amber palette with muted teal accents, and no blown-out whites.
- [x] REQ-07: Materials read as painted wall, stainless or white appliance fronts, glass doors approximated without transmission, worn tile or linoleum floor, wood counter, and fabric seating.
- [x] REQ-08: Finish is realistic / stylized-realistic: coherent proportions, clean silhouettes, no visible primitive seams, and no intersecting clutter.

### Scope and delivery

- [x] REQ-09: Save the scene as `cozylaundromat.blend` at the project root.
- [x] REQ-10: Produce one sealed hero render at 1920x1080 PNG in `renders/final/` and inspect it with `look`.
- [x] REQ-11: Keep README, requirements, workflow, review, decisions, assets, and references current inside the changes that affect them.
- [x] REQ-12: Use no project Python scripts; build the scene through harness-supported operations only.
- [x] REQ-13: Generate one reference image after registration for visual direction; generated textures may be used only if they pass intake and improve the confirmed result.
- [x] REQ-14: The scene must open without missing external files; any external asset is registered with source and licence before commit.

## Constraints

- Blender version: live harness Blender; record the actual version on first launch.
- File format / resolution: `.blend` scene; PNG hero render at 1920x1080 landscape.
- Performance / delivery limits: at most 20 objects per change and 20 applies per change; realistic detail is delivered across multiple bounded changes. Glass transmission, bump/procedural textures, volume haze, and boolean openings are unsupported and are approximated with flat tinted glass, geometry openings, and per-object material colours.
- External assets: generated reference image after registration; optional generated textures after intake; no downloaded third-party assets planned; no user-supplied files.
- Reference images / links: Generate one (deferred until after registration; mirror in `Documents/References/README.md`).

## Deferred

- Additional camera angles and a turntable or animation.
- Exterior street detail beyond the window glimpse.
- People or characters in the scene.
- A GLB export and other non-Blender deliverable formats.
- Detailed signage beyond simple in-scene lettering.

## Out of scope

- Animation, simulation, and character work, because the deliverable is one still hero render.
- A full exterior street environment, because the camera stays inside and the window shows only a glimpse.
- Downloaded or user-supplied third-party assets, because the user chose generated media only.
- Project Python scripts, because all scene work is limited to harness-supported operations.

## Open questions

- None at confirmation. Render engine and final lighting balance are production decisions recorded in `Documents/DECISIONS.md`.

## Research notes

| Date | Question | Finding | Source | Effect |
|---|---|---|---|---|
| 2026-11-05 | Appliance scale | Standard front-load washer dimensions are about 0.85 m tall and 0.6 m wide; counters are about 0.9 m. | Common appliance dimensions, treated as an assumption to verify in scene | Sets REQ-04. |

## Change log

| Date | Change | Source | Confirmed by |
|---|---|---|---|
| 2026-11-05 | Initial draft created. | make realistic cozy laundromat | Pending |
| 2026-11-05 | Brief confirmed with reference, media, deliverable, and script answers. | User confirmation in project chat | User |
