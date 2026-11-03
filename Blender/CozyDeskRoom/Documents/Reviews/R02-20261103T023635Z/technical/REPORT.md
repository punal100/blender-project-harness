# Grader Report — technical

- Round: R02-20261103T023635Z
- Grader: technical
- Focus: scale, geometry, topology, render settings, missing files, scene health
- Model/variant: punal-9router-compatable / ocg/deepseek-v4.1-flash / Max
- Target: eab716ac352124ac85f09028e1df4da28d28d127, saved scene SHA-256 6ab3c9ce00f99933b34cf1e007f8405a1fa03cae9b37f13ee2c46494ab860d15, project dirty
- Evidence key: fba94b8367825cb37cd9b2761aa21c539fec79af2e5bc0c3021d661b995a85f9
- Verdict: PASS
- Evidence inspected: renders/final/R02-20261103T023635Z.png (sha256 f995879be27400b104bfe4af371bd10acfeab5b268c38893135dab51fa5b50f9), _evidence/camera.png (same hash), _evidence/scene.txt (sha256 73905adf274f59e1b208099f300fb0e4313c32b38539f3933d451811ce3928c1)

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1 Spec fidelity | PASS | REQ-01 window item and REQ-06 shell/grounded-chair scope advanced: segmented back wall forms a 1.2 x 1.3 m aperture with glass, four rails and a sill (scene.txt lines 20-29), visible in camera.png; full REQ-01 prop set is future scope. |
| 5 Geometry and scale | PASS | Room 4.0 x 4.0 x 2.7 m, desk 1.7 x 0.76 x 0.76 m, seat top 0.51 m, sill 0.86 m (scene.txt lines 2, 10-17, 29); all meshes 0 non-manifold / 0 loose verts except the intended single-quad WindowGlass plane; chair base/pedestal/seat are continuous (0.025-0.055, 0.05-0.47, 0.41-0.51). See F-05 minor. |
| 7 Technical readiness | PASS | EEVEE, 1920x1080, Camera_Hero active, HDRI none, 25 objects, no stray helpers or empties (scene.txt lines 1-2); render and sealed camera evidence hashes match; no external file paths listed. |
| 2 Composition and camera | not-assessed | Outside assigned focus. |
| 3 Lighting and exposure | not-assessed | Outside assigned focus. |
| 4 Materials and colour | not-assessed | Outside assigned focus. |
| 6 Detail and storytelling | not-assessed | Outside assigned focus. |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-05 | 0.70 | minor | 5 | REQ-06 | scene.txt line 10 (rug top z=0.020) vs line 17 (base bottom z=0.025); camera.png lower-centre chair base | Chair base hovers 5 mm above the rug; its far 6 cm also overhangs the rug edge (base y 0.67-1.23 vs rug y <= 1.17), leaving 25 mm to the floor there. Not visible at hero framing, but not strictly grounded. | Lower ChairBase centre z to 0.035 and/or shift the chair about -0.06 y so the whole base rests on the rug. |

## Re-review

- F-01 chair base buried / pedestal gap: FIXED. Base bottom 0.025 now above rug top 0.020 (no burial); pedestal 0.05-0.47 meets base top 0.055 and seat bottom 0.41, so the assembly is continuous; camera.png shows base and pedestal connected on the rug.
- F-02 4.0 m footprint: deferred to the later dedicated shell change by scope; not re-graded this round.
- F-03 missing left wall/void: FIXED. LeftWall at (-2.06, 0, 1.35), 0.12 x 4.0 x 2.7 (scene.txt line 24); no void at the left edge of camera.png.
- F-04 no window aperture: FIXED. Back wall split into Bottom/Top/Left/Right around a 1.2 x 1.3 m opening, with WindowGlass, four WindowRail pieces and WindowSill (scene.txt lines 20-29); framed window with glass is visible in camera.png.

## Residual risks

- Hidden intersections: curtain bottoms (z 0.83) pass through the sill (z 0.825-0.895) by about 6.5 cm, and the 1.24 x 1.34 m glass plane overlaps the wall segments by 2 cm inside the wall thickness; both are occluded at this camera.
- No ceiling object exists; not visible at this camera and not required by the milestone.
- scene.txt does not enumerate image datablocks; external-file status is inferred from "HDRI none" and primitive-only materials, not directly listed.
- REQ-01 props (computer, monitor, keyboard, mouse, lamp, shelf, plant, decor) and the 3.6 m footprint remain future scope.