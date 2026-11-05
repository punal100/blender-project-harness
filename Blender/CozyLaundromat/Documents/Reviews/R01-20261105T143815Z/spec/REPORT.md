# Grader Report — spec

- Round: R01-20261105T143815Z
- Grader: spec
- Focus: requirement and acceptance fidelity, scope, deliverable completeness
- Model/variant: primary punal-9router-compatable / codex-everywhere/gpt-6.1-sol / xhigh; backup punal-9router-compatable / ocg/deepseek-v4.1-flash / Max
- Target: base a75386caa96250554f8c5a560aa74c1d9e98692d, saved scene SHA-256 bdf5b9c6897f1a234840cd7784dae4b929bdf40e87d7ec8a1bde2b42c7c930f5, project dirty
- Evidence key: 38fe4ac255ac5b2ed7dd227cf78a57e93acf504a8b0659d56e62110c392cb27f
- Verdict: CHANGES_REQUIRED
- Evidence inspected: renders/final/R01-20261105T143815Z.png; Documents/Reviews/R01-20261105T143815Z/_evidence/scenes/Scene/camera.png; .../scene-facts.json; .../scene.txt; Documents/Reviews/R01-20261105T143815Z/manifest.json; Documents/REQUIREMENTS.md; Documents/Goals/01-project-brief.md

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1. Spec fidelity | FAIL | REQ-03: Camera_Hero at z=1.62 m is eye-level, but the sealed camera render cuts the window's left frame and glass at the left image border (camera.png, x=0-310 px of 1600). REQ-06: lighting is warm amber with cream walls and teal window trim, but a clipped pure-white specular blob sits on the upper-left window pane (camera.png, approx. x=140-205, y=35-115 of 1600). REQ-04: PASS for the shell — floor 6.2 x 5.2 m, walls at x=+/-3.15 and y=+/-2.65, ceiling underside at 2.8 m (scene-facts.json). REQ-07: PASS for the shell portion — cream painted walls, flat tinted non-transmissive window glass, teal trim, terrazzo-named floor; appliance/counter/seating materials are future scope. |
| 7. Technical readiness / deliverable completeness | PASS | Camera_Hero is the scene camera; 1920x1080, EEVEE 64 samples, AgX; no image or external-file datablocks present; sealed round render exists at the assigned path (scene-facts.json, manifest.json). Room shell is a closed 6.2 x 5.2 x 2.8 m volume with the window aperture formed from wall segments. |
| 2-6. Composition, lighting, materials, geometry, detail | not-assessed | Outside assigned focus; remaining future content not built yet. |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.90 | major | 1 | REQ-03 | camera.png, left image edge (x=0, window visible 0-310 px of 1600) | The hero camera is aimed so the window's left frame/glass is cut off by the left border. REQ-03 requires the window in frame without clipping. | Yaw Camera_Hero a few degrees toward the window (or widen the lens within 35-50 mm) while keeping the eye height near 1.62 m, then re-seal and confirm the full window frame plus trim sits inside the frame with margin. |
| F-02 | 0.65 | minor | 1 | REQ-06 | camera.png, upper-left window pane (approx. x=140-205, y=35-115 px of 1600) | A small pure-white, blooming specular hotspot on the window glass is clipped to white against the otherwise warm, controlled image. REQ-06 calls for no blown-out whites. | Reduce or soften Light_Window_Fill, move it off the glass reflection axis, or raise Window_Glass roughness slightly; re-seal and check the highlight stays below clipping. |
| F-03 | 0.75 | minor | 1 | REQ-06 | scene-facts.json, Light_Ceiling_2 at (1.1, 0.6, 2.45) and Ceiling_Fixture_1 at (-1.2, 0.4, 2.74) | Two ceiling light sources exist but only one has a fixture mesh; the second practical has no visible housing, and the first light source floats ~0.25 m below its fixture with no connecting geometry. Not visible in the current hero frame because the ceiling is out of shot. | Add a matching ceiling fixture for Light_Ceiling_2 (or remove/merge that light) and tie each fixture's light source to the housing. |

## Re-review

None — first review round.

## Residual risks

- Camera focal length/FOV is not recorded in scene-facts.json, so the 35-50 mm equivalent requirement cannot be verified from saved evidence; geometric estimate from the render is close to 35 mm and should be confirmed on the camera datablock.
- Light colour temperatures and energies are not captured in the evidence; warmth is judged only from the render.
- REQ-05 and the appliance, counter, seating, and prop portions of REQ-07 are future milestone scope and were not assessed.
- "Worn" floor character cannot be judged from a flat-shaded terrazzo-coloured surface under the stated flat-material approximation.
