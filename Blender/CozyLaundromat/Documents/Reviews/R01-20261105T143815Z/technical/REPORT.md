# Grader Report — technical

- Round: R01-20261105T143815Z
- Grader: technical
- Focus: scale, geometry, topology, render settings, missing files, scene health
- Model/variant: punal-9router-compatable / ocg/deepseek-v4.1-flash / Max (runtime backup role per manifest)
- Target: a75386caa96250554f8c5a560aa74c1d9e98692d / bdf5b9c6897f1a234840cd7784dae4b929bdf40e87d7ec8a1bde2b42c7c930f5 / dirty (M cozylaundromat.blend, M Documents/TASKSTRACKER.md; untracked Documents/Tasks/T010/, renders/final/R01-20261105T143815Z.png)
- Evidence key: 38fe4ac255ac5b2ed7dd227cf78a57e93acf504a8b0659d56e62110c392cb27f
- Verdict: CHANGES_REQUIRED
- Evidence inspected: renders/final/R01-20261105T143815Z.png; Documents/Reviews/R01-20261105T143815Z/_evidence/scenes/Scene/camera.png (byte-identical to the final render); .../scenes/Scene/scene-facts.json; .../scenes/Scene/scene.txt (byte-identical to scene-facts.json per manifest SHA-256); Documents/Reviews/R01-20261105T143815Z/manifest.json

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1 Spec fidelity (REQ-03, REQ-04, REQ-06, REQ-07) | FAIL | REQ-03: full window not framed, left frame member cropped in camera.png (F-01). REQ-04: room interior 6.2 x 5.2 m, ceiling underside 2.8 m, camera 1.62 m in scene-facts.json. REQ-06: three warm-lit light objects and soft falloff in camera.png; minor practical mounting inconsistency F-02. REQ-07: all seven shell meshes carry a material; glass is flat tinted without transmission, as the constraints require. |
| 2 Composition and camera | not-assessed | Visual grader focus; the REQ-03 clipping failure is recorded under dimension 1. |
| 3 Lighting and exposure | not-assessed | Visual grader focus; light colour/energy are not in the supplied facts. |
| 4 Materials and colour | not-assessed | Visual grader focus. |
| 5 Geometry and scale | PASS | Floor 6.2 x 5.2 x 0.1 m at z=-0.05..0, walls span 6.2 x 5.2 m to z=2.8, correct overlap at window opening; every mesh is manifold with 0 loose verts and 0 degenerate faces; minor ceiling-fitting placement F-02. |
| 6 Detail and storytelling | not-assessed | Machines, counter, seating and props are future milestone scope. |
| 7 Technical readiness | PASS | 1920x1080, EEVEE, 64 samples, AgX, film opaque, Camera_Hero set; no default Cube/Light/Camera remains; manifest apply tasks contain only create_mesh/create_light/create_camera/material/render_settings, no import or intake, so no external file dependency was introduced. |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.95 | major | 1 | REQ-03 | camera.png: window occupies x≈0-360 px of 1920 and its blue pane runs straight into the left image edge with no left frame member; scene-facts Camera_Hero at (-0.6, -2.3, 1.62), rotation Z -0.284 rad | The hero shot clips the window: only about 0.7 m of the 2.1 m window is visible and the left vertical frame is outside the frame, while roughly three quarters of the image is blank wall. REQ-03 requires the window to be shown without clipping. | Re-aim and/or offset the camera so the whole 2.1 m window frame sits inside the ~52 deg horizontal field (e.g. yaw left about 10-15 deg, rotation Z from -0.284 toward roughly -0.05 rad, and/or shift the camera ~0.5-1.0 m toward the window side); re-render at 1920x1080 and re-check at the furnishings milestone. |
| F-02 | 0.85 | minor | 5 | REQ-06 / scene health | scene-facts.json: Ceiling_Fixture_1 at z=2.74, dims 0.36 x 0.36 x 0.09 (top at 2.785, 15 mm below the 2.8 m ceiling); Light_Ceiling_1 at z=2.45; Light_Ceiling_2 at (1.1, 0.6, 2.45) with no fitting at its location | The only ceiling fitting floats 15 mm below the ceiling, and the second ceiling practical has no visible fixture, so the fixture-to-light inventory is inconsistent for a lighting milestone. Not visible in this camera view. | Seat the fitting flush (centre z≈2.755 so its top meets 2.8) and add a matching ceiling fitting for Light_Ceiling_2 above its light origin. |

## Re-review

Not applicable — first review.

## Residual risks

- Light object properties (type, energy, colour temperature, shadow softness) are absent from scene-facts.json; the warm tungsten cast was judged from the render only. The white specular on the glass at upper-left is consistent with a mirror reflection of Light_Ceiling_1, not necessarily a blown white, but the visual grader should confirm its acceptability.
- Camera lens and clip metadata are absent from scene-facts.json; the 35-50 mm equivalent requirement was inferred from the rendered field of view (~52 deg horizontal, about 37 mm on a 36 mm sensor), not read from stored lens data.
- Scene-file external-library references were not inventoried in the evidence; no import/intake operation exists in the manifest, so no missing external file is expected, but a strict asset check on the unchanged scene remains the completion gate.
- REQ-04 appliance/counter scale and REQ-07 appliance/counter/seating materials cover future milestone content and were not graded as absent scope.
