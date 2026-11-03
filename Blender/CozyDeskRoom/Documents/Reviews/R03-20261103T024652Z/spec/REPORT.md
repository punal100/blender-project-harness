# Grader Report — spec

- Round: R03-20261103T024652Z
- Grader: spec
- Focus: requirement and acceptance fidelity, scope, deliverable completeness
- Model/variant: primary punal-9router-compatable / codex-everywhere/gpt-6.1-sol / xhigh; backup punal-9router-compatable / ocg/deepseek-v4.1-flash / Max
- Target: base 9aead9d5cdced2a786161a01453bc7d719801d22, saved scene SHA-256 bde07e4f987baccecd7115ef0c4eb5700f8eb643848733a9e2254c659bb46891, project dirty (TASKSTRACKER.md, cozydeskroom.blend modified; Documents/Tasks/T029 and final render untracked)
- Evidence key: 29f12a0caf6d28c9fe0452abaf79fe0e76c51766b8cdd3fcba9ea4a84ae0f2a3
- Verdict: CHANGES_REQUIRED
- Evidence inspected: Documents/REQUIREMENTS.md; Documents/WORKFLOW.md; Documents/REVIEW.md; Documents/Goals/01-project-brief.md; Documents/Reviews/R03-20261103T024652Z/manifest.json; _evidence/camera.png; _evidence/scene.txt; renders/final/R03-20261103T024652Z.png (identical sha256 to camera.png)

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1 Spec fidelity | FAIL | F-01: floating notebook breaks REQ-06 / brief acceptance; REQ-01 and REQ-03 otherwise met for M2 |
| 2 Composition and camera | not-assessed | Camera framing deferred by ticket |
| 3 Lighting and exposure | not-assessed | Final lighting deferred by ticket |
| 4 Materials and colour | PASS | scene.txt material inventory + camera.png: walnut desk/shelf/window frame, cream fabric curtains, plaster walls, dark metal tower/monitor/chair base, cream lamp shade, pale-blue window glass |
| 5 Geometry and scale | FAIL | F-01; otherwise human-scale: desk top 0.76 m, monitor 0.58x0.34 m, keyboard 0.48 m, chair seat 0.46 m, mug 0.08 m |
| 6 Detail and storytelling | PASS | Desk, chair, computer tower + LED, monitor, keyboard, mouse, lamp, window + curtains, wall shelf + 3 books, rug, mug, notebook, pen cup present in scene.txt |
| 7 Technical readiness | PASS | 1920x1080 render exists, Camera_Hero set, scene saved at project root with matching SHA, HDRI none; external-file packing not independently verifiable |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.85 | major | 1, 5 | REQ-06; brief acceptance "nothing required is absent or floating" | scene.txt line 11: DeskTop at (-0.35, 1.55, 0.74) size 1.7x0.76x0.04 (top z=0.76, y range 1.17-1.93); line 44: Notebook at (0.05, 1.08, 0.77) size 0.24x0.19x0.01 (y range 0.985-1.175, z 0.765-0.775); camera.png desk front edge right of the chair back | The notebook sits entirely in front of the desk front edge (only ~5 mm of its rear plan overlaps the desk) and 5 mm above desk height, hovering ~0.26 m over the chair seat; a required desk prop is floating | Move Notebook fully onto the desktop with bottom z=0.76, e.g. x~0.0, y~1.60, clear of keyboard, mousepad and pen cup; re-render |

## Re-review

M2 is a new milestone; per ticket, prior R02 findings were fixed or explicitly deferred and no R02 finding is carried into this milestone. Not re-assessed.

## Residual risks

- Potted plant and framed print are absent by explicit ticket deferral; final lighting, hero framing and the 3.6 m room footprint are likewise deferred and not treated as findings.
- Material shader values (emission strength/colour for MonitorScreen and DeskLampBulb) are not in the evidence; the emissive reading comes from the render only.
- Sub-centimetre contact gaps (Mug bottom 0.765 vs desk 0.76; ChairBase bottom 0.025 vs rug top 0.02) are not visible at hero scale and are not raised as findings.
- Curtain bottoms (z 0.83-0.895) penetrate the window sill volume (z 0.825-0.895); the sill front face hides the overlap in the hero view.
