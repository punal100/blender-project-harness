# Grader Report — technical

- Round: R01-20261102T155456Z
- Grader: technical
- Focus: scale, geometry, topology, render settings, missing files, scene health
- Model/variant: primary punal-9router-compatable / ocg/deepseek-v4.1-flash / Max
- Target: base 44d185d603679dd591984f49eb0ad2ca955686b9, saved scene SHA-256 2f6116b1da9c6684dae43998062fa3e018c2941c3bcb44ddbc06ee5481b31327, project dirty
- Evidence key: 5a22d47115b5f0c4a756b0774a9da577d076f05ac8723563b4d7378e6dc3e93d
- Verdict: PASS
- Evidence inspected: renders/final/R01-20261102T155456Z.png (= _evidence/camera.png, same SHA-256), _evidence/scene.txt, Documents/REQUIREMENTS.md, Documents/WORKFLOW.md, Documents/REVIEW.md, Documents/Goals/01-project-brief.md

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1. Spec fidelity (technical aspects of REQ-02/03/05) | PASS | low-poly boxy shell, floor plus two perpendicular walls, window with curtains, rug, shelf and plant present (scene.txt L5-16, L22-24; camera.png). Wall art, potted planters, desk and REQ-07/09 visual quality belong to later milestones/other graders; no technical blocker at this milestone. |
| 2. Composition and camera | not-assessed | out of assigned focus |
| 3. Lighting and exposure | not-assessed | out of assigned focus |
| 4. Materials and colour | not-assessed | out of assigned focus |
| 5. Geometry and scale | PASS | room 4.2 x 3.6 x 2.6 m at unit scale 1.0, floor slab 0.3 m, desk-height window sill 1.03 m, shelf 1.65 m: plausible scale (scene.txt L2, L5-16, L22-24). All 15 meshes report 0 non-manifold, 0 boundary edges, 0 loose verts; manifold boxes and a clean 96-quad/32-tri plant (scene.txt L5-16, L22-24). Minor window-casing gap is F-02. |
| 6. Detail and storytelling | not-assessed | out of assigned focus |
| 7. Technical readiness | PASS | BLENDER_EEVEE, 1920x1080, active Camera_Hero, no HDRI reported, saved .blend path recorded (scene.txt L1-2); round render exists at both evidence paths with identical hash. Naming/handoff issue is F-01; missing-file status is a residual risk. |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.90 | minor | 7 | REQ-13 / Goal Done (scene health and handoff) | scene.txt L5-16, L22-24 | Three scene objects carry default or misleading names: the rug is `Cube`, the wall shelf is the only mesh named `Light` among four light objects, and the shelf plant is a mesh named `Camera` beside `Camera_Hero`. Any later script or evidence query targeting `Light`/`Camera` by name silently addresses mesh decoration, and the names obscure the object inventory. | Rename to unique semantic names (e.g. `Rug_Main`, `Shelf_Wall`, `Plant_Shelf`) before the desk milestone. No geometry change. |
| F-02 | 0.70 | minor | 5 | REQ-05 (window with curtains) | scene.txt L6, L10-14; camera.png window frame | Window casing and glass float in front of the wall instead of contacting it: back-wall inner face is y=1.80, frame backs are y=1.78 (2.0 cm gap), glass back is y=1.785 (1.5 cm gap), and there is no wall opening or recess. The render shows a detached shadow seam around the casing. | Move the frame/glass rear faces to y=1.80 (or recess a ~2 cm reveal into the back wall) and re-check curtain clearance; keep the curtains where they are. |

## Residual risks

- scene.txt does not enumerate packed images or external file dependencies; no HDRI and no texture evidence is reported, but REQ-11 missing-file status cannot be fully verified from the summary alone.
- Four lights exist (Light_Monitor, Light_Window, Light_Fill, Light_Lamp) with no monitor/lamp fixtures and no shelf-specific light yet; this is expected staging for later milestones but will leave orphan lights if the desk change is not paired with them.
- Desk/computer, wall art, potted planters and shelf lighting required by REQ-04/REQ-05/REQ-07 are not present at this milestone and were not treated as findings; REQ-07/REQ-09 quality is deferred to the lighting and composition graders.
- The window glow and large hard shadows around the window (light placement, no visible fixtures) were not assessed under the technical focus.
