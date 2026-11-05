# Grader Report — visual

- Round: R01-20261105T044624Z
- Grader: visual
- Focus: composition, camera, lighting, colour, materials, mood, detail and storytelling
- Model/variant: ocg/deepseek-v4.1-flash / Max (backup role)
- Target: base ed7a25f01c239f072bc350b002cdb641ba7b3dcc, saved scene SHA-256 27a5219d16c08fbcc7dee036f1053fa3a1d40f29cd9475d96f35ca464cdc1c49, project dirty
- Evidence key: 9d4e636d28ec798fed644dceacbeef25032c972710c36b807d50e95d55a923e1
- Verdict: CHANGES_REQUIRED
- Evidence inspected: Documents/Reviews/R01-20261105T044624Z/_evidence/scenes/Scene/camera.png (sha256 c9e27134...), renders/final/R01-20261105T044624Z.png (identical sha256 c9e27134...), .../scenes/Scene/scene-facts.json and scene.txt (sha256 52c14748...), Documents/REQUIREMENTS.md, Documents/Goals/01-project-brief.md

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1 Spec fidelity (REQ-02, REQ-06, REQ-07) | FAIL | REQ-02 met per scene-facts (3.6 x 3.2 m floor/walls, 2.6 m ceiling, window with frames, door present); REQ-07 met per facts and camera.png (HeroCam at 1.55 m, 1920x1080); REQ-06 fails per F-01/F-03 |
| 2 Composition and camera | PASS | camera.png: eye-level three-quarter framing, window readable, left negative space reserved for the future desk; only minor right-edge crop F-02 |
| 3 Lighting and exposure | FAIL | camera.png: blown white wall hotspot and near-black curtain shadows (F-01); no visible cool window spill (F-03) |
| 4 Materials and colour | PASS | camera.png: warm tan walls/orange curtains against cool blue window; flat matte surfaces consistent with the base-colour-only constraint; no colour-space anomaly visible |
| 5 Geometry and scale | not-assessed | Outside assigned focus; technical grader |
| 6 Detail and storytelling | PASS | camera.png: window frames, curtains, and door (geometry per facts) cover shell-level detail; furnishing/storytelling is deferred by this milestone and not counted |
| 7 Technical readiness | not-assessed | Outside assigned focus; technical grader |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.90 | major | 3 | REQ-06 | camera.png / renders/final/R01-20261105T044624Z.png, left wall and wall below both curtains; scene-facts WarmFill at (0,0,2.3) | The ceiling WarmFill overexposes the left wall to near-white over a large gradient, while both curtains cast near-black, hard-edged shadow patches on the wall below them; the single-fill EEVEE setup leaves shadow interiors black. This visibly fails "soft shadows" and "calm intimate mood". | Reduce WarmFill energy and move it away from the curtain-top plane (e.g. z around 2.0, off room centre), warm its colour, and add a low-energy fill so shadows hold detail; rebalance the window light so the cool side contributes visible spill. |
| F-02 | 0.72 | minor | 2 | REQ-07 | camera.png, right border | The right curtain is clipped by the right frame edge and the window sits tight against the border with no margin on that side. | Yaw HeroCam 3-5 degrees toward the window or widen the lens slightly, keeping eye level near 1.5 m, so the full window and both curtains sit inside the frame. |
| F-03 | 0.66 | minor | 3/4 | REQ-06 | camera.png, window pane and the floor/wall near it | The pane is a uniform saturated blue with no visible cool light spill on the surrounding wall or floor, so the window reads as a luminous panel rather than a dusk window; the warm/cool contrast is carried only by the pane. | Deepen/desaturate the pane colour, raise roughness and reduce metallic so room lights do not reflect as a glossy blob, and add modest cool light from the window onto the floor and window wall. |

## Residual risks

- Light types, energies, and colours are not in scene-facts (only transforms); F-01/F-03 are inferred from the render, so exact light settings are unverified.
- Focal length is not recorded in the evidence; "wide three-quarter" was judged from the rendered framing only.
- Door and ceiling are present in scene-facts but outside the hero framing; their materials/detail were not visually assessed.
- Desk, computer, lamps, furniture, and future storytelling content are deferred by the "Room shell and view" milestone and were not graded.
- Materials are constrained to flat base colour/roughness/metallic; missing surface texture is not reported.
