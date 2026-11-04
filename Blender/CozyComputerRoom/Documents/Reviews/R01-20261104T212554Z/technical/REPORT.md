# Grader Report — technical

- Round: R01-20261104T212554Z
- Grader: technical
- Focus: scale, geometry, topology, render settings, missing files, scene health
- Model/variant: primary punal-9router-compatable / ocg/deepseek-v4.1-flash / Max
- Target: caf1272af0dfceb8369ec0c3e91d6e156ea21fba / b4eb973417bcc33d2d1e4d6a3a12e787699927eb181c784125874fb75a81eb31 / dirty
- Evidence key: 2a5808b80bde1a602680812ed545107e83f189de10dc56129281119bff9f67e4
- Verdict: PASS
- Evidence inspected: renders/final/R01-20261104T212554Z.png, _evidence/scenes/Scene/camera.png, _evidence/scenes/Scene/scene-facts.json, _evidence/scenes/Scene/scene.txt, manifest.json, Documents/REQUIREMENTS.md, Documents/WORKFLOW.md, Documents/REVIEW.md, Documents/Goals/01-project-brief.md
- Scope: partial milestone "Room shell and lighting rig"; REQ-03 only. Future content (desk, computer, props) is deferred and not graded.

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1. Spec fidelity (REQ-03 only) | PASS | scene-facts.json: interior 3.6 x 3.2 m from wall inner faces (+/-1.8, +/-1.6) and 2.6 m ceiling underside (z=2.6); 12 shell meshes incl. Floor, Ceiling, 4 walls, DoorPanel/DoorFrame on WallRight, WindowFrame/WindowDusk on WallBack. camera.png confirms the enclosed interior and a readable window. |
| 2. Composition and camera | not-assessed | Visual focus. Technical checks only: HeroCamera exists, is the scene camera, at z=1.55 m; 1920x1080 16:9 confirmed. |
| 3. Lighting and exposure | not-assessed | Four LIGHT objects present (Window, DeskLamp, FloorLamp, Pendant), but type/power/colour/size are absent from scene-facts, so rig quality cannot be graded. |
| 4. Materials and colour | not-assessed | Material names only; no shader values, texture paths, or colour-space data in evidence. |
| 5. Geometry and scale | PASS | All 12 meshes are closed primitives (8 verts/6 faces, 0 non-manifold, 0 loose, 0 degenerate). Room 3.6 x 3.2 x 2.6 m; door 0.86 x 2.06 m; window 1.24 x 1.20 m with 0.95 m sill; 0.2 m wall/floor/ceiling thickness. One minor curtain issue below. |
| 6. Detail and storytelling | not-assessed | Outside assigned focus and milestone. |
| 7. Technical readiness | PASS | Camera set, resolution 1920x1080, EEVEE 64 samples, AgX, film not transparent, single Collection, no strays or default helpers, no sequencer strips. Missing-file status inferred from procedural-only inventory; see residual risks. |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.85 | minor | 5 | REQ-03 (room shell) | camera.png, window area in left third; scene-facts.json CurtainLeft/CurtainRight | Both curtains are flat 0.18 x 0.05 x 1.32 m bevelled slabs with no folds and no rod/track. Each floats 0.045 m off WallBack (y 1.505-1.555 vs inner face 1.6), and the right panel ends 0.89 m above the floor, 0.06 m below the 0.95 m sill; in the render they read as rigid planks with a visible shadow gap rather than fabric. | Support both panels on a visible rod/track and give them fold relief (simple wave + solidify) or seat them flush to the wall face; keep the two panels consistent in length. |

## Residual risks

- Door assembly is outside the hero framing, so its visible construction could not be checked; scene-facts shows DoorPanel (0.04 m) sitting 3 cm inside the solid DoorFrame slab, 1 cm proud at the room face. Not counted as a finding because it is not visible in camera.png.
- Window is a solid DarkWood slab with an opaque dusk plate 0.024 m proud of it: no opening, recess, or glazing. Acceptable as a stylized shell blockout but there is no true daylight portal, and WindowLight floats 0.091 m inside the room at the pane plane.
- No dependency/packed-file audit in the evidence (manifest asset_check is null); REQ-11 procedural-only scope and the absence of image datablocks make missing external files unlikely but unverified.
- Engine is reported as BLENDER_EEVEE; the live Blender version is not in evidence, so a legacy vs EEVEE-Next engine ID mismatch could not be ruled out.
- Hero camera currently frames an empty wall and crops the left curtain; REQ-08 framing is deferred to the completed scene.
