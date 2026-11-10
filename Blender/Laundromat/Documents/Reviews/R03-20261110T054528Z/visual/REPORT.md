# Grader Report — visual

- Round: R03-20261110T054528Z
- Grader: visual
- Focus: composition, camera, lighting, colour, materials, mood
- Model/variant: punal-9router-compatable / nvidia/mistralai/mistral-large-4-1t-a52b / high
- Target: base fc9a8b0f37ba13f124f205c81565dd5d343e4d66, saved scene SHA-256 3ee473e58a10d01e6a3db24e70f3c482451a8be4dc11ed1f1113a109a8648714, project dirty
- Evidence key: e1384d2e4d402dcf0e0ea4585fb6a048bbc76b6ff68c57f40f1e9748df5cd8f8
- Verdict: PASS
- Evidence inspected: renders/final/R03-20261110T054528Z.png (viewed, 1920x1080); _evidence/scenes/Scene/camera.png (same sha256); _evidence/scenes/Scene/scene-facts.json; _evidence/scenes/Scene/scene.txt; manifest.json; REQUIREMENTS.md; Goals/01-project-brief.md. R02 prior visual REPORT.md read was harness-gated; R02 dispositions taken from the grader ticket (F-01 FIXED, F-02 FIXED, F-03 PARTIAL).

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1. Spec fidelity (REQ-03 left-row scope, REQ-08) | PASS | scene-facts.json: Washer_L1..L6 each have Body (Washer_Sage_Material), Panel (ControlPanel_Dark_Material), Door (Door_Glass_Tint_Material, 64-vert round mesh), Rim (Stainless_Rim_Material, 0.62 m ring) — every left machine satisfies body/panel/round glass door/drum rim. Render shows sage faces, dark panels, ringed round doors. REQ-08: off-white walls, sage machine faces, stainless rims, light warm floor all visible in R03 png. Two-row/10-machine count is deferred to the right-row milestone, not a finding here. |
| 2. Composition and camera | PASS | scene-facts: Camera_Hero at (0, -5.7, 1.6 m), rotation 90° about X, looking straight down +Y aisle; 1920x1080, EEVEE, AgX. Render shows clean one-point perspective, hero row on the left, depth to back wall; no clipping of the camera into geometry. |
| 3. Lighting and exposure | PASS | Render: six emissive ceiling panels lit, even warm-white falloff, back wall readable, no blown highlights or crushed shadows; AgX exposure 0. Flat but within spec for this milestone (daylight-spill balance is later scope). |
| 4. Materials and colour | PASS | Palette matches REQ-08: off-white Arch_WhitePaint walls, sage Washer_Sage bodies, dark control panels, stainless rims, light tile floor. Simple principled params only; no texture maps. Residual: door glass renders very dark (see F-04). |
| 5. Geometry and scale | not-assessed | Outside assigned focus for this milestone beyond what spec fidelity covers; machine dims (0.95 x 0.9 x 1.05 m) and ground contact (z=0.525 centre, base at 0) are plausible per scene-facts. |
| 6. Detail and storytelling | not-assessed | Right row, props, signage are deferred milestone scope. |
| 7. Technical readiness | not-assessed | Outside assigned visual focus; render exists at 1920x1080, no missing-file indicators in evidence. |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-04 | 0.70 | minor | 4 | REQ-03 (round glass door readability) | R03-20261110T054528Z.png, left row doors | Door_Glass_Tint (transmission 0.55) renders near-black in EEVEE; doors read as dark discs rather than glass, though the stainless rims ring them correctly. | Enable screen-space refraction for the door material or raise transmission/lower tint density so a hint of interior reads through; keep rim unchanged. |

## Re-review

- F-01 (major, no drum rim): FIXED — scene-facts.json lists Washer_L1_Rim..Washer_L6_Rim, each 0.62 m Stainless_Rim_Material ring co-located with its door at x=-2.018; visible as light rings around the dark doors in the R03 render.
- F-02 (minor, opaque door): FIXED — all six Washer_L*_Door objects now use Door_Glass_Tint_Material (transmission 0.55, teal tint) per scene-facts.json. Residual darkness noted as new minor F-04.
- F-03 (minor, near-row crop): FIXED — Camera_Hero moved to y=-5.7 (scene-facts.json); R03 render shows the row receding down the aisle with roughly four to five doors in frame versus the tighter R02 crop. The nearest washer still sits at the left frame edge, which is inherent to a centered entrance camera on the aisle axis and acceptable for the one-point hero view.

## Residual risks

- Right-hand machine row, dryers, props (tables, vending, signage, clock, bins) are unbuilt deferred scope; the right half of the frame is intentionally empty this round and was not graded.
- Door-glass darkness (F-04) may become more visible once interior drum detail or brighter key light is added in later rounds.
- R02 visual REPORT.md could not be read (harness workflow gate on that path); R02 dispositions were taken from the assigned ticket text instead.
- Live scene inspection was not permitted; all findings rest on the frozen R03 evidence files.
