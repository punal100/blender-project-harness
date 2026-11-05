# Grader Report — technical

- Round: R02-20261105T045756Z
- Grader: technical
- Focus: scale, geometry, topology, render settings, missing files, scene health
- Model/variant: ocg/deepseek-v4.1-flash / Max
- Target: base a0de6f1bbf905eb390bb6bca65c0193e21b49f09, saved scene SHA-256 feebaf1c7e41c8f757833d76ecc299cadb5928a1e142776cc98ef0a69193056e, project dirty (M cozycomputerroom.blend, M Documents/TASKSTRACKER.md, ?? Documents/Tasks/T017/, ?? renders/final/R02-20261105T045756Z.png)
- Evidence key: 1a92bc57e28ccafa344b40aabf95518889c7c79cc04668a2ea1b10a9b36cdc97
- Verdict: PASS
- Evidence inspected: Documents/REQUIREMENTS.md; Documents/WORKFLOW.md; Documents/Goals/01-project-brief.md; Documents/Reviews/R01-20261105T044624Z/technical/REPORT.md; Documents/Reviews/R02-20261105T045756Z/manifest.json; _evidence/scenes/Scene/camera.png (1920x1080, hash 8161fb82...); _evidence/scenes/Scene/scene-facts.json (byte-identical to scene.txt, hash e13931b1...)

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1. Spec fidelity | PASS | scene-facts.json: interior 3.6 x 3.2 m, 2.6 m ceiling, floor, four walls, ceiling, window (frame + glow card), door with casing and handle -> REQ-02 met. WarmFill plus blue dusk window give the warm/cool split and soft shadows -> REQ-06 advanceable part met; "computer clearly readable" belongs to later milestones and is deferred. HeroCam at 1.55 m with a wide three-quarter view -> REQ-07 camera part met; desk corner deferred. Only the open minor F-01 remains. |
| 2. Composition and camera | not-assessed | Outside assigned focus; prior framing finding is tracked under dimension 1 and Re-review. |
| 3. Lighting and exposure | not-assessed | Outside assigned focus. |
| 4. Materials and colour | not-assessed | Outside assigned focus. |
| 5. Geometry and scale | PASS | scene-facts.json: all shell parts are closed 8-vertex boxes, 0 non-manifold / loose / degenerate data; floor/wall/ceiling faces meet flush at z=0 and z=2.6 with no overlap, and the 0.05 m wall overhang sits outside the floor footprint (hidden). Door panel 0.84 x 2.1 m with casing outer 0.92 x 2.20 m; window frame outer approx 1.27 x 1.36 m, opening approx 1.13 x 1.29 m, sill approx 0.9 m; furniture-scale proportions plausible. WindowGlow is a single open quad (4 boundary edges), acceptable as an emissive card at the hero angle. No z-fighting or floating geometry visible in camera.png. |
| 6. Detail and storytelling | not-assessed | Furniture and props are later-milestone scope (deferred, not findings). |
| 7. Technical readiness | PASS | scene-facts.json: one scene, HeroCam active, 1920x1080, EEVEE, 64 samples, AgX, film_transparent false; fog-free render matches the sealed image hash; no missing-file artifacts (pink/placeholder textures) appear. Minor scene-health item N-01. |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.85 | minor | 1 | REQ-07 | camera.png (1920x1080), top-right region, right curtain x approx 1735-1845 px | R01 right-edge clipping is fixed horizontally (right curtain and window head now inside frame), but the right curtain runs off the TOP image edge: no top face or wall band is visible above it. The framing-margin fix is therefore incomplete. | Pitch HeroCam about 3 deg lower (rotation X approx 1.47 rad) or widen slightly to approx 19 mm so both curtains and the window head sit fully inside frame with a few percent margin. |
| N-01 | 0.62 | minor | 7 | REQ-10 / technical readiness | scene-facts.json, WindowGlow material slot: "WindowGlow_Material.003" | One emissive card exists but its slot carries a .003 duplicate suffix, showing redundant material datablocks were created across the T014/T015 material operations; unused copies bloat the file and invite edits on the wrong copy. | Purge orphan datablocks and assign one canonical WindowGlow material in the next change; confirm no unused material datablocks remain. |

## Re-review

- F-01 (R01, minor, REQ-07, right curtain clipped) -> OPEN. Horizontal clip is fixed: camera.png shows the right curtain entirely inside the right frame edge with roughly 4 percent margin. Vertical clip remains: the right curtain's top is cut by the top edge (orange pixels reach y=0 at x approx 1735-1845 px; the left curtain's top face is visible at y approx 75 px). Scene-facts confirms CurtainRight top at z=2.28 m, so the camera pitch/coverage, not the object, is the cause.
- F-02 (R01, minor, REQ-02, bare door slab) -> FIXED. scene-facts.json lists DoorCasingTop (0.06 x 0.92 x 0.08 m at z 2.12-2.20), DoorCasingLeft and DoorCasingRight (0.06 x 0.08 x 2.16 m at y -1.16 and -0.24), and a brass DoorHandle (0.07 m, 114 verts, at z 1.02 m, penetrating the door/casing faces so it is attached). The casing spans exactly the 0.84 m door plus trim. camera.png shows only a sliver of the door at the far left, so verification is geometric from scene facts, not visual.

## Residual risks

- External-dependency state is not enumerated in the supplied facts; the render shows no missing-file artifacts and REQ-10 forbids external assets, but linked/packed image or library data could not be listed from read-only evidence.
- Light types, energies, colours, and the HeroCam focal length are absent from scene-facts.json; exposure, falloff, and the exact lens value could not be verified numerically. The render is consistent with a 1.55 m eye height and a wide lens.
- The window is an emissive card 0.015 m in front of an unbroken back wall and the door is embedded in the left wall; both read correctly at the hero angle but have no wall openings or reveals, so future close-up or additional angles may expose flatness. Additional angles are deferred.
- WindowGlow's 4 non-manifold edges are the intended open card boundary, not a mesh defect; the plane is only visible from the room side.
- REQ-06's "computer clearly readable" clause and REQ-07's desk corner are deferred to the workstation milestone and were not graded as absent content.
