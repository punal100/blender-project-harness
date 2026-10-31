# Requirements — CozyCRTRoom

Status: Confirmed
Defined: 2026-10-31
Last updated: 2026-10-31
Confirmed: 2026-10-31
Confirmation: User selected "Confirm requirements (Recommended)" for the presented scope: "stylized low-poly 90s interior; CRT computer + keyboard + desk + chair as focal point; window with night rain and curtains; bed/couch corner; shelves, posters, rug, plant; warm lamp glow against cool window light; eye-level 3/4 corner camera. Deliverable: one 1920x1080 still render plus saved .blend and docs. Out of scope: animation, photoreal finish, modeled exterior."

Confirmed requirements are the source of truth. Add or change them only after explicit user confirmation.

## Core value

A warm, nostalgic 1990s room built around a glowing CRT computer, shot as one polished stylized still.

## Confirmed requirements

### Purpose and audience

- [x] REQ-01: Deliver a single stylized low-poly 90s room interior intended as a portfolio-quality still image; the viewer should read "cozy retro computer room" immediately.
- [x] REQ-02: Use a coherent low-poly style: simplified but deliberate geometry, clean bevels, flat/stylized materials, no photoreal textures or scanned assets.

### Visual outcome

- [x] REQ-03: CRT computer (monitor with glowing screen, keyboard, tower or all-in-one housing) on a desk with a chair is the focal point.
- [x] REQ-04: Include a window with night and rain, framed by curtains, providing cool blue light and contrast with the warm interior.
- [x] REQ-05: Include a bed or couch corner as soft background mass.
- [x] REQ-06: Include shelves, retro posters, a rug, and a potted plant as supporting set dressing.
- [x] REQ-07: Lighting must combine a warm practical lamp with cool night window light; the computer screen adds a distinct local glow.
- [x] REQ-08: Camera is an eye-level 3/4 corner view showing desk, screen glow, window, and decor in one readable composition.
- [x] REQ-09: Palette and mood are warm, nostalgic, and lived-in; avoid sterile or neon-cyberpunk treatment.

### Scope and delivery

- [x] REQ-10: Deliver `cozycrtroom.blend` in the project root, saved and self-contained with no missing external files.
- [x] REQ-11: Deliver one final still render at 1920x1080 in `renders/final/`.
- [x] REQ-12: Keep README, requirements, workflow, review, decisions, and asset documents current.

## Constraints

- Blender version: 5.2 (workspace install).
- File format / resolution: `.blend` scene; final PNG still at 1920x1080.
- Performance / delivery limits: single still image; scene must render interactively on the workspace machine.
- External assets: none required; all geometry and materials authored in-scene unless confirmed later.

## Deferred

- Daylight variant of the room.
- Animated rain, screen animation, or camera move.
- glTF or other runtime export for game engines.
- Extra rooms or an exterior view through the window.

## Out of scope

- Animation and video: confirmed still-image deliverable only.
- Photoreal finish: conflicts with the confirmed stylized low-poly direction.
- Modeled exterior: the window may show an impression of night/rain, not a full street scene.

## Open questions

- None.

## Research notes

No web research was required; the direction was settled from the user's request and visual-preference choices.

## Change log

| Date | Change | Source | Confirmed by |
|---|---|---|---|
| 2026-10-31 | Initial draft created. | make cozy retro room with computer | Pending |
| 2026-10-31 | Requirements confirmed with style, contents, camera, and deliverable scope. | User confirmation of presented draft scope | User: "Confirm requirements (Recommended)" |
