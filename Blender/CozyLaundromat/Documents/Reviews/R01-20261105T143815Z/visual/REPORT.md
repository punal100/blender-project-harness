# Grader Report — visual

- Round: R01-20261105T143815Z
- Grader: visual
- Focus: composition, camera, lighting, colour, materials, mood, detail and storytelling
- Model/variant: ocg/deepseek-v4.1-flash / Max (backup)
- Target: a75386caa96250554f8c5a560aa74c1d9e98692d / bdf5b9c6897f1a234840cd7784dae4b929bdf40e87d7ec8a1bde2b42c7c930f5 / project dirty
- Evidence key: 38fe4ac255ac5b2ed7dd227cf78a57e93acf504a8b0659d56e62110c392cb27f
- Verdict: CHANGES_REQUIRED
- Evidence inspected: renders/final/R01-20261105T143815Z.png; Reviews/R01-20261105T143815Z/_evidence/scenes/Scene/camera.png; Reviews/R01-20261105T143815Z/_evidence/scenes/Scene/scene-facts.json

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1. Spec fidelity | FAIL | REQ-03, REQ-06 and REQ-07 fail per findings below |
| 2. Composition and camera | FAIL | camera.png: window clipped at left edge (F-01) |
| 3. Lighting and exposure | FAIL | camera.png: flat wash, no falloff/practicals, blown glass highlight (F-02, F-04) |
| 4. Materials and colour | FAIL | camera.png: floor shows no terrazzo/tile detail (F-03) |
| 5. Geometry and scale | PASS | scene-facts.json: shell 6.2 x 5.2 x 2.8 m, window opening/frame aligned; REQ-04 shell scale satisfied |
| 6. Detail and storytelling | not-assessed | Machines, counter, seating and props are deferred to later milestones |
| 7. Technical readiness | not-assessed | Outside assigned focus |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.90 | major | 2 | REQ-03 | camera.png, left edge of frame | Hero framing clips the window: the glass runs off the left image border and the left frame member is outside frame, so the required window is not shown intact | Re-aim or widen the hero camera (keep ~1.6 m eye level, 35-50 mm) so the full window frame sits inside frame with visual margin; re-check framing again once the machine wall is built |
| F-02 | 0.75 | major | 3 | REQ-06 | camera.png, whole frame | Lighting reads as an even, flat warm wash: no visible practical fixture, no light pooling or falloff on wall and floor, no readable soft-shadow hierarchy; it does not read as warm evening tungsten practicals | Bring the warm practicals into the shot or strengthen local warm pools and reduce the ambient fill so walls/floor show graded falloff and evening mood |
| F-03 | 0.70 | major | 4 | REQ-07 | camera.png, floor band across lower frame | Floor renders as a perfectly flat solid tan plane; no terrazzo chips, tile joints, roughness break-up or wear despite Floor_Terrazzo_Material | Give the floor a visible terrazzo/tile pattern with subtle tonal and roughness variation and light wear; verify it reads at hero distance |
| F-04 | 0.70 | minor | 3 | REQ-06 | camera.png, top-left of window glass | A specular blob on the window glass is clipped to pure white, contradicting "no blown-out whites" | Reduce glass specular/roughness or re-aim the window fill so the highlight stays below clipping |

## Residual risks

- Camera lens value is not in scene-facts.json; the ~35 mm-equivalent FOV was inferred from the rendered wall span, not read from camera data.
- Light types, colour temperatures and intensities are not in the supplied evidence, so tungsten intent is judged from the render tint only.
- Window exterior glimpse (REQ-05) and all appliances, counter, seating and props are deferred to later milestones and were not graded; the current wall emptiness is therefore not reported as a finding.
- Ceiling and fixtures are outside the current hero framing, so practical-source visibility could not be judged beyond their absence from the shot.
