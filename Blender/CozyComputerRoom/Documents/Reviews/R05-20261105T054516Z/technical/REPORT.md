# Grader Report — technical

- Round: R05-20261105T054516Z
- Grader: technical
- Focus: scale, geometry, topology, render settings, missing files, scene health
- Model/variant: primary punal-9router-compatable / ocg/deepseek-v4.1-flash / Max
- Target: base aa16a7cb1f4504eb010091bb89d95caf45d56fda, saved scene SHA-256 df7449846cac377bd405d4a9ea1cadeea75bcf72b0700b11e602b28a567f5953, project dirty
- Evidence key: 6f5356afe98c26d7180cfda3fc3a182601e06176790e278bf5558fad75fe4554
- Verdict: PASS
- Evidence inspected: Documents/REQUIREMENTS.md; Documents/Goals/01-project-brief.md; R05 _evidence/scenes/Scene/camera.png; R05 _evidence/scenes/Scene/scene-facts.json; R05 _evidence/scenes/Scene/scene.txt (same content as scene-facts.json); prior R04 technical REPORT.md (via document read)

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1 — Spec fidelity (REQ-04, REQ-05) | PASS | scene-facts.json lists bed (BedFrame/Mattress/Headboard/Pillow/Pillow2/Blanket/ThrowFold), bookshelf with BooksRowLow/High and BookStack, Rug/RugBorder, PlantPot/Stem/Foliage/LeafCluster, WallArtFrame/Canvas/ArtInset, CurtainLeft/Right/Rod, Mug, Papers; material names cover wood, fabric, plastic, metal, paper, ceramic and plant; camera.png shows all of these readable. |
| 2 — Composition and camera | not-assessed | Visual focus, outside assigned technical review. |
| 3 — Lighting and exposure | not-assessed | Visual focus, outside assigned technical review. |
| 4 — Materials and colour | not-assessed | Material node graphs are not in the frozen facts; visual/material grading is outside this focus. |
| 5 — Geometry and scale | PASS | Room 3.6 x 3.2 x 2.6 m (Floor/Ceiling/Wall*), desk top z=0.775, bed 1.1 x 1.9 m, door 0.84 x 2.1 m; PlantPot bottom = 1.74 = BookshelfTop top; Headboard top 0.83 below window frame underside 0.835; all mesh stats show 0 non-manifold/loose/degenerate except intentional single-sided decal planes. |
| 6 — Detail and storytelling | not-assessed | Outside assigned technical review. |
| 7 — Technical readiness | PASS | HeroCam set, 1920x1080, BLENDER_EEVEE, AgX, film_transparent false, 64 samples; no stray helpers or extra cameras; no image/texture datablocks or external-file signals in facts; render produced successfully. |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.95 | minor | 5 | REQ-05 | scene-facts.json: DeskTop location z=0.75, dimensions z=0.05 (underside 0.725); DeskLegLeft/DeskLegRight location z=0.36, dimensions z=0.72 (top 0.720) | 5 mm gap between both desk-leg tops and the desk-top underside; carried over from R03, deferred by disposition, not visible at hero distance | Raise leg tops 5 mm to z=0.725 (or lower DeskTop 5 mm) during the final fix pass |

## Re-review

- R04 F-01 (floating plant) -> FIXED. BookshelfTop added at z=1.72 with 0.04 thickness (top 1.74); PlantPot center 1.83 with 0.18 height (bottom 1.74) and its footprint lies over the board; camera.png shows the pot resting on the shelf top.
- R04 F-02 (headboard overlapping window frame) -> FIXED. Headboard top z=0.83 vs WindowFrameBottom underside 0.835; 5 mm clearance, visible in camera.png.
- R03 F-01 (desk-leg gap) -> OPEN. Coordinates unchanged: leg top 0.720 vs desk underside 0.725; disposition says deferred to the final fix pass (reported here as minor F-01).

## Residual risks

- Node-level material graphs, packed images and external file paths are not in scene-facts; "procedural only" and "no missing external files" rest on material naming and the successful render, not a file audit.
- DeskMat top z=0.775 is coplanar with the DeskTop top z=0.775; no z-fighting is visible in this frame, but the coincident faces remain a render risk.
- Only one camera frame was supplied; hidden faces, undersides and the single-sided WindowGlow/MonitorScreen/WallArtCanvas/ArtInset planes were not viewed from other angles (treated as intentional decals).
- use_sequencer is true with no strips; the sealed render succeeded, so this is treated as harmless.
