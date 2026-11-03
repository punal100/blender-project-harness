# Grader Report — visual

- Round: R02-20261103T023635Z
- Grader: visual
- Focus: composition, camera, lighting, colour, materials, mood, detail and storytelling
- Model/variant: primary punal-9router-compatable / Codex-Everywhere-Claude/claude-sonnet-5-5 / xhigh; backup punal-9router-compatable / ocg/deepseek-v4.1-flash / Max
- Target: base eab716ac352124ac85f09028e1df4da28d28d127, saved scene SHA-256 6ab3c9ce00f99933b34cf1e007f8405a1fa03cae9b37f13ee2c46494ab860d15, project dirty
- Evidence key: fba94b8367825cb37cd9b2761aa21c539fec79af2e5bc0c3021d661b995a85f9
- Verdict: PASS
- Evidence inspected: renders/final/R02-20261103T023635Z.png; Documents/Reviews/R02-20261103T023635Z/_evidence/camera.png; Documents/Reviews/R02-20261103T023635Z/_evidence/scene.txt

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1 — Spec fidelity (milestone subset) | PASS | scene.txt lines 17, 20–29; camera.png upper-right: the chair is present and the window is now a real wall aperture with casing, glass and sill, satisfying the REQ-01 window/chair subset this milestone advances. |
| 2 — Composition and camera | not-assessed | Deferred by ticket (F-02); not part of this revision's scope. |
| 3 — Lighting and exposure | not-assessed | Deferred by ticket (F-04); not part of this revision's scope. |
| 4 — Materials and colour | not-assessed | Deferred by ticket (F-05); not part of this revision's scope. |
| 5 — Geometry and scale | PASS | scene.txt lines 10, 17, 20–29: wall is split around a genuine 1.2 × 1.3 m aperture, rug clears the desk panels, chair penetrates nothing; residual 5 mm hover logged as minor F-08. |
| 6 — Detail and storytelling | not-assessed | Deferred by ticket (F-06); not part of this revision's scope. |
| 7 — Technical readiness | not-assessed | Outside assigned focus. |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-08 | 0.62 | minor | 5 | REQ-06 | scene.txt line 10 (Rug z 0.0–0.02) and line 17 (ChairBase z 0.025–0.055); camera.png chair base, centre-bottom | The chair no longer penetrates anything but hovers ~5 mm above the rug top, and ~25 mm above the floor along the rear 6 cm of its base that overhangs the rug edge (base y 0.67–1.23 vs rug y ≤ 1.17). Hidden at the hero angle, but the base is not in contact. | Lower ChairBase to z 0.02 and nudge the chair ~8 cm toward the camera so the 0.56 m base stays inside the rug footprint. |

## Re-review

| Prior finding | Status | Evidence |
|---|---|---|
| F-01 (window lightbox, major) | FIXED | scene.txt lines 20–23: back wall is now four pieces around a real 1.2 × 1.3 m aperture (x 0.3–1.5, z 0.9–2.2); line 7 glass set at y 2.05, 5 cm behind the wall inner face at y 2.0; lines 25–29 add rails and a 16 cm sill. camera.png upper-right shows the sill and a shadowed reveal at the glass top edge instead of a panel on a solid wall. |
| F-07 (rug/desk intersection) | FIXED | scene.txt line 10: rug max y 1.17 vs desk panels y 1.21–1.89 (lines 12–13) → 4 cm clear. Chair no longer penetrates floor/rug (base bottom z 0.025 above rug top 0.02); remaining hover logged as F-08. |
| F-02, F-03, F-04, F-05, F-06 | deferred | Ticket defers these to later milestones; not re-assessed this round. |

## Residual risks

- The 5 cm glass setback is shallow and the pane still reads uniform pale blue; whether the window works as a light source depends on the deferred lighting/material pass (F-04/F-05), so it cannot be judged now.
- Deferred F-02 (composition), F-03 (4.0 m footprint vs roughly 3.6 m), F-04, F-05 and F-06 remain open and were deliberately not graded.
- Only the hero frame was supplied; blind angles and collisions away from camera rest on scene.txt arithmetic, not imagery.
