# Grader Report — visual

- Round: R01-20261102T155456Z
- Grader: visual
- Focus: composition, camera, lighting, colour, materials, mood, detail and storytelling
- Model/variant: ocg/deepseek-v4.1-flash / Max (backup; primary Codex-Everywhere-Claude/claude-sonnet-5-5 / xhigh)
- Target: base 44d185d603679dd591984f49eb0ad2ca955686b9, saved scene SHA-256 2f6116b1da9c6684dae43998062fa3e018c2941c3bcb44ddbc06ee5481b31327, project dirty
- Evidence key: 5a22d47115b5f0c4a756b0774a9da577d076f05ac8723563b4d7378e6dc3e93d
- Verdict: CHANGES_REQUIRED
- Evidence inspected: renders/final/R01-20261102T155456Z.png (= _evidence/camera.png), _evidence/scene.txt, manifest.json, Documents/REQUIREMENTS.md, Documents/Goals/01-project-brief.md

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1. Spec fidelity | FAIL | camera.png: window/curtains/rug/shelf present; potted plants and wall art absent (REQ-05); no desk lamp, monitor glow, or shelf light present (REQ-07) |
| 2. Composition and camera | PASS | camera.png: three-quarter front view into the corner, floor slab and two walls read, no geometry clipping; desk focal point deferred to later milestone |
| 3. Lighting and exposure | FAIL | camera.png: large blown warm blob on back wall with hard trapezoid falloff above/below window; floor and left wall crushed dark |
| 4. Materials and colour | FAIL | camera.png: walls read grey-brown not cream, floor near-black, rug low-contrast maroon; warm-amber vs teal-blue split carried almost solely by the window |
| 5. Geometry and scale | PASS | scene.txt: 4.2x3.6 m floor, 2.6 m walls, baseboards and window at plausible heights; rug sits on floor in camera.png |
| 6. Detail and storytelling | FAIL | camera.png: empty shell; only decor is a shelf with two small objects; no plants or wall art, so the room does not yet read lived-in |
| 7. Technical readiness | not-assessed | outside assigned focus; scene.txt indicates camera set and EEVEE 1920x1080 |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.85 | major | 3,1 | REQ-07 | camera.png, back wall centre | Unmotivated broad warm hotspot washes the back wall to near-white with a hard-edged trapezoid boundary above and below the window; the intended warm desk lamp, monitor glow, and shelf light are absent | Replace the wide fill with a defined area light and add a visible lamp/monitor fixture; raise fill distance, cut intensity, and soften shadow edges so falloff is gradual |
| F-02 | 0.90 | major | 6,1 | REQ-05 | camera.png, whole frame | Potted plants and wall art are missing; only a two-object shelf exists, so the confirmed room decor set is incomplete | Add at least one potted plant (floor or shelf) and one wall-art piece in the shell milestone or the immediately following decor milestone |
| F-03 | 0.70 | minor | 4 | REQ-02 | camera.png, walls/floor/rug | Surfaces read muddy and under-saturated: cream walls appear dark grey-brown, wood floor nearly black, rug dark maroon with little facet separation | Lift ambient/exposure and lighten material base colours (cream wall, warmer wood) while keeping the low-poly flat-shaded look |
| F-04 | 0.65 | minor | 3 | REQ-07 | camera.png, window | Window reads as a flat opaque saturated-blue poster with a single white dot; no depth or cool spill, so the night exterior contrast is weak | Give the glass/exterior a subtle gradient or distant silhouette and reduce its self-emission slightly |
| F-05 | 0.60 | minor | 2 | REQ-09 | camera.png, frame edges | Both wall tops run off the top edge and the left half is empty, weakening the diorama read and balance; window-only focal point until the desk arrives | Pull the camera back/tilt to keep wall-top edges in frame and reserve left-side mass for the desk composition |

## Residual risks

- Desk, monitor, tower, keyboard, mouse, mug, headphones, and chair are not modeled yet (REQ-04, REQ-06, REQ-08), so the desk focal point, monitor glow, code-editor legibility, and final palette cannot be assessed this round.
- scene.txt lists helper meshes named `Light` and `Camera` used as shelf decor; possible stray naming belongs to the technical grader.
- Only the sealed camera render and scene inventory were supplied; no viewport or alternate angles to check hidden-object issues.
