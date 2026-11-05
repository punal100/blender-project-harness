# Grader Report — technical

- Round: R04-20261105T154954Z
- Grader: technical
- Focus: scale, geometry, topology, render settings, missing files, scene health
- Model/variant: punal-9router-compatable / ocg/deepseek-v4.1-flash / Max (backup)
- Target: base a113404799ea8c9dd380c16fa4eec13efcdab9e2, saved scene SHA-256 1e18eb7f122687f0bd82abab0075a2113908aeb6fadddad97a0d75489aa3d0d4, project dirty
- Evidence key: 3da7d4c5e8cf259dd5b8d4abe989be05e29dafddcde5a98dca4e46a366cd2998
- Verdict: PASS
- Evidence inspected: renders/final/R04-20261105T154954Z.png; _evidence/scenes/Scene/camera.png; _evidence/scenes/Scene/scene-facts.json; _evidence/scenes/Scene/scene.txt; manifest.json; prior R03 technical REPORT.md.

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1. Spec fidelity | PASS (REQ-06, REQ-08; room shell only) | camera.png: warm cream/amber wall, sage-teal window trim, two pendant practicals with warm undersides, soft window-frame shadow; no blown wall or window whites; clean window casing/sill and pendant joins. scene.txt: all shell meshes report 0 non-manifold edges, 0 loose vertices, 0 degenerate faces. Machines, counter and props are future and not assessed. |
| 2. Composition and camera | not-assessed | Visual focus; camera assignment/settings checked only under dimension 7. |
| 3. Lighting and exposure | not-assessed | Visual focus; REQ-06 assessed under dimension 1. Light type, energy and colour temperature are absent from the frozen evidence. |
| 4. Materials and colour | not-assessed | Visual focus; shader values are absent from the frozen evidence. |
| 5. Geometry and scale | PASS | scene.txt: room 6.2 x 5.2 x 2.8 m (REQ-04 approx 6 x 5 x 2.8); window 1.62 x 1.56 m with 0.77 m sill; pendant stems 0.03 x 0.03 x 0.415 m centred z=2.5925, spanning z=2.385-2.800 and meeting the 0.09 m fixtures (top 2.385) and the 2.80 m ceiling underside; 0.36 m fixtures; 3.6 x 0.8 m rug; camera z=1.72 m. Boxes are 8-vertex/6-face and cylinders 64-vertex; no gaps, visible interpenetration or floating beyond millimetre grout/rug offsets. |
| 6. Detail and storytelling | not-assessed | Machines, counter, props and waiting nook are future milestones; deferred, not reported as absent. |
| 7. Technical readiness | PASS | scene.txt: engine BLENDER_EEVEE, 1920x1080, 64 samples, AgX, film_transparent false, Camera_Hero assigned, one Collection, no modifiers, no default/stray helper objects. manifest.json: scene sha256 1e18eb7f...d0d4 and evidence key 3da7d4c5...2998 match the ticket. asset_check is null (see residual risks). |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|

No findings in the assessed dimensions.

## Re-review

- F-02 (minor, R02) — FIXED: R04 scene.txt shows Pendant_Stem_1/2 at 0.03 x 0.03 x 0.415 m, centre z=2.5925, spanning z=2.385-2.800; each meets its fixture top (Ceiling_Fixture_1/2 centre z=2.34, 0.09 m thick, top 2.385) and the ceiling underside (2.80). No regression from the R04 light moves.
- R03 returned PASS with no findings. R04 changed only Light_Ceiling_1/2 z to 1.95, Light_Window_Fill z to 1.0 and the ceiling material emission to 0.55; all shell geometry is unchanged and remains clean, so shell health holds.

## Residual risks

- asset_check is null in the R04 manifest, so missing external files cannot be verified from the frozen evidence. No image textures or external references appear in scene.txt and camera.png shows no missing-texture artifacts, so the risk is low. REQ-14 is not in this round's assigned requirements.
- Light type/energy/colour temperature, the ceiling material emission value (0.55) and the camera focal length are not present in scene-facts/scene.txt. The ceiling directly above Light_Ceiling_2 shows a bright near-white light pool clipped by the top edge of camera.png; if pixel clipping is confirmed it would touch REQ-06's "no blown-out whites". The visual grader covers exposure.
- scene-facts.json is byte-identical to scene.txt (both SHA-256 b8f8f231...e2c5), so it carries no separate asset, light or material data.
- use_sequencer is true with no strips; harmless for this still, but inserting strips later would change the render path.
