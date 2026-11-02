# Requirements — HarnessLiveTest

Status: Confirmed
Defined: 2026-11-02
Last updated: 2026-11-02
Confirmed: 2026-11-02
Confirmation: User requested another live harness test; this run is limited to a deterministic validation scene.

Confirmed requirements are the source of truth. This project validates the harness lifecycle on a small scene; it is not a broader art commission.

## Core value

A small, deterministic scene that exercises registration, launch, apply, WIP, seal, visual review, commit, and checkpoint without a large art scope.

## Confirmed requirements

### Purpose and audience

- [x] REQ-01: Produce a validation scene for the workspace operator with one cube, one plane, one camera, and one light.

### Visual outcome

- [x] REQ-02: Neutral grey cube on a dark plane, three-quarter camera view, warm key light, readable silhouette, and clean render margins.

### Scope and delivery

- [x] REQ-03: Save `harnesslivetest.blend`, produce a final PNG render, run the configured visual review, and keep the project documents current.

## Constraints

- Blender version: 5.2.
- File format / resolution: PNG, 1024x768.
- Performance / delivery limits: one scene, one camera, one light, no external assets.
- External assets: none.

## Deferred

- Materials beyond a simple matte grey cube.
- Additional objects, set dressing, or animation.

## Out of scope

- Asset imports, photorealistic rendering, exports, and multi-shot coverage.

## Open questions

- None.

## Research notes

No external research required.

| Date | Question | Finding | Source | Effect |
|---|---|---|---|---|
| 2026-11-02 | Validation scope | Keep the scene deterministic and small. | Harness test plan | Limits scope. |

## Change log

| Date | Change | Source | Confirmed by |
|---|---|---|---|
| 2026-11-02 | Initial confirmed validation scope. | User-requested live harness test | User request |
