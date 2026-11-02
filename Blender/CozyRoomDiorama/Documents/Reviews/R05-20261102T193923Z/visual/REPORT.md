# Grader Report — visual

- Round: R05-20261102T193923Z
- Grader: visual
- Focus: composition, camera, lighting, colour, materials, mood, detail and storytelling
- Model/variant: punal-9router-compatable / ocg/deepseek-v4.1-flash (runtime backup variant)
- Target: base bfbb423bc83228a76c57e9774a4946335acbaa27, saved scene SHA-256 d4d299b27c4dbda6b97af13a37edfac8a0bfa17da85eca9589b34189343425e6, project dirty
- Evidence key: 01acef97dd722d7e145ffab5e5854d6f19c1de67072588c9b346b0d605e230f0
- Verdict: PASS
- Evidence inspected: renders/final/R05-20261102T193923Z.png (sha256 979b130e...), Documents/Reviews/R05-20261102T193923Z/_evidence/camera.png (sha256 979b130e...), Documents/Reviews/R05-20261102T193923Z/_evidence/scene.txt (sha256 9ac05661...)

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1 Spec fidelity | PASS | camera.png whole frame; scene.txt L1-2, L26-49, L57-76 — two-wall open-corner diorama with the listed contents (desk, monitor, keyboard, mouse, PC, chair, window, curtains, filled bookshelf, rug, floor lamp, two plants, wall art, mug, papers) rendered at 1920x1080 from the scene camera (REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-08, REQ-09). REQ-10 document currency is outside this visual focus. |
| 2 Composition and camera | PASS | camera.png — three-quarter hero view frames both walls, floor and full room at 16:9 with no object clipping; desk/monitor cluster is the clear focal point right of centre; negative space is clean dark backdrop. |
| 3 Lighting and exposure | PASS | camera.png — warm key from room/desk/floor lamps with cool blue window fill; soft cast shadows on wall and floor; no crushed interior shadows; only the emissive lamp shades clip white, which reads as intentional. |
| 4 Materials and colour | PASS | camera.png — cohesive amber interior, muted wood, teal book spines and blue window; flat low-poly shading with no visible texture stretching or missing materials. Minor palette drift in F-02. |
| 5 Geometry and scale | not-assessed | Outside assigned focus; see residual risks. |
| 6 Detail and storytelling | PASS | camera.png — bookshelf with varied books, second plant on the shelf top, desk lamp, rug, wall art, curtains, rain streaks and city light all read; mug and paper sheet are visible on the desk. Minor monitor issue in F-01. |
| 7 Technical readiness | not-assessed | Outside assigned focus. |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.90 | minor | 6 | REQ-04 / REQ-07 | camera.png, desk right of centre; scene.txt L29-30 | Monitor is a single slab standing directly on its bottom edge on the desk; no stand or base is modelled or visible, so the screen reads as balancing on the desktop. | Add a simple low-poly neck/base under Monitor_Body and lift the body so it rests on that stand. |
| F-02 | 0.78 | minor | 4 | REQ-06 | camera.png, rug centre floor and wall art upper right | Rug and wall art render as sage/olive green under the warm key rather than the teal accent named in the palette; teal survives only in book spines. | Shift the Rug and Wall_Art base hue toward blue-green (teal) and lower their warm tint so they read as the intended accent. |

## Re-review

| Prior finding | Status | Evidence |
|---|---|---|
| F-06 (R04) monitor edge-on on desk with no stand | OPEN | camera.png desk; scene.txt L29-30 — still only Monitor_Body and Monitor_Screen, body bottom flush with the desktop. |
| F-07 (R04) rug/art read sage under warm light | OPEN | camera.png — rug and art panel still render sage-green. |

## Residual risks

- No material node, light-power, or camera-lens data in the supplied evidence; colour and exposure calls rely on the render only.
- The second plant is confirmed in the scene inventory (scene.txt L72-73) but is small and partly occluded in the hero view; full-size legibility is not verified.
- Prior findings other than F-06/F-07 were not supplied in this ticket and were not re-checked.
