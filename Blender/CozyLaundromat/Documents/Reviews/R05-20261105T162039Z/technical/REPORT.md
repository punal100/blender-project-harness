# Grader Report — technical

- Round: R05-20261105T162039Z
- Grader: technical
- Focus: scale, geometry, topology, render settings, missing files, scene health
- Model/variant: ocg/deepseek-v4.1-flash / Max (backup role per manifest)
- Target: base a637a12513bd5aaa588fc778b6de0266d630ea6c, saved scene SHA-256 a9543155b0c7ffee88b9bfebb374395b15944c54b61f49c3159068443cbe7516, dirty (uncommitted .blend, TASKSTRACKER.md, Tasks/T049/, R05 render)
- Evidence key: a3ee8253c008b3263bcc8fb5b9178544adf615bf049e02459f5ec4f58744e361
- Verdict: PASS
- Evidence inspected: renders/final/R05-20261105T162039Z.png; Reviews/R05-20261105T162039Z/_evidence/scenes/Scene/camera.png; Reviews/R05-20261105T162039Z/_evidence/scenes/Scene/scene-facts.json; Reviews/R05-20261105T162039Z/_evidence/scenes/Scene/scene.txt (same hash as scene-facts); Reviews/R05-20261105T162039Z/manifest.json; Documents/REQUIREMENTS.md; Documents/Goals/01-project-brief.md

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1 Spec fidelity (milestone technical facets) | PASS | Six Washer_01–06 bodies, six Washer_Rim_01–06, six Washer_Glass_01–06, Washer_Control_Strip and Sign_Laundry present; bodies measure 0.54 x 0.65 x 0.85 m (brief: ~0.85 m tall); every object carries exactly one material slot (scene-facts.json). Technical facets of REQ-05/REQ-07/REQ-08 advanced by this milestone; counter, props, drums and lighting are deferred scope. |
| 2 Composition and camera | not-assessed | Outside technical focus. |
| 3 Lighting and exposure | not-assessed | Outside technical focus. |
| 4 Materials and colour | not-assessed | Visual response and palette are outside technical focus; slot presence checked under dimension 7. |
| 5 Geometry and scale | PASS | All meshes report 0 non-manifold edges, 0 loose vertices, 0 degenerate faces; washer bottoms sit at z=0 on Floor_Terrazzo top z=0; row spacing 0.58 m with 0.04 m machine gaps, no machine-to-machine overlap. Minor intersections F-01/F-02 only. |
| 6 Detail and storytelling | not-assessed | Counter, props, seating, plant and drum detail are deferred by the milestone. |
| 7 Technical readiness | PASS | Render 1920x1080, EEVEE, 64 samples, AgX view transform, Camera_Hero set as scene camera, single scene/collection, no stray helpers, FONT sign valid; no external images or linked libraries evidenced in the supplied inventory; manifest asset_check is null (see R-01). |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.90 | minor | 5 | REQ-08 | scene-facts.json: Floor_Rug y 1.6–2.4 m with top z=0.02; Washer_01–05 front face y=1.925, bottom z=0; overlap region is below the R05 camera frame | The 2 cm-thick floor rug extends 0.475 m under the washer fronts, so five machines' bases (z=0) pass through the rug's upper 1.6 cm. Machines contact the floor correctly, but the rug/machine overlap is unintended. | Move Floor_Rug forward (centre y approx 1.50, rear edge <=1.90) or trim its depth so it clears the machine fronts. |
| F-02 | 0.85 | minor | 5 | REQ-08 | scene-facts.json: Window_Frame x -2.21..-0.59, y 2.555..2.615, z 0.77..2.33; Washer_01 x -0.62..-0.08, y 1.925..2.575, z 0..0.85; R05 render, window lower-right corner near x 530/1600, y 600–640 | Washer_01's rear-left top corner overlaps the window trim by 3 cm (x) x 2 cm (y) x 8 cm (z); the machine top cuts the sill/trim line. The intersection itself is occluded by the machine, but it is real geometry overlap. | Offset the washer assembly (six bodies, rims, glass, control strip) +0.05 m in X; row then spans x -0.57..2.87, clear of the frame and still 0.23 m from Wall_Right. Alternatively narrow the window frame's right stile by 4 cm. |

## Re-review

No open R04 technical findings were carried into R05 (per the ticket disposition); nothing to re-check.

## Residual risks

- R-01: Missing-file health cannot be independently proven from scene-facts.json, which does not enumerate images, libraries or external data; manifest asset_check is null. No external asset is used by this milestone's operations (T043–T049 are mesh/text only), and the sealed render shows no missing-texture artifacts, so this is treated as low risk.
- R-02: use_sequencer is true with an empty strip list (manifest and scene-facts). The delivered render is correct, but disabling Sequencer when unused avoids a known empty-sequencer render pitfall.
- R-03: The sixth machine sits at the extreme right frame edge and its door is partially cut by the frame; composition/camera is outside my focus, so the visual grader should confirm all six door faces read clearly.
- R-04: Drums are not present as interior geometry; the doors are opaque dark discs. Drum detail plus counter, props, seating and plant are deferred to later milestones and were not assessed.
- R-05: The prior R04 technical report could not be opened under the frozen assignment (read denied), so the prior-round disposition was taken from the ticket.
