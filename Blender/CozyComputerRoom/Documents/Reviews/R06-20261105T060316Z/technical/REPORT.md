# Grader Report — technical

- Round: R06-20261105T060316Z
- Grader: technical
- Focus: scale, geometry, topology, render settings, missing files, scene health
- Model/variant: primary punal-9router-compatable / ocg/deepseek-v4.1-flash / Max
- Target: base a55f004d9588640837610c7874a4c6c4a69158f4, saved scene SHA-256 27c4d05e1052ac90d5ec7582af4fe99a82356020b3bbe6bdd8853758ccf2b785, project dirty
- Evidence key: d5279e1bf0c935eaf4cdd381d685feaee504769657101b95be7071e03c984b18
- Verdict: PASS
- Evidence inspected: renders/final/R06-20261105T060316Z.png (sha256 f98bfda77165f6fe70d94d864d36d655eeb32a8d828e465b9fe71e68a35924f7), _evidence/scenes/Scene/camera.png (sha256 f98bfda77165f6fe70d94d864d36d655eeb32a8d828e465b9fe71e68a35924f7), _evidence/scenes/Scene/scene-facts.json (sha256 dfef8bee8bba4fc3213eb241ca01e6af21d51981a05292948ab28a74c511095d), _evidence/scenes/Scene/scene.txt (sha256 dfef8bee8bba4fc3213eb241ca01e6af21d51981a05292948ab28a74c511095d)

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1 Spec fidelity | PASS | Technical requirements REQ-02, REQ-03, REQ-04, REQ-07, REQ-08, REQ-09, REQ-10 verified from scene facts and camera.png; visual-only acceptance of REQ-01/REQ-05/REQ-06 deferred to the visual and spec graders. |
| 2 Composition and camera | not-assessed | Outside the technical focus; camera presence and render output checked under dimension 7. |
| 3 Lighting and exposure | not-assessed | Outside the technical focus. |
| 4 Materials and colour | not-assessed | Outside the technical focus. |
| 5 Geometry and scale | PASS | Room 3.6 x 3.2 m with 2.6 m ceiling; desk 0.775 m high; bed 1.1 x 1.9 m; door 2.1 m; all props rest on their supports. One minor coplanar mat (F-01). |
| 6 Detail and storytelling | not-assessed | Outside the technical focus. |
| 7 Technical readiness | PASS | HeroCam is the active camera; 1920x1080; BLENDER_EEVEE, 64 samples, AgX, opaque film; one Collection; no loose vertices or degenerate faces; non-manifold edges only on intentional single-sided planes. |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.70 | minor | 5 | REQ-03 / REQ-05 | scene-facts.json DeskTop (location z 0.75, scale z 0.025, top at 0.775 m) and DeskMat (location z 0.772, scale z 0.003, spans 0.769-0.775 m) | DeskMat is fully embedded in the desktop and its top face is exactly coplanar with the desk top at 0.775 m; it renders as a flush inlay and risks z-fighting instead of reading as a mat. | Raise DeskMat about 2 mm (top approx. 0.777 m) so it sits proud of the desk, or remove it; the keyboard bottom at 0.775 m would then sink 2 mm, which is hidden. |

## Re-review

- R05 technical F-01 (5 mm gap between desk-leg tops and the desk underside) -> FIXED. DeskLegLeft and DeskLegRight are now 0.725 m tall with centers at z 0.3625 m (scene-facts DeskLegLeft/DeskLegRight), tops at 0.725 m, exactly meeting the DeskTop underside (0.75 - 0.025 = 0.725 m); legs visibly meet the desk in camera.png.
- R04 F-01 (floating plant) -> holds fixed: PlantPot bottom 1.74 m rests on BookshelfTop top 1.74 m (scene-facts PlantPot/BookshelfTop); visible contact in camera.png.
- R04 F-02 (headboard/window overlap) -> holds fixed: Headboard top 0.83 m clears the window bottom frame at 0.835 m (scene-facts Headboard/WindowFrameBottom); visible gap in camera.png.
- Note: the R05 REPORT.md read was denied by the grader gate (outside frozen assignment); the dispositions above are checked against the ticket's stated prior findings and the current scene facts.

## Residual risks

- scene-facts.json does not enumerate external image or library dependencies; the no-missing-files acceptance is inferred from the primitive-only object inventory, procedural material names, and an artifact-free render (no magenta or unresolved textures).
- HeroCam focal length is not recorded in scene-facts; the ticket states 20 mm and the render shows the required wide three-quarter view.
- Material node contents and light data values are not in the evidence; visual lighting and material dimensions are left to the visual grader.
- Five single-sided planes (WindowGlow, MonitorScreen, WallArtCanvas, ArtInset, ArtMotif) each report 4 non-manifold edges; these are intentional, camera-facing surfaces.
