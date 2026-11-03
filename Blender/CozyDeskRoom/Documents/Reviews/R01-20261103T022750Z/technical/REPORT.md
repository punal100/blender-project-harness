# Grader Report — technical

- Round: R01-20261103T022750Z
- Grader: technical
- Focus: scale, geometry, topology, render settings, missing files, scene health
- Model/variant: ocg/deepseek-v4.1-flash / Max
- Target: base 0ab4a61d00d040ac40f67a7bde62522727825233; saved scene SHA-256 deaf18d0e7bd22fa453e9a9239e1142d318fc5de61c0460f8c987a2ee9f5c65d; project dirty (M cozydeskroom.blend, M TASKSTRACKER.md, untracked T011/ and round render)
- Evidence key: e30e529031ccc1fb262b5eb189a4bb9f69bb8bde7958ef57e6129365ec32d653
- Verdict: CHANGES_REQUIRED
- Evidence inspected: renders/final/R01-20261103T022750Z.png (ff70a797…), Documents/Reviews/R01-20261103T022750Z/_evidence/camera.png (ff70a797…), _evidence/scene.txt (122b0b0d…), manifest.json, REQUIREMENTS.md, REVIEW.md, WORKFLOW.md, Goals/01-project-brief.md
- Scope: partial milestone M1 (room shell and main furniture), REQ-01 and REQ-06 only; computer, lamp, shelf, plant and decor are deferred to later milestones and are not findings.

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1 Spec fidelity (REQ-01, REQ-06 only) | FAIL | Desk, chair, window, curtains and rug exist (scene.txt 5-19); REQ-06 grounding and footprint fail (F-01, F-02) |
| 2 Composition and camera | not-assessed | Outside assigned focus |
| 3 Lighting and exposure | not-assessed | Outside assigned focus |
| 4 Materials and colour | not-assessed | Outside assigned focus |
| 5 Geometry and scale | FAIL | F-01, F-02, F-03, F-04 |
| 6 Detail and storytelling | not-assessed | Outside assigned focus; deferred props not graded |
| 7 Technical readiness | PASS | scene.txt: EEVEE, 1920x1080, camera Camera_Hero set, 17/17 objects, HDRI none; all meshes 0 non-manifold / 0 loose verts; no stray helpers or empties; render matches evidence hash |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.85 | major | 1, 5 | REQ-06 | scene.txt lines 12, 18, 19; camera.png bottom centre | Chair base is buried in the 0.02 m-thick rug: ChairBase spans z -0.005..0.025 (bottom 5 mm below floor, top 5 mm above rug) and ChairPedestal starts at z 0.03, leaving a 5 mm gap to the base. The chair reads as a bare post plugged into the rug, and the base/floor intersection violates grounded, non-intersecting furniture. | Raise ChairBase to rest on the rug top (centre z 0.035) and lower/extend ChairPedestal to meet the base top (bottom at z 0.05) so both parts touch and nothing penetrates the floor or rug. |
| F-02 | 0.80 | minor | 5 | REQ-06 | scene.txt lines 5-7 | Room footprint is 4.0 x 4.0 m interior (floor 4.0x4.0, walls at x/y 2.06) against the confirmed roughly 3.6 x 3.6 m; height 2.7 m is correct. | Bring floor edge and wall offsets to a 3.6 m interior (walls at +/-1.86 with 0.12 thickness) and reposition desk, chair, rug and window consistently. |
| F-03 | 0.75 | minor | 1, 5 | REQ-01 / REQ-06 | camera.png far-left border; scene.txt lacks a left wall | Shell has only back and right walls; the leftmost frame edge shows a dark void strip where the back wall ends, so the room does not read fully enclosed. | Add a left wall segment (or extend the back wall) so no world background is visible inside the hero frame; keep the front open only. |
| F-04 | 0.70 | minor | 5 | REQ-01 | scene.txt lines 6-9; camera.png window area | WindowFrame is a solid 1.24x0.07x1.4 cube and WindowGlass is a zero-thickness plane 8 cm in front of the solid BackWall; there is no wall aperture, so the window is a flat panel on plaster rather than an opening. Acceptable as blockout, not as final shell geometry. | Cut a window opening in BackWall and model the frame as four rails around it with the glass in the aperture; remove the solid frame slab. |

## Re-review

Not applicable (first review; no prior round).

## Residual risks

- Image/texture datablock dependencies and packed-data status are not enumerated in scene.txt; missing-file acceptance is inferred from "HDRI none" and primitive-only materials, not directly verified.
- Camera focal length, clipping range, colour management and light energy are not exposed in the evidence; not assessed.
- Lighting, materials and composition belong to the visual grader's focus and were not assessed here.
- The .blend is dirty in the manifest; findings apply to the stated scene SHA-256 only.
