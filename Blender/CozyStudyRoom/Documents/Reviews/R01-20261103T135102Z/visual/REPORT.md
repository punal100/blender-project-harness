# Grader Report — visual

- Round: R01-20261103T135102Z
- Grader: visual
- Focus: composition, camera, lighting, colour, materials, mood, detail and storytelling
- Model/variant: ocg/deepseek-v4.1-flash / Max (backup; primary Codex-Everywhere-Claude/claude-sonnet-5-5 / xhigh)
- Target: base fad8c41129faf9c6940bed4a67a476bb45e48459, saved scene SHA-256 ded80effe68bbddb1e576b00a92ef270d9954828a48a1798b8a3c1bed445d48d, project dirty
- Evidence key: 0603e52da4e1ef6f21be0e476c214e981a4e37152279678348575befddc66748
- Verdict: CHANGES_REQUIRED
- Evidence inspected: renders/final/R01-20261103T135102Z.png; Documents/Reviews/R01-20261103T135102Z/_evidence/scenes/Scene/camera.png; .../Scene/scene-facts.json; .../Scene/scene.txt

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1. Spec fidelity | FAIL | REQ-03 and REQ-06 not visibly met; F-01 to F-03 |
| 2. Composition and camera | PASS | camera.png: three-quarter desk-corner view, desk/monitor/chair/lamp/wall art/shelf all in frame, no required element clipped |
| 3. Lighting and exposure | FAIL | camera.png right third: window is a flat blown pale-blue panel brighter than the lamp; F-01 |
| 4. Materials and colour | FAIL | camera.png desk/chair/walls/rug: flat untextured surfaces, blank screen, cool palette; F-02, F-03 |
| 5. Geometry and scale | PASS | camera.png: desk, monitor, chair and tower read at residential proportions with no visible interpenetration; metric scale deferred to technical |
| 6. Detail and storytelling | PASS | REQ-02 props all present (mug, notebook, chair, rug, shelf, wall art, plant, curtains); sparse feel noted as minor F-04 |
| 7. Technical readiness | not-assessed | outside assigned focus; render is 1920x1080 from Camera_Hero |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.85 | major | 3 | REQ-03 | camera.png, right third (window) and desk lamp | Window glass is a flat blown-out pale-blue panel with no exterior and is the brightest large area, reading as daylight and outranking the small desk lamp; the cool fill is not low-level, so the lamp does not read as the key light of a warm evening scene. | Reduce window/world emission and darken the exterior so only a dim cool glow remains, below lamp intensity; let the lamp's warm falloff own the desk and back wall, and keep the window off the blown range. |
| F-02 | 0.82 | major | 4 | REQ-06 | camera.png, desk top, chair, walls, monitor screen | Surfaces render as flat untextured base colours: no wood grain on the desk, no fabric weave on chair/rug, flat grey painted walls; the monitor screen is a blank near-white card with no desktop content and clips. | Add procedural wood grain to desk and floor, fabric weave normal/roughness on chair and rug, subtle painted-wall roughness variation, and an emissive screen texture with dark desktop content so it stops clipping. |
| F-03 | 0.65 | major | 4 | REQ-06 | camera.png, wall art, window, rug, PC tower | Confirmed palette is warm amber/wood brown/muted ochre/cream, but the frame is dominated by cool grey walls, teal wall art, pale-blue window and a navy tower; warm amber appears only as one wall pool. | Warm the wall paint and rug toward ochre/cream, replace the teal art with a muted warm piece, and keep window glow cool but dim. |
| F-04 | 0.60 | minor | 6 | REQ-02 | camera.png, left shelf and desk surface | Room reads sparse/blockout: shelf holds only one small cactus, mug is a plain cylinder, notebook a flat sheet; all listed props exist but the "occupied and personal" reading is weak. | Add two to four small lived-in props (books on shelf, loose papers, pen, thrown textile) with slight irregular placement. |

## Residual risks

- REQ-08, REQ-10 and REQ-11 (packing, asset/licence records, README/DECISIONS currency) are outside the visual focus and were not assessed; the spec grader covers them.
- Metric scale, topology and interpenetration behind the camera are not visible in a single sealed frame; deferred to the technical grader.
- Only the sealed hero camera render was supplied; no alternate angle or viewport evidence, so occluded contact issues could not be checked.
