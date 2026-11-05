# Grader Report — visual

- Round: R03-20261105T153033Z
- Grader: visual
- Focus: visual / composition, camera, lighting, colour, materials, mood, detail and storytelling
- Model/variant: punal-9router-compatable / ocg/deepseek-v4.1-flash / Max
- Target: base 919cabeb65d87209658bb2cce15cf831edceff47, saved scene SHA-256 34f4d125f3ef7c0ff249e32476c35a5183ef609cee60dc056ace3e336f098838, project dirty
- Evidence key: 958425adac3d77f2fa8aeeaec2f4c65f72648e977fcc175e454842abd463784c
- Verdict: CHANGES_REQUIRED
- Evidence inspected: renders/final/R03-20261105T153033Z.png (sha256 80b6b48985e1f9a4f0ce059b355006a6c5411d8c76045d0935c9e7afd2a8e93b); Documents/Reviews/R03-20261105T153033Z/_evidence/scenes/Scene/camera.png (same sha256); Documents/Reviews/R03-20261105T153033Z/_evidence/scenes/Scene/scene-facts.json and scene.txt (sha256 000575494d9a537a5d17a4c5be587b4921f986cb190bf4db5e839491ef8a67c4); Documents/Reviews/R02-20261105T150726Z/visual/REPORT.md; Documents/REQUIREMENTS.md; Documents/Goals/01-project-brief.md; Documents/REVIEW.md

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1 Spec fidelity | FAIL | REQ-03: camera at 1.72 m with a wide ~35 mm view and the whole window in frame; machine wall/counter/waiting area deferred. REQ-06: fails at the ceiling (F-05). REQ-07: painted wall, muted teal trim, grout-grid floor and runner present; glass remains a no-transmission approximation. REQ-08: no visible seam or intersection at this distance. |
| 2 Composition and camera | PASS | camera.png: window fully in frame with ~1% left margin; eye-level hero; blank wall reserved for the future machine wall; pendant stems leave the top edge (residual, no required element clipped). |
| 3 Lighting and exposure | FAIL | F-05: ceiling band is cool blue-grey and mottled while the peach wall is broad and bright; warm tungsten does not carry into the ceiling. |
| 4 Materials and colour | PASS | Cream wall, muted teal window trim and runner, terrazzo/linoleum floor with a 1 m grout grid; flat grey window glass unchanged (prior F-04, declined as within REQ-07); ceiling palette issue tracked under F-05. |
| 5 Geometry and scale | PASS | scene-facts: room 6.2 x 5.2 x 2.8 m; window 1.62 x 1.56 m at 1.55 m centre; pendant stems span 2.385-2.80 m and meet the ceiling; small rug/grout overlaps (<5 mm) are not visible. |
| 6 Detail and storytelling | PASS | Shell detail is present: window frame and mullion, grout grid, wider runner, pendant stems. Machine/counter/prop storytelling is future scope and not counted. |
| 7 Technical readiness | PASS | 1920x1080 PNG, EEVEE 64 samples, Camera_Hero set, no external file references in the scene facts; no stray helper objects. |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-05 | 0.78 | major | 3 | REQ-06 | camera.png / renders/final/R03-20261105T153033Z.png, top band y≈0-200 px (blue-grey patch x≈650-1200) | The ceiling renders cool grey-blue with a darker mottled patch instead of cream, while the walls are lit broad and bright; the warm evening tungsten/cream-amber palette breaks across the top fifth of the frame and the ceiling reads as an unlit void. | Warm/neutralise the window fill and add a low warm ceiling bounce/ambient (or a soft warm up-light), raise ceiling roughness if it is reflecting the window, and reduce the wall key; re-render and verify the ceiling reads cream. |

## Re-review

| Prior finding | Status | Evidence |
|---|---|---|
| F-01 major — window left trim at image edge | FIXED | camera.png: the entire window frame is inside the frame, left trim at x≈16 px of 1920 with a peach wall margin. |
| F-03 major — flat floor / sparse grout / sliver runner | FIXED | scene-facts: 10 grout bars form a 1 m grid (X/Y at ±2, ±1, 0 m) and the runner is 3.6 x 0.8 m; camera.png bottom band now shows the grid and a broad green runner. Residual: the visible floor band is narrow and the runner is still trimmed by the bottom/right edge. |
| F-02 minor — pendants unsupported | FIXED | scene-facts Pendant_Stem_1/2 run 0.415 m from the fixture tops (z=2.385) to the ceiling (z=2.80); both stems are visible in camera.png. |
| F-04 minor — flat window glass | OPEN | camera.png: the panes remain flat opaque grey with no reflection or exterior glimpse; unchanged from R02. Prior disposition declined this as within REQ-07's no-transmission allowance; not re-raised as a defect. |

## Residual risks

- Machines, folding counter, waiting nook, props and the evening exterior glimpse (REQ-05) are unbuilt; machine-wall framing, full composition, storytelling and final-scene eye-level/35-50 mm acceptance remain deferred.
- The visible floor band is small; wear/terrazzo detail and the runner edge are hard to judge, and the runner is still trimmed by the hero frame.
- Camera focal length is not recorded in scene-facts; ~35 mm is inferred from the window angular size, so exact 35-50 mm compliance is unverified.
- Pendant-stem ceiling attachments leave the top edge of the hero frame; support exists in the scene but the connection is not shown.
- Only the sealed hero image and scene facts were available; no pixel-level clipping analysis was performed, and the pendant emissive faces read white as light sources.