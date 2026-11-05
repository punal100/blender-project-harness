# Grader Report — technical

- Round: R03-20261105T153033Z
- Grader: technical
- Focus: scale, geometry, topology, render settings, missing files, scene health
- Model/variant: punal-9router-compatable / ocg/deepseek-v4.1-flash / Max (backup)
- Target: base 919cabeb65d87209658bb2cce15cf831edceff47, saved scene SHA-256 34f4d125f3ef7c0ff249e32476c35a5183ef609cee60dc056ace3e336f098838, project dirty
- Evidence key: 958425adac3d77f2fa8aeeaec2f4c65f72648e977fcc175e454842abd463784c
- Verdict: PASS
- Evidence inspected: renders/final/R03-20261105T153033Z.png (sha 80b6b489…8e93b); Reviews/R03-20261105T153033Z/_evidence/scenes/Scene/camera.png (same sha, identical image); …/Scene/scene-facts.json (sha 00057549…67c4); …/Scene/scene.txt (same sha, duplicate); Reviews/R03-20261105T153033Z/manifest.json

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1. Spec fidelity | PASS (REQ-03/06/07/08, room shell only) | Full 1.62 x 1.56 m window including all four trim members, mullion and both panes is inside the frame in camera.png (~17-650 px of 1920, none clipped); camera.png shows warm cream/amber wall, sage-teal trim, pendant practicals and no blown wall whites. Machines, counter, waiting area, appliance/counter/fabric materials and detergent props are deferred to the furnishings milestone and not assessed. |
| 2. Composition and camera | not-assessed | Visual focus. REQ-03 height/clipping checked under dimensions 1 and 5 only. |
| 3. Lighting and exposure | not-assessed | Visual focus; light type, energy and colour temperature are absent from scene-facts. |
| 4. Materials and colour | not-assessed | Visual focus; shader values are absent from scene-facts. |
| 5. Geometry and scale | PASS | scene-facts: interior 6.2 x 5.2 m, walls 2.8 m (ceiling underside 2.80), window 1.62 x 1.56 m with sill at 0.77 m, fixtures 0.36 m drums, grout 16 mm, rug 3.6 x 0.8 m; every mesh reports 0 non-manifold edges, 0 loose vertices, 0 degenerate faces; camera at z=1.72 m, eye-level, no clipping. |
| 6. Detail and storytelling | not-assessed | Furnishings are not built in this milestone; deferred. |
| 7. Technical readiness | PASS | scene-facts: engine BLENDER_EEVEE, 1920x1080, 64 samples, AgX, film_transparent false, Camera_Hero assigned; manifest scene sha256 34f4d125…098838 and evidence_key 958425ad…64c match the ticket; no stray helper meshes beyond the intentional fixtureless window-fill light. asset_check is null — see residual risks. |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | No findings in the assessed dimensions. | — |

## Re-review

- F-02 (minor, R02): FIXED — scene-facts lists Pendant_Stem_1 at (-1.2, 1.2) and Pendant_Stem_2 at (1.1, 1.8), each 0.03 x 0.03 x 0.415 m with centre z=2.5925, so each spans z=2.385-2.800: the bottom meets the fixture top (2.34 + 0.045 = 2.385) and the top meets the ceiling underside (2.85 - 0.05 = 2.800) with no gap, and both share the fixture x/y. camera.png shows a thin dark rod rising from each pendant drum and exiting the top frame edge (the ceiling above the pendants is above the frame). The 0.415 m unsupported float is gone; no regression visible.

## Residual risks

- Focal length, light type/energy/colour temperature, shader values and world settings are not recorded in scene-facts; REQ-03's 35-50 mm FOV and REQ-06's tungsten balance are inferred from the render projection and palette only.
- asset_check is null and the facts carry no image-file inventory; no textured datablock appears in the shell and the render shows no missing-texture magenta, but a definitive missing-file audit (REQ-14) is unavailable this round.
- The window's left trim sits about 1% (≈17 px of 1920) inside the frame edge. It is not clipped now, but a later camera or prop change could crop it.
- Camera_Hero was transformed this round (manifest T029) and now sits at z=1.72 m, 0.12 m above the "about 1.6 m" target, though still eye-level; lens data is not in the facts.
- The pendant stems' top caps are coplanar with the ceiling underside at z=2.80 (potential z-fighting on a 3 cm square, above this camera's view); it does not affect the delivered render.
