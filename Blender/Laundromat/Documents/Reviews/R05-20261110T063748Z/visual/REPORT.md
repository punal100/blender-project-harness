# Grader Report — visual

- Round: R05-20261110T063748Z
- Grader: visual
- Focus: composition, camera, lighting, colour, materials, mood
- Model/variant: punal-9router-compatable / nvidia/mistralai/mistral-large-4-1t-a52b / high
- Target: base 3a21a4395539b13bc6318afbc95e4c34ba6acab3, saved scene SHA-256 61ba90eab932a811c1b8e95a9152d2174b8036be2ae9b01f48d9f7b1795f3436, project dirty
- Evidence key: f0d17cbaeec691d29ebe44f3cebea7e7184ea27a9ffc4612c1841d6e41e0ce59
- Verdict: PASS
- Evidence inspected: renders/final/R05-20261110T063748Z.png (viewed via blender_look, 1920x1080), Documents/Reviews/R05-20261110T063748Z/_evidence/scenes/Scene/camera.png (identical sha256 to final render), .../scene-facts.json, .../scene.txt, manifest.json, Documents/REQUIREMENTS.md, Documents/Goals/01-project-brief.md

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1. Spec fidelity (REQ-03, REQ-08; milestone: right dryer row 4-6) | PASS | scene-facts.json: 12 machines in two facing rows (Washer_L1-L6 at x=-2.5, Dryer_R1-R6 at x=+2.5), each with Body + Panel + round Door (0.56 m, glass tint) + Rim (0.62 m, stainless); Dryer_R4/R5/R6 fully present at y=0.525/1.575/2.625 with all four parts. Render shows both rows down the aisle, sage faces, off-white walls, stainless rims, warm grey tile floor, no people. |
| 2. Composition and camera | PASS | camera.png / final render: Camera_Hero at (0, -5.7, 1.6 m), rotation 90 deg about X, level, centered — correct one-point perspective straight down the aisle at 1920x1080; rows frame the aisle symmetrically with readable depth to the back wall. |
| 3. Lighting and exposure | PASS | Render: 6 emissive fluorescent panels plus 3 ceiling lights and entrance daylight light (scene-facts); even warm-white exposure, clear depth down the aisle, no blown highlights on panels or walls, no crushed shadows. |
| 4. Materials and colour | PASS | Render + facts: sage machine faces (REQ-08 teal/sage option), dark control panels, dark tinted glass doors, metallic stainless rims, off-white matte walls, light warm-grey floor with grout grid; simple base-colour materials only, no texture stretching, AgX view transform sane. |
| 5. Geometry and scale | PASS | scene-facts: dryer bodies 0.95 x 0.9 x 1.1 m centered z=0.55 (base exactly z=0, ground contact); y-spacing 1.05 m > 0.9 m depth (0.15 m gaps, no interpenetration); door and rim concentric on the aisle-facing side; believable front-loader proportions. |
| 6. Detail and storytelling | PASS (milestone scope) | Each machine in render shows body, top control panel, round glass door, and drum rim. Room props/signage (REQ-04) are future milestone scope and deferred per review scope — not a finding. |
| 7. Technical readiness | PASS | Sealed 1920x1080 EEVEE render exists at renders/final/R05-20261110T063748Z.png; scene camera set to Camera_Hero; no external assets or missing files; no stray helpers in scene inventory. |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | No blocker or major findings in the assessed dimensions. | — |

## Re-review

No prior findings (ticket dispositions: none). The R04 prior visual report path was denied by the harness read gate, so no re-review items could be carried; nothing regressed in the assigned evidence.

## Residual risks

- Dryer_R5/R6 sit far down the aisle and are small in the render preview; their presence and part completeness were verified from scene-facts.json/scene.txt rather than by pixel-counting the 1280 px preview.
- Dryer_R4-R6 reference duplicated material datablocks (.001 suffixes) instead of the shared ones; the render shows identical sage/dark/stainless appearance, so no visible colour mismatch, but exact parameter equality of the .001 materials was not verifiable from the supplied evidence.
- Live scene inspection was not allowed; assessment is based on the frozen render and scene facts only.
- REQ-04 props, REQ-06/REQ-07 full checks, and remaining machine rows are outside this partial milestone and deferred.
