# Grader Report — visual

- Round: R01-20261103T022750Z
- Grader: visual
- Focus: composition, camera, lighting, colour, materials, mood, detail and storytelling
- Model/variant: primary punal-9router-compatable / Codex-Everywhere-Claude/claude-sonnet-5-5 / xhigh; backup punal-9router-compatable / ocg/deepseek-v4.1-flash / Max
- Target: base 0ab4a61d00d040ac40f67a7bde62522727825233, saved scene SHA-256 deaf18d0e7bd22fa453e9a9239e1142d318fc5de61c0460f8c987a2ee9f5c65d, dirty
- Evidence key: e30e529031ccc1fb262b5eb189a4bb9f69bb8bde7958ef57e6129365ec32d653
- Verdict: CHANGES_REQUIRED
- Evidence inspected: renders/final/R01-20261103T022750Z.png, _evidence/camera.png (same assigned hash), _evidence/scene.txt, REQUIREMENTS.md, WORKFLOW.md, REVIEW.md, Goals/01-project-brief.md

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1 Spec fidelity (REQ-01, REQ-06) | PASS | Milestone subset present: floor, two walls, window frame/glass, curtains, rug, desk, chair. Remaining REQ-01 props are deferred, not counted. REQ-06 scale roughly holds except room size (F-03). |
| 2 Composition and camera | PASS | camera.png: three-quarter desk view at eye height (Camera_Hero z=1.65), desk and window legible; weak balance noted in F-02. |
| 3 Lighting and exposure | PASS | camera.png: one working warm key, readable desk/chair; final lamp/cool fill deferred, minor WIP contrast note F-04. |
| 4 Materials and colour | PASS | camera.png: warm Principled placeholders; low wall/floor/desk separation and flat glass noted in F-05. |
| 5 Geometry and scale | FAIL | scene.txt: BackWall is a 6-quad solid box behind a surface-mounted window (F-01); interior 4.0x4.0 m (F-03); chair/rug penetration (F-07). |
| 6 Detail and storytelling | PASS | camera.png: blockout detail is milestone-appropriate; curtains overly boxy (F-06). |
| 7 Technical readiness | not-assessed | Outside assigned focus; camera and 1920x1080 EEVEE settings present. |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.72 | major | 5 | REQ-01 (window) / REQ-02 twilight fill | scene.txt line 6 BackWall is 6 quads; line 8 WindowFrame y 1.935-2.005, wall inner face 1.94; camera.png upper-right window | The window is a flat blue quad plus a frame standing ~5 mm proud of a solid wall: no opening, reveal or sill. It reads as a glowing panel/lightbox and cannot admit a real cool twilight fill. | Cut a true opening in BackWall (inset/boolean), recess the frame 8-10 cm into the reveal, place glass at the outer face, add a sill and keep curtains in front of the reveal. |
| F-02 | 0.70 | minor | 2 | REQ-01 hero view | camera.png: left third desk, centre chair back, upper-left blank wall | About half the frame is empty plaster, and the dark chair back is the largest, highest-contrast shape at centre; the desk reads as a thin plank and loses subject dominance. | Bring the camera closer/lower and aim slightly right/up so desk + window fill the frame; pull or turn the chair off-centre so it stops occluding the desk. |
| F-03 | 0.82 | minor | 5 | REQ-06 | scene.txt line 5 Floor 4.0x4.0; lines 6-7 walls at +/-2.06 (inner +/-2.0) | Interior is 4.0 x 4.0 x 2.7 m against the confirmed roughly 3.6 x 3.6 x 2.7 m: 11% over per axis, 23% over in area. | Move BackWall and RightWall to inner +/-1.8 and shrink the floor to 3.6 m (or scale the shell by 0.9 and re-seat furniture). |
| F-04 | 0.68 | minor | 3 | REQ-02 (deferred light pass) | camera.png: near-black under-desk and behind-chair areas; flat warm gradient on wall | A single hard key from above leaves shadows crushed to black and gives no cool window fill or falloff shaping; the corner does not yet read as warm evening light. | In the lighting milestone, add a warm practical at the desk, a cool window fill and low ambient; widen the key source for softer edges; lift under-desk shadows. |
| F-05 | 0.66 | minor | 4 | REQ-03 palette / REQ-05 | camera.png: wall, floor and desk share one orange hue/value; opaque pale-blue pane | Wall, floor and desk have almost no hue/value separation, so the desk merges into the floor; the glass is a flat opaque pane with no reflectivity or depth. | Push the floor darker/redder and the desk to a lighter warm oak; make plaster a softer cream; give the glass a dark blue-grey base with reflection/roughness variation. |
| F-06 | 0.64 | minor | 6 | REQ-01 (window/curtains) | scene.txt lines 10-11: 0.22 x 0.07 x 1.44 boxes; camera.png either side of window | Curtains are rigid slabs with square tops, no rod and no folds, standing on the wall like white boards rather than hanging fabric. | Add a rod above the window and hang folded curtain geometry (subdivided/tapered panels) with slight frame overlap and floor-length fall. |
| F-07 | 0.60 | minor | 5 | REQ-06 (grounded, non-intersecting) | scene.txt line 19 ChairBase z -0.005..0.025; Rug top z=0.02; desk panels y 1.21..1.89 vs rug max y 1.33 | Chair base sinks 0.5 cm through the floor and 2 cm into the rug; desk side panels pass 2 cm through the rug edge strip. Hidden but violates grounded/non-intersecting. | Sit the chair and desk on the rug top where they overlap it (raise 2 cm or trim the rug clear of the desk panels). |

## Residual risks

- REQ-01 items not built yet (computer tower, monitor, keyboard, mouse, desk lamp, wall shelf, plant, small decor) and the brief's computer belong to later milestones and were not treated as findings.
- Ceiling and the two open sides of the shell are absent; accepted as a two-wall hero corner set, but unassessed for any other camera.
- Only one frozen frame was available; lens/focal length, view transform and colour management were not in scene.txt, and the render cannot show them.
- Technical readiness (dimension 7) was not assessed beyond the recorded 1920x1080 EEVEE settings and hero camera.
