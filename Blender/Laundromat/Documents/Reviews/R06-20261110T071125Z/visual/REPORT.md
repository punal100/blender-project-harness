# Grader Report — visual

- Round: R06-20261110T071125Z
- Grader: visual
- Focus: composition, camera, lighting, colour, materials, mood
- Model/variant: punal-9router-compatable / nvidia/mistralai/mistral-large-4-1t-a52b / high
- Target: base d663ceca8f89cb4ce80422a4055c56dd3f3263ea, saved scene SHA-256 5e6690193a382f6fbe42eb318ea078e5572df586ee7a49c88a66fb176a3a3511, project dirty (M laundromat.blend, ?? renders/final/R06-20261110T071125Z.png)
- Evidence key: 0d5b2579bdbd824a128c60f73a92cab5d192d05a28eed5433bb8c80b7f2c8957
- Verdict: PASS
- Evidence inspected: renders/final/R06-20261110T071125Z.png (sha256 4baaf317fc061b4f4d8eae0276b554295ea1a50feac4757048b42188b0ba4bdd, byte-identical to _evidence/scenes/Scene/camera.png, viewed via blender_look), _evidence/scenes/Scene/scene-facts.json, _evidence/scenes/Scene/scene.txt, manifest.json, Documents/REQUIREMENTS.md, Documents/Goals/01-project-brief.md

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1. Spec fidelity (REQ-04, REQ-08) | PASS | camera.png + scene-facts.json: REQ-04 props all present — Table_01/02 (tops+legs), Bench, Vending_Body/Front + Coin_Changer, Sign_Laundromat + Sign_WashDry (FONT, emissive) + Poster_01, Clock_Body, Bin_01/02, Floor_Tile+Floor_Grout grid, Ceiling+Ceiling_Grid+Ceiling_LightPanels (emissive). REQ-08 palette matches: off-white walls, sage machine faces + teal vending, stainless rims, warm-grey tile floor, no people/clothing. |
| 2. Composition and camera | PASS | camera.png: Camera_Hero at (0,-5.7,1.6) eye height at entrance, aimed straight down the aisle; clean symmetric one-point perspective, 1920x1080, sign centered on back wall, aisle negative space reads clearly; nearest machines clipped at frame edges add depth without hurting readability. |
| 3. Lighting and exposure | PASS | camera.png: 3 ceiling lights + Light_Daylight behind camera + 6 emissive panels; bright, even, readable depth down the aisle, no blown highlights or crushed shadows; AgX view transform per scene-facts.json. |
| 4. Materials and colour | PASS | camera.png: sage/teal painted metal machines, dark control panels, tinted glass doors with metallic rims, laminate tables, dark plastic bench/bins — all simple plausible responses consistent with REQ-05 parameter set; palette restrained per REQ-08. |
| 5. Geometry and scale | PASS | scene-facts.json: machines 0.95x0.9x1.05/1.1 m at floor contact, tables 0.9 m high, bench 0.95 m, vending 1.9 m, bins 0.6 m, clock 0.44 m on back wall — believable real-world scale, no floating or interpenetration visible in render. |
| 6. Detail and storytelling | PASS | camera.png: LAUNDROMAT / WASH · DRY · FOLD signage, orange poster on left wall, clock disc, vending + coin changer, cart in aisle, two folding tables and bench at back wall — lived-in small-business logic; one minor detail issue (F-01). |
| 7. Technical readiness | not-assessed | Outside assigned visual focus for this partial milestone; manifest shows camera set, EEVEE, 1920x1080, no missing-file flags. |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.65 | minor | 6 | REQ-04 (wall clock detail) | camera.png back-wall clock face appears as a blank white disc; scene-facts.json: Clock_Body rotation [1.570796,0,0] but Clock_Hands rotation [0,0,0], so hands are not on the clock face plane | Clock reads blank at hero distance; hands not visible in render | Rotate/parent Clock_Hands onto the clock face plane (rotation [1.570796,0,0], offset from Clock_Body) |

## Re-review

Prior round R05-20261110T063748Z named, but ticket states prior findings/dispositions: none, and the harness denied reading the R05 report path as outside the frozen assignment; no re-review dispositions apply.

## Residual risks

- Trash bins (Bin_01/Bin_02) and clock hands are sub-resolution at the displayed render size; their presence is confirmed by the sealed scene inventory (scene-facts.json), but their on-screen appearance could not be fully verified.
- renders/final PNG and camera.png share one SHA-256, so only one frozen image exists; no independent second angle was available (live inspection not allowed for graders).
- REQ-03/05/06/07 are outside this milestone's graded set (REQ-04, REQ-08) and are deferred to the final full-spec review, not findings here.
