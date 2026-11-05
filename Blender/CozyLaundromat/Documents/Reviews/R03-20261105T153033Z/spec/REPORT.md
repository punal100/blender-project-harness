# Grader Report — spec

- Round: R03-20261105T153033Z
- Grader: spec
- Focus: requirement and acceptance fidelity, scope, deliverable completeness
- Model/variant: punal-9router-compatable/ocg/deepseek-v4.1-flash / Max
- Target: base 919cabeb65d87209658bb2cce15cf831edceff47, saved scene SHA-256 34f4d125f3ef7c0ff249e32476c35a5183ef609cee60dc056ace3e336f098838, project dirty
- Evidence key: 958425adac3d77f2fa8aeeaec2f4c65f72648e977fcc175e454842abd463784c
- Verdict: PASS
- Evidence inspected: renders/final/R03-20261105T153033Z.png; Documents/Reviews/R03-20261105T153033Z/_evidence/scenes/Scene/camera.png; scenes/Scene/scene-facts.json; scenes/Scene/scene.txt; Documents/REQUIREMENTS.md; Documents/Goals/01-project-brief.md; Documents/Reviews/R02-20261105T150726Z/spec/REPORT.md

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1. Spec fidelity | PASS | All four R02 fixes are present in camera.png and scene-facts.json. Window_Frame (x=-1.4) is fully framed, including the left trim, with no clipping. Grout_X1-X5/Grout_Y1-Y5 form a 1 m floor grid and Floor_Rug is 3.6 x 0.8 m. Pendant_Stem_1/2 span z=2.385-2.80 and join the fixture tops to the ceiling. The assessed shell meets the room, window, floor, practical-light and finish requirements; machine/counter/prop content is deferred to later milestones. One minor ceiling-shading issue is logged as F-05. |
| 2. Composition and camera | not-assessed | Out of assigned focus. |
| 3. Lighting and exposure | not-assessed | Out of assigned focus; ceiling shading noted under dimension 1 as F-05. |
| 4. Materials and colour | not-assessed | Out of assigned focus. |
| 5. Geometry and scale | not-assessed | Out of assigned focus. |
| 6. Detail and storytelling | not-assessed | Out of assigned focus. |
| 7. Technical readiness | not-assessed | Out of assigned focus. |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-05 | 0.70 | minor | 1 | REQ-06, REQ-08 | camera.png, ceiling strip across the top of frame; scene-facts.json Light_Ceiling_1/2 at z=2.27 under Ceiling_Fixture_1/2 at z=2.34 (0.09 m tall, 0.36 m across) | The visible ceiling is dominated by two large soft-edged dark shapes: a cool blue-grey ellipse at top-centre and a broad brown field across the right ceiling. They are the shade shadows cast by the point lights placed only 0.025 m below each shade, so the 0.18 m-radius shades project multi-metre shadows onto the ceiling. The strip reads as mottled staining rather than soft tungsten falloff. | Disable shadow visibility on Ceiling_Fixture_1/2 (or move the point lights well below the shade rims) so the shades stop casting large ceiling shadows, then re-render and confirm the ceiling strip is clean. |

## Re-review

- F-01 -> FIXED. Window_Frame is now at x=-1.4 in scene-facts.json (was -1.55). camera.png shows the complete outer trim and both glass panes inside the image; the left trim edge sits about 12 px inside the 1920 px frame with no clipping. The margin is tight but the prior clipping is gone.
- F-02 -> FIXED. Pendant_Stem_1/2 are present at z=2.5925 with height 0.415 m, spanning z=2.385-2.80. Each stem meets its fixture top at 2.385 and the ceiling underside at 2.80, and both stems are visible in camera.png.
- F-03 -> FIXED. Grout_X1-X5 and Grout_Y1-Y5 create a 1 m grid at z=0.003, and Floor_Rug is now 3.6 x 0.8 m at y=2.0. The lower strip of camera.png shows the grout lines and the green runner; the floor is no longer a bare plane.
- F-04 -> FIXED. Window_Glass remains a matte grey panel with a soft gradient and no hard specular streak in camera.png; this matches the prior accepted disposition under REQ-07 and shows no regression.

## Residual risks

- The F-01 margin is only about 12 px (0.6% of frame width); any later yaw, lens or framing change could clip the window again.
- Only room-shell geometry exists in this milestone. The REQ-03 machine wall/counter/waiting area, REQ-05 props and evening exterior glimpse, and the REQ-07 appliance, counter and seating materials remain deferred and were not graded.
- Floor evidence is limited to roughly the bottom 4% of camera.png, so grout/rug quality beyond that strip could not be judged.
- F-05's cause is inferred from object positions and the frozen render; live inspection was not allowed.
