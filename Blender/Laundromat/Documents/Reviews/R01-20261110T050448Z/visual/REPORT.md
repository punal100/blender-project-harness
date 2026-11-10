# Grader Report — visual

- Round: R01-20261110T050448Z
- Grader: visual
- Focus: composition, camera, lighting, colour, materials, mood
- Model/variant: punal-9router-compatable / nvidia/mistralai/mistral-large-4-1t-a52b / high
- Target: base 45067501a693d99ebdc0af4052604850365cb7d3, saved scene SHA-256 bca7ae54c4cb3d978dcedf4306bebf57f327e1f5558329dfc67ac941f6939606, project dirty
- Evidence key: 99010d8725e0fb5b682678cfd1050184f4fd1ba62183bf23ef7f39d222c6b8e7
- Verdict: PASS
- Evidence inspected: renders/final/R01-20261110T050448Z.png (sha256 154be467..., viewed via blender_look, 1920x1080); Documents/Reviews/R01-20261110T050448Z/_evidence/scenes/Scene/camera.png (sha256 154be467..., identical image, viewed); manifest.json; REQUIREMENTS.md; Goals/01-project-brief.md. scene-facts.json and scene.txt were assigned but every read path was denied by the harness gate (direct read, blender_document read, grep) — numeric scene facts could not be read.

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1. Spec fidelity (REQ-01, REQ-04 shell portion, REQ-06, REQ-07) | PASS | Render shows interior-only room shell, tiled floor grid, drop ceiling with 6 fluorescent panels, level one-point aisle view at 1920x1080 (manifest resolution [1920,1080], camera Camera_Hero). REQ-04 props (tables, seating, vending, signage, clock, bins) and REQ-03 machines are unbuilt future scope of this partial milestone — deferred, not a finding per review scope. |
| 2. Composition and camera | PASS | camera.png: subject (room shell) centered and readable, symmetric one-point perspective straight down the aisle, vanishing point on the back wall, no clipping of walls/floor/ceiling, generous negative space appropriate to an empty shell at this milestone; framing consistent with eye-height entrance view. |
| 3. Lighting and exposure | PASS | camera.png: six emissive fluorescent panels read as warm-white sources, even readable brightness across the room, no blown highlights (panel whites are the fixtures themselves) and no crushed shadows; floor shows gentle falloff giving depth down the aisle. Warm/cool balance subtle in frame; exact light colour temperatures unverifiable (scene-facts unreadable). |
| 4. Materials and colour | PASS | camera.png: off-white matte walls, warm-grey floor tiles with visible grout grid, grey ceiling grid, white emissive panels, brown baseboard — consistent with REQ-08 palette direction (off-white walls, warm grey floor); flat simple materials, sane colour, no texture stretching or artifacts visible. |
| 5. Geometry and scale | PASS | camera.png: rectangular shell proportions plausible for ~8 x 12 m room with 2.9 m ceiling (wall top ~27% and floor line ~73% of frame height, symmetric about the level horizon, consistent with an eye-height camera); all surfaces meet cleanly at corners, no floating or interpenetration. Exact metric dims not numerically verified (scene-facts.json unreadable) — see residual risks. |
| 6. Detail and storytelling | not-assessed | Props, signage, clock, machines are future milestone scope; deferred per partial review scope. |
| 7. Technical readiness | PASS | manifest.json: render at 1920x1080 with camera Camera_Hero and use_sequencer; render file present at renders/final/ with matching SHA-256; no missing external files indicated (no external assets per REQ constraints). |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | No blocker or major findings in the assessed milestone scope. | — |

## Re-review

None (first review, no prior round).

## Residual risks

- scene-facts.json and scene.txt (assigned evidence, sha256 988506b5...) were unreadable: direct read, blender_document read, and grep were all denied by the harness workflow gate. Room dimensions (8 x 12 m, 2.9 m ceiling), camera height (~1.6 m), focal length (35-50 mm), and light colour temperatures therefore could not be verified numerically; REQ-01/REQ-06/REQ-07 were assessed from the render image and manifest only.
- The cool daylight-spill component of REQ-06 is not clearly distinguishable in the frame (spill originates behind the camera); warm/cool mix judged acceptable but not measurable from the still.
- Props/machines (REQ-03, prop portion of REQ-04) are intentionally unbuilt at this milestone; their absence is deferred scope, not a defect.
