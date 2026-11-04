# Requirements — CozyComputerRoom

Status: Confirmed
Defined: 2026-11-05
Last updated: 2026-11-05
Confirmed: 2026-11-05
Confirmation: "Confirm requirements" — confirms the draft brief: semi-realistic stylized compact room, desk with desktop computer, warm evening lamps, one 1920x1080 hero render plus .blend, procedural assets only, and no scripts.

Confirmed requirements are the source of truth. Add or change them only after explicit user confirmation.

## Core value

A cozy small room with a desktop computer, rendered as a warm, inviting semi-realistic stylized evening still.

## Confirmed requirements

### Purpose and audience

- [x] REQ-01: A finished interior still for personal and portfolio viewing; the computer desk is the focal point and the room reads as a complete, lived-in space.
- [x] REQ-02: Style is semi-realistic stylized: believable proportions and materials, clean simplified forms, no photoreal texture dependency.

### Visual outcome

- [x] REQ-03: Room is a compact interior approximately 3.6 x 3.2 m with a 2.6 m ceiling, enclosed by floor, walls, and ceiling, with a door and a window.
- [x] REQ-04: Workstation includes a desk, a desktop computer with monitor, tower, keyboard, and mouse, plus a chair.
- [x] REQ-05: Room additionally includes a bed, a bookshelf with books, a rug, a potted plant, and small cozy props such as a mug, lamps, wall art or poster, and a blanket.
- [x] REQ-06: Lighting is warm evening lamps (desk lamp plus floor or ambient lamp) with a cool dusk-blue window contrast, soft shadows, and no blown-out highlights.
- [x] REQ-07: Materials are procedural: wood, fabric, plastic, metal, paper, ceramic, and plant; cohesive warm palette with a cool accent; no missing textures.
- [x] REQ-08: One hero camera at eye level near 1.5 m, three-quarter view toward the desk, 16:9, with the computer clearly readable as the focal point.
- [x] REQ-09: Furniture and props use metric scale at believable human proportions (desk about 0.75 m high, chair seat about 0.45 m, bed about 2.0 m long).

### Scope and delivery

- [x] REQ-10: Deliver one 1920x1080 PNG hero render in `renders/final/` and the saved scene as `cozycomputerroom.blend` in the project root.
- [x] REQ-11: All geometry and materials are authored procedurally in Blender; no external assets, downloads, or generated media.
- [x] REQ-12: No project scripts; all scene work uses supported harness operations.
- [x] REQ-13: The scene opens cleanly, is fully shaded and lit, and the sealed render shows the delivered state.

## Constraints

- Blender version: harness-managed live session
- File format / resolution: `.blend`; PNG 1920x1080, 16:9
- Performance / delivery limits: one still render; practical EEVEE render time
- External assets: none; procedural only
- Reference images / links: none

## Deferred

- Additional camera angles, close-up detail renders, animation, exterior environment, photoreal texture detail, and custom sculpted assets.

## Out of scope

- Characters, rigs, animation, sound, interactivity, game-engine setup, GLB/FBX export, external or generated media, and project Python scripts.

## Open questions

- None.

## Research notes

No external research was required; the brief uses standard interior proportions and common evening lighting practice. No third-party findings changed the confirmed scope.

## Change log

| Date | Change | Source | Confirmed by |
|---|---|---|---|
| 2026-11-05 | Initial requirements drafted from chat answers and confirmed. | make cozy room with computer and chat answers | User ("Confirm requirements") |
