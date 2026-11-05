# Grader Report — technical

- Round: R01-20261105T044624Z
- Grader: technical
- Focus: scale, geometry, topology, render settings, missing files, scene health
- Model/variant: punal-9router-compatable / ocg/deepseek-v4.1-flash / Max
- Target: base ed7a25f01c239f072bc350b002cdb641ba7b3dcc, saved scene SHA-256 27a5219d16c08fbcc7dee036f1053fa3a1d40f29cd9475d96f35ca464cdc1c49, project dirty
- Evidence key: 9d4e636d28ec798fed644dceacbeef25032c972710c36b807d50e95d55a923e1
- Verdict: PASS
- Evidence inspected: renders/final/R01-20261105T044624Z.png (sha256 c9e27134fb397e3c67456f71459f2ad7b0d1ae0b5151f735e640ed04f9db8035); _evidence/scenes/Scene/camera.png (same sha256 c9e27134...); _evidence/scenes/Scene/scene-facts.json (sha256 52c14748...); _evidence/scenes/Scene/scene.txt (same sha256 52c14748..., identical JSON facts)

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1 Spec fidelity | PASS | REQ-02: interior exactly 3.6 x 3.2 m with 2.6 m clear ceiling (Floor 3.6x3.2, walls 2.6 tall, Ceiling 2.6-2.7), four walls + floor + ceiling sealed, WindowGlow/frame + DoorPanel present. REQ-06: warm tan walls/WarmFill key against cool blue window/DuskLight reads as the intended warm-cool shell scheme; lamps and readable computer are later-scope. REQ-07: one active HeroCam at z=1.55 m, 1920x1080, wide three-quarter aim at the desk corner with window in frame. |
| 5 Geometry and scale | PASS | All room meshes are closed 8-vert/6-face cubes, 0 non-manifold/degenerate/loose; only intentional single-face WindowGlow card is open (4 boundary edges). Door 0.84x2.1, window 1.2x1.4 with 0.87 m sill, curtains 1.56 m, camera 1.55 m are believable; floor top at z=0 and ceiling bottom at 2.6 meet wall tops with no gaps. |
| 7 Technical readiness | PASS | Scene camera is HeroCam; 1920x1080, EEVEE, 64 samples, AgX, exposure 0, film not transparent, frame 1-250 @24 fps; single Collection, no stray helper objects; no image-texture dependencies evidenced and the render shows no missing-asset artifacts. |
| 2 Composition and camera | not-assessed | outside assigned focus |
| 3 Lighting and exposure | not-assessed | outside assigned focus |
| 4 Materials and colour | not-assessed | outside assigned focus |
| 6 Detail and storytelling | not-assessed | outside assigned focus |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.65 | minor | 1 | REQ-07 | camera.png, right and top edges | Right curtain is cut by the right frame edge and the window's top edge sits nearly against the top of frame; the hero shot has no margin on the window's right/top side and will clip further once desk/chair furniture occupies the corner. | With camera z kept near 1.55 m, aim 3-5 deg further right or widen the lens slightly so the complete window and both curtains sit inside frame with margin. |
| F-02 | 0.65 | minor | 1 | REQ-02 | scene-facts.json, DoorPanel (0.04 x 0.84 x 2.1, only door object) | Door is a bare slab embedded flush in the left wall with no casing or handle; it reads as a placeholder rather than a believable door. | Add a simple door casing/trim and a handle to DoorPanel in the shell pass (no boolean needed). |

## Residual risks

- External-dependency state is not enumerated in the supplied facts; no missing-file artifacts appear in the render, but packed/linked image data was not directly listable from this read-only evidence.
- WindowGlow is a zero-thickness open card over a solid back wall rather than a recessed aperture with a sill/glass thickness; acceptable for this stylized shell, but edge-on views may show it as paper-thin.
- Window material/lighting quality (saturated flat blue pane with a blown white hotspot) and hero composition are visual concerns left to the visual grader; not graded here.
- Full REQ-06 (warm lamps, readable computer) and REQ-07 desk-corner content depend on later furniture milestones and remain deferred.
