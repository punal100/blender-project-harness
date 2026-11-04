# Grader Report — technical

- Round: R02-20261104T213739Z
- Grader: technical
- Focus: scale, geometry, topology, render settings, missing files, scene health
- Model/variant: punal-9router-compatable / ocg/deepseek-v4.1-flash / Max
- Target: base 0a1fcbc2b33ed4ff126006e49f4ae3fb1debc909, saved scene SHA-256 6b65269f21c4815016d99c56257b1587dc58adf0a8fb2838aa6df4f5a74f5ce8, dirty
- Evidence key: fb124fecf06996afdcf5a6e6b0fb6c7f7ad8d59f0ddc63378cce7ebabc20f11c
- Verdict: CHANGES_REQUIRED
- Evidence inspected: renders/final/R02-20261104T213739Z.png; Documents/Reviews/R02-20261104T213739Z/_evidence/scenes/Scene/camera.png; Documents/Reviews/R02-20261104T213739Z/_evidence/scenes/Scene/scene-facts.json; Documents/Reviews/R02-20261104T213739Z/_evidence/scenes/Scene/scene.txt

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1 Spec fidelity (REQ-04) | PASS | scene-facts.json: DeskTop/DeskSideLeft/DeskSideRight, MonitorStand/MonitorNeck/MonitorBody/MonitorScreen, Tower, Keyboard, Mouse, ChairSeat/ChairBack/ChairPost/ChairBase present; camera.png shows desk, monitor, tower, keyboard, mouse, and chair |
| 2 Composition and camera | not-assessed | visual-grader focus; partial milestone |
| 3 Lighting and exposure | not-assessed | visual-grader focus; REQ-06 is future scope |
| 4 Materials and colour | not-assessed | visual-grader focus |
| 5 Geometry and scale | FAIL | ChairBase/ChairPost place the chair 40 mm above the floor and 40 mm off its post (F-01); Mouse sinks into MousePad (F-02) |
| 6 Detail and storytelling | not-assessed | REQ-05 props are future scope |
| 7 Technical readiness | PASS | 1920x1080, EEVEE, 64 samples, AgX, HeroCamera set, single Collection, all meshes manifold with no loose/degenerate geometry, sealed render present, no external paths in evidence |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.90 | major | 5 | REQ-04 | scene-facts.json objects ChairBase (z 0.040-0.080), ChairPost (z 0.120-0.440), Floor (top z 0.000) | The required chair is not grounded: ChairBase floats 40 mm above the floor and its top is 40 mm below ChairPost, leaving the seat assembly unsupported | Lower ChairBase so its underside sits at z=0 and lower/extend ChairPost to meet its top; leave seat/back unchanged; re-render |
| F-02 | 0.85 | minor | 5 | REQ-04 | scene-facts.json objects Mouse (z 0.758-0.794), MousePad (z 0.760-0.764), DeskTop (top z 0.760) | Mouse bottom is 6 mm inside the mouse pad (and 2 mm inside the desk) | Raise Mouse centre to z=0.782 so its bottom rests on the pad top at z=0.764 |

## Re-review

- R01 technical F-01 (flat curtain panels): OPEN, unchanged — CurtainLeft/CurtainRight are still 8-vertex beveled boxes (scene-facts.json); deferred to final decor and outside REQ-04.

## Residual risks

- Prior visual F-01 (door interpenetration) remains dispositioned OPEN/deferred by the orchestrator and is outside this milestone; not re-graded here.
- No external-file or packed-data inventory is supplied; all meshes carry assigned procedural materials and no external paths appear in scene facts, but missing external files cannot be independently verified.
- Scene unit system and camera focal length are not present in the facts; metric scale is inferred from dimensions (desk top 0.76 m, chair seat 0.49 m, monitor 0.64 m wide).
- DeskLampLight at z=1.04 lies inside the DeskLampStem envelope (z 0.78-1.10); whether EEVEE shadowing blocks or leaks its contribution cannot be judged from the still, and lamp lighting belongs to REQ-06 future scope.
