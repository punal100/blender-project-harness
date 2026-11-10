# Grader Report — visual

- Round: R07-20261110T074103Z
- Grader: visual
- Focus: composition, camera, lighting, colour, materials, mood
- Model/variant: punal-9router-compatable / nvidia/mistralai/mistral-large-4-1t-a52b / high (backup: deepseek-v4.1-flash / Max)
- Target: base 5d6d19b495f24fee38242e0559f62fb636d572b4, saved scene SHA-256 6939f3e46e5a5f1b9d791047f242cdcfbce7c7a0343dd640026da317c889fcb3, project dirty (M laundromat.blend, ?? renders/final/R07-20261110T074103Z.png)
- Evidence key: 8e5391065a7cde1cd737cf2d63ad273df09752ac58815387ab5d9cd3ae35731e
- Verdict: PASS
- Evidence inspected: renders/final/R07-20261110T074103Z.png (sha256 73bbf46f...), _evidence/scenes/Scene/camera.png (same sha256), _evidence/scenes/Scene/scene-facts.json and scene.txt (sha256 b5e1627f...), Reviews/R07-20261110T074103Z/manifest.json, Documents/REQUIREMENTS.md, Documents/Goals/01-project-brief.md

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1. Spec fidelity | PASS | REQ-01..REQ-10 all satisfied: scene.txt shows 8x12x2.9 m room, no exterior; 12 machines (Washer_L1-L6, Dryer_R1-R6) each with Body/Panel/Door/Rim; tables, bench, vending, coin changer, 2 FONT signs + poster, clock, 2 bins, floor grout grid, ceiling grid + 6 emissive panels; manifest confirms laundromat.blend + 1920x1080 hero PNG in renders/final/; REQUIREMENTS.md confirmed/current. |
| 2. Composition and camera | PASS | camera.png: one-point perspective straight down the aisle, symmetric rows left/right, Camera_Hero at (0,-5.7,1.6) = eye height at entrance, level rotation (90 deg X only), no clipping; subject readable with clean negative space on back wall around signage. |
| 3. Lighting and exposure | PASS | camera.png: 6 bright fluorescent ceiling panels plus daylight spill from behind camera; even readable brightness with clear depth to the back wall; no blown highlights (panels bright but not clipped), no crushed shadows; AgX, exposure 0 per scene.txt. |
| 4. Materials and colour | PASS | camera.png + scene.txt material names: sage machine faces, dark glass doors with stainless rims, off-white walls, warm-grey tiled floor with grout grid, grey drop ceiling, dark plastic bins/bench; palette matches REQ-08; only simple base-colour-style materials, no texture maps/bump visible. |
| 5. Geometry and scale | PASS | scene.txt dimensions: room 8x12x2.9 m, machines 0.95x0.9x1.05-1.1 m at real appliance scale, tables 1.6x0.7 m at 0.9 m height, bench/cart/bins proportionally grounded; all objects rest on floor, no floating or interpenetration visible in render. |
| 6. Detail and storytelling | PASS | camera.png shows LAUNDROMAT / WASH-DRY-FOLD signage, wall clock with visible hands, folding tables, bench, cart, vending machine, coin changer, bins, poster — a specific lived-in small business, no people or loose clothing (REQ-08). |
| 7. Technical readiness | PASS | manifest.json: render 1920x1080 EEVEE, 64 samples, camera set (Camera_Hero), scene sha256 recorded, no missing external files (no external assets by spec); evidence hashes match manifest. |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| (none) | — | — | — | — | — | No blocker or major finding in the assessed dimensions. | — |

## Re-review

- R06 F-01 (minor, clock face read blank because hands were not on the face plane) -> FIXED. T039/T040 moved Clock_Hands onto the clock face and darkened the clock; in R07 camera.png the back-wall clock now clearly shows white hands (L shape) against the dark face.

## Residual risks

- Camera lens value (35-50 mm equivalent, REQ-07) is not present in scene-facts.json; the rendered field of view is consistent with that range but could not be verified numerically.
- Individual material node parameters (roughness/metallic/transmission values, REQ-05) are not in the evidence, only material names; the render shows plausible simple surfaces with no maps, so this is accepted visually.
- REQ-10 record currency (WORKFLOW.md, REVIEW.md, README, ASSETS, DECISIONS) was assessed via the manifest spec hashes and the confirmed REQUIREMENTS.md, not by reading every document (optional docs skipped per round instructions).
