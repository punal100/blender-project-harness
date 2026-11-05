# Grader Report — visual

- Round: R04-20261105T053219Z
- Grader: visual
- Focus: composition, camera, lighting, colour, materials, mood, detail and storytelling
- Model/variant: punal-9router-compatable / ocg/deepseek-v4.1-flash / Max (runtime backup; ticket primary layso/claude-sonnet-5-5 / xhigh)
- Target: base 7f30855b24aaa31e1fb0ee009a93c846eee0fddf, saved scene SHA-256 df8878a61dcf14f2e2db7f4bc9b9bfa2e4a8aa03256b5313538891ea9161b86d, project dirty
- Evidence key: 5c22c097c8312660cf0dc4c1be149d014c6b458c034400e9e7b79103683bf433
- Verdict: CHANGES_REQUIRED
- Evidence inspected: renders/final/R04-20261105T053219Z.png (sha256 87f63d0f...f58c), Reviews/R04-20261105T053219Z/_evidence/scenes/Scene/camera.png (same sha256 as final render), _evidence/scenes/Scene/scene-facts.json (sha256 a268583a...f8e4; scene.txt is the same hash)

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1 Spec fidelity | FAIL | REQ-04: bed + mattress + headboard + pillow + blanket, bookshelf with two book rows, rug, potted plant, framed wall art, two curtains, mug and papers are all present (scene-facts.json object list; camera.png). REQ-05: forms are clean and proportions believable, but the surface response fails (F-01). |
| 2 Composition and camera | PASS | camera.png: HeroCam eye-level wide three-quarter view (1.55 m, scene-facts.json) shows the desk/computer centre-left, window right, bookshelf left, bed foreground right; required furnishing and the computer stay readable with no occluding clipping. Window/curtain right-edge framing is a deferred R02 note, not re-graded. |
| 3 Lighting and exposure | not-assessed | REQ-06 lighting is a later milestone (deferred). Observation only: warm walls vs cool window split is present and no blown highlights are visible, so the furnishing content is readable. |
| 4 Materials and colour | FAIL | camera.png: furnishing surfaces (blanket, mattress, rug, bookshelf, chair, books, plant pot) render as uniform flat base colours with no visible wood grain, fabric weave/nap, ceramic or metal response; palette itself is coherent. See F-01. |
| 5 Geometry and scale | PASS | scene-facts.json + camera.png: bed 1.1 x 1.9 m (top 0.53 m), bookshelf 1.0 x 0.32 x 1.7 m, rug 2.1 x 1.5 m, chair seat 0.46 m, plant 0.36 m foliage; mug/papers sit on the desk top (0.775 m), plant pot on the bookshelf top (1.70 m), bed and bookshelf on the floor; no visible floating or interpenetration. |
| 6 Detail and storytelling | PASS | camera.png: all REQ-04 cozy props are present (mug, papers, soft blanket, books, plant, framed art, curtains) and arranged plausibly; empty-art and stiff-blanket quality minors in F-02/F-03. |
| 7 Technical readiness | not-assessed | Outside the visual focus; assigned to the technical grader. |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.72 | major | 4 | REQ-05 | renders/final/R04-20261105T053219Z.png / camera.png — blanket, mattress, rug, bookshelf sides, chair, books, plant pot across the whole frame | The new furnishing surfaces render as flat untextured base colours: no visible procedural wood grain on the bed frame/bookshelf, no fabric weave or nap on the blanket/mattress/chair, no pile or pattern on the rug, and no ceramic breakup on mug/pot. The bed, rug and bookshelf read as blockout volumes, so the semi-realistic half of the required semi-realistic stylized look is not visible in the hero render. | Add subtle procedural surface variation at render scale: grain + bump on bed frame, bookshelf and floor wood; fabric weave/nap and roughness variation on blanket, mattress, chair and curtains; a simple rug pattern/pile; ceramic glaze breakup on mug and plant pot. Keep the confirmed palette and clean stylized forms. |
| F-02 | 0.70 | minor | 6 | REQ-04 | camera.png — framed art above the desk (WallArtFrame + WallArtCanvas) | The wall art is an empty flat orange canvas inside the frame; it reads as an unfinished placeholder rather than a picture, weakening the lived-in wall. | Add a simple procedural print inside the frame (soft gradient/shape composition or canvas-texture artwork) using existing wood/paper materials. |
| F-03 | 0.68 | minor | 6 | REQ-04 | camera.png — foreground bed, pink blanket | The soft blanket is a rigid beveled slab lying flat on the mattress with no overhang or folds; it reads as a hard board rather than fabric, reducing the cozy read. | Give the blanket a small overhang at the bed edges and 2–3 soft fold ridges (subdivide/bevel or simple displaced geometry), keeping the flat procedural look. |

## Re-review

- R03 F-01 (lamp light trapped in shade) — OPEN, explicitly deferred to the final lighting pass; the desk lamp still shows no warm pool on the desk in camera.png.
- R03 F-02 (flat wood/brass/chair-metal response) — OPEN, re-raised for the new furnishing surfaces as F-01 above (0.72, major).
- R03 F-03 (pale flat monitor screen) — OPEN, deferred to the final lighting/material pass; the screen still reads as a pale panel.
- R02 deferred items (rigid curtain boards, flat cool window cast, right curtain edge clipping) — still present but remain deferred; not re-graded in this partial milestone.

## Residual risks

- Only one camera render was supplied; hidden surfaces, shader-node detail, material procedural content, and back-of-furniture intersections could not be inspected, and live scene inspection was disallowed.
- Lighting and mood (REQ-06) are deferred to the later lighting milestone; the flatness noted in F-01 may partly be lighting, but the clear lack of surface variation is visible regardless.
- The window/curtain right-edge framing, curtain rigidity and monitor glow remain deferred R02/R03 items and were not re-graded here.
