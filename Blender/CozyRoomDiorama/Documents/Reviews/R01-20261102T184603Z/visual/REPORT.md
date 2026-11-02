# Grader Report — visual

- Round: R01-20261102T184603Z
- Grader: visual
- Focus: composition, camera, lighting, colour, materials, mood, detail and storytelling
- Model/variant: ocg/deepseek-v4.1-flash / Max (backup role; primary assigned Codex-Everywhere-Claude/claude-sonnet-5-5 / xhigh)
- Target: base ac5580f7cfd817230932b1565579eedf615b1a8d, saved scene SHA-256 824743701412d10a475d9266688c6f698efda9db28ca71a442a3a0b660b71f34, project dirty
- Evidence key: 86dc70e9cb3b64d84b627f68c4939e79eb9e7583681ebfeb75a2b4bcf654868f
- Verdict: CHANGES_REQUIRED
- Evidence inspected: renders/final/R01-20261102T184603Z.png (sha256 b64d4161bff5b7a15378bbb906f813a8981c225b206b0a0ed4959d5f2664ca7e), Documents/Reviews/R01-20261102T184603Z/_evidence/camera.png (same sha256), Documents/Reviews/R01-20261102T184603Z/_evidence/scene.txt (sha256 fc7683cd9e161372187bf6ea2118f71c7552a66e013d36f84e1e7c29d6088f43)

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1 Spec fidelity | FAIL | REQ-07 clean/intentional geometry is not met by the window treatment (F-01); REQ-01/02/05 shell framing is otherwise met for this milestone, desk focal point deferred by the stated milestone |
| 2 Composition and camera | PASS | camera.png: full shell in frame at 16:9, three-quarter open-corner view, no wall/floor cropping, window legible; minor bottom-margin imbalance (F-02) |
| 3 Lighting and exposure | PASS | camera.png: single soft warm key, smooth falloff, no blown highlights or crushed interior shadows; cool window spill (REQ-03) not yet present and not graded this round |
| 4 Materials and colour | PASS | camera.png: flat matte low-poly surfaces, coherent warm wall/floor/frame palette with the cool blue window as the only cool note; glass reads as a flat pane as expected at shell stage |
| 5 Geometry and scale | not-assessed | Out of focus; scene.txt sizes indicate a plausible 4.4x3.6x2.7 m room, 1.01 m window sill |
| 6 Detail and storytelling | FAIL | F-01 curtain/rod assembly; no other props exist yet by milestone scope |
| 7 Technical readiness | not-assessed | Out of focus; reserved for the technical grader (scene.txt engine/settings only) |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.85 | major | 6 | REQ-07, REQ-01 | camera.png, window/curtain assembly at centre-right (approx. x 680-950, y 150-570 of 1600x900 view); scene.txt lines 17-19 | Curtain_Rod sits at z=2.26 while both curtains span z=0.25-2.75, so the rod is 0.49 m below the curtain tops; the rod (0.07 m) also shares y=1.60 with the 0.13 m curtain slabs and spans 1.90 m versus a 2.21 m curtain span. The panels visibly rise above the rod and the rod terminates inside them, so the window treatment reads as broken rather than hung. | Raise Curtain_Rod to z=2.60-2.62 (below the 2.7 m wall top) and move it clear of the fabric (y=1.52), or add rings; shorten both curtains so their tops meet the rod (approx. z=2.58) and bottoms sit 0.03-0.05 m above the floor; widen the rod to at least 2.30 m so it projects past both panels. |
| F-02 | 0.65 | minor | 2 | REQ-05 | camera.png full frame: near floor corner at the bottom border (approx. y=890-900 of 900), approx. 18% empty frame height above the wall tops | Hero framing is bottom-tight and top-loose: the diorama's nearest floor corner sits on the bottom frame edge while a large empty band remains above, so the shell is not balanced in the 16:9 frame. | Lower the camera target/angle slightly or pull back ~3-5% so the near floor corner sits about 4-6% above the bottom edge while keeping the full walls in frame; re-render and re-inspect. |

## Residual risks

- Desk and all furnishings are absent by milestone scope, so REQ-05 focal readability and the final warm/cool mood cannot be proven yet; the camera may need re-framing once the desk fills the foreground.
- Material settings, focal length/FOV and light parameters are not in the supplied evidence; grading relies on the frozen still and scene.txt names/transforms only.
- Window_Glass and Window_Outside are single-quad open planes (4 boundary edges each) by design; acceptable as glazing/backdrop planes but not assessable for depth or glass response from this still.
- Rain, monitor glow, desk/floor practicals (REQ-03/REQ-04) are not in this milestone and were not graded.
