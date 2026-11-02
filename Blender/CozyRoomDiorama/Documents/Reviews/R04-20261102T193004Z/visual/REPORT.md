# Grader Report — visual

- Round: R04-20261102T193004Z
- Grader: visual
- Focus: composition, camera, lighting, colour, materials, mood, detail and storytelling
- Model/variant: ocg/deepseek-v4.1-flash / Max (backup)
- Target: base 0726a009734bfb64203fb2a0fd90bd72dc2492e0, saved scene SHA-256 5de0a54601c3c20486f49a7526aa3e002da714d5810ea14d5ffdfd6a169b7cc8, project dirty
- Evidence key: 74069afb488af29618b0c22d8acd61de3f908a252478bae7ebae5301d9401567
- Verdict: PASS
- Evidence inspected: `renders/final/R04-20261102T193004Z.png` (sha256 9cdf5cbf…, identical to `_evidence/camera.png`), `_evidence/scene.txt` (sha256 7585ca82…), `Documents/REQUIREMENTS.md`, `Documents/Reviews/R04-20261102T193004Z/manifest.json`. The assigned prior visual report read was refused by the harness gate, so prior dispositions are checked against the orchestrator summary and current evidence.

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1 Spec fidelity — REQ-03 | PASS | camera.png window region: cool blue exterior, city silhouette and four rain streaks, with warm desk-lamp and floor-lamp pools inside; scene.txt lights `Light_Window`, `Light_Desk`, `Light_Floor`. |
| 1 Spec fidelity — REQ-05 | PASS | camera.png: three-quarter view at 1920x1080, full diorama walls/floor/contents visible, no clipping; desk with lit monitor is the largest bright subject; scene.txt camera `Camera_Hero` at (5.48, -6.3, 3.82). |
| 1 Spec fidelity — REQ-06 | PASS | Warm amber walls/floor, cool blue window, muted brown-orange wood and green-teal rug/art; palette is cohesive and calm. Residual accent-hue note in F-07. |
| 1 Spec fidelity — REQ-07 | PASS | scene.txt: 2.7 m walls, 0.91 m desk, 0.45 m chair seat, 4.4x3.6 m floor; every mesh reports 0 non-manifold edges, 0 loose verts. Monitor is large (1.1 m body) but plausible for a desktop display. |
| 2 Composition and camera | PASS | Subject reads immediately; lamp balances the left wall; desk/monitor dominate the right; no crop of floor, walls or window. |
| 3 Lighting and exposure | PASS | Warm desk/floor lamp key with cool blue window fill; no blown lamp shades beyond small hotspots; shadows retain detail except intentionally dark PC tower side. |
| 4 Materials and colour | PASS | Muted, low-poly-consistent surfaces; window no longer shows a hard specular disc. F-07 minor hue note. |
| 5 Geometry and scale | PASS | No floating furniture in camera.png; chair base, plant pot, lamps and desk contact the floor; chair back now meets the seat (scene.txt z 0.51 = seat top). |
| 6 Detail and storytelling | PASS | Rain, city window, curtains, rug, wall art, plant, clutter-free desk and PC tower sell the rainy-evening setup. F-06 minor. |
| 7 Technical readiness | not-assessed | Outside assigned visual focus. |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-06 | 0.70 | minor | 6 | REQ-04 / REQ-05 | scene.txt L29-30 (Monitor_Body centre z 1.23, height 0.64; desk top z 0.91); camera.png desk region | Monitor panel rests its bottom edge directly on the desk; no stand, neck or foot exists, so the screen reads as a slab propped on the desktop. | Add a small stand/neck and foot raising the panel ~7-10 cm above the desk. |
| F-07 | 0.60 | minor | 4 | REQ-06 | camera.png rug under chair and wall art above desk | The cool accent surfaces render as sage/olive green rather than teal; the teal-accent clause of REQ-06 is only partly visible under the warm key. | Shift `Rug_Material.001` and `Wall_Art_Material.001` base hue 15-25 degrees toward blue-green, keeping value/saturation muted. |

## Re-review

- F-01 FIXED — `FloorLamp_Base`, `FloorLamp_Pole`, `FloorLamp_Shade` and `Light_Floor` exist (scene.txt L46-49); lit floor lamp with shade fills the left wall in camera.png.
- F-02 FIXED — rug and wall art are now cool green-teal accents and wood/floor are muted warm brown-orange; no saturated orange wood. Residual accent hue tracked as F-07.
- F-03 FIXED — window shows a soft blue exterior gradient with no hard specular disc; rain streaks are visible (camera.png window region); manifest records the T036 glass-material apply.
- F-04 FIXED — diorama fills the 16:9 frame with no clipped edges and the floor lamp anchors the previously blank left wall (camera.png).
- F-05 FIXED — `Chair_Back` spans z 0.51-1.07 and meets the seat top at 0.51 (scene.txt L34-35); camera.png shows the back attached to the seat.
- F-06 OPEN — monitor has no stand (detail above).

## Residual risks

- Prior visual report could not be read through the harness gate; R03 comparison relies on the supplied dispositions plus current evidence.
- No live scene inspection; colour, exposure and contact judgments come from one frozen 1920x1080 render and the object inventory.
- REQ-04 item-count completeness was not assessed (outside assigned requirements); scene.txt lists a single `Plant_Pot`/`Plant_Foliage` pair, so the required count of potted plants should be verified by the spec grader.
- Technical render settings and external-file checks are outside this focus.