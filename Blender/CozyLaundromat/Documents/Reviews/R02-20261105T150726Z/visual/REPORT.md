# Grader Report — visual

- Round: R02-20261105T150726Z
- Grader: visual
- Focus: composition, camera, lighting, colour, materials, mood, detail and storytelling
- Model/variant: ocg/deepseek-v4.1-flash / Max (backup, manifest modelRole=backup; assigned primary layso/claude-sonnet-5-5 / xhigh)
- Target: base 3f5e3c05b34fc7c1a08a86554029c207ea69c102; saved scene SHA-256 bbba0dc62c7844014b8a689a70c92b08ea5477fe5d9832577c717547691edfde; dirty (M DECISIONS.md, TASKSTRACKER.md, README.md, cozylaundromat.blend; untracked T022/ and R02 final render)
- Evidence key: 9513efd49190ae6733faf993ef2c6112d11bb23d630883862a04266a1f6b9a74
- Verdict: CHANGES_REQUIRED
- Evidence inspected: renders/final/R02-20261105T150726Z.png and _evidence/scenes/Scene/camera.png (identical SHA-256), _evidence/scenes/Scene/scene-facts.json, Documents/REQUIREMENTS.md, Documents/Goals/01-project-brief.md, R01-20261105T143815Z/visual/REPORT.md

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1 Spec fidelity | FAIL | REQ-03 window still clipped at the left edge; REQ-07 floor does not read as worn tile |
| 2 Composition and camera | FAIL | camera.png: window's left frame member outside frame; teal runner reduced to a bottom-edge sliver |
| 3 Lighting and exposure | PASS | camera.png: two visible disc practicals, warm ceiling/wall pools, soft gradients, no clipped wall values |
| 4 Materials and colour | FAIL | camera.png: floor is uniform peach with three sparse oversized grout lines; window glass is flat opaque grey-blue |
| 5 Geometry and scale | not-assessed | Outside assigned focus; technical grader covers geometry |
| 6 Detail and storytelling | not-assessed | Required machines, counter, props and seating are deferred by this milestone |
| 7 Technical readiness | not-assessed | Outside assigned focus; technical grader covers render settings and scene health |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.85 | major | 2 | REQ-03 | camera.png, left edge x=0; window spans y approx 165-760 | The left vertical window frame/trim is cut by the image edge, so the full window is not framed despite the revision claim; only the top, right and bottom frame members are visible. | Rotate Camera_Hero about 4-5 degrees toward the window (rotation Z from -0.124 to about -0.05 rad) or shift it left so the whole frame clears the left edge with margin; re-frame again once the machine wall exists. |
| F-03 | 0.80 | major | 4 | REQ-07 | camera.png, bottom band y approx 960-1080; scene-facts grout locations x=-1.55/0/1.55, y=-1.3/0/1.3 | The floor still reads as a flat peach plane: only three longitudinal dark grout lines are visible, spaced about 1.3-1.55 m (too wide for tile), with no cross grid and no tile or terrazzo pattern; the 3.2 m teal runner shows only as a thin sliver at the bottom edge. The prior flat-floor finding is only partially addressed. | Apply a visibly worn tile/linoleum or terrazzo material with a complete grout grid at tile scale inside the visible floor band, and reposition the runner into that band (or pitch the camera down slightly) so it reads in the hero frame. |
| F-05 | 0.62 | minor | 4 | REQ-07 | camera.png, window panes x approx 5-590, y approx 180-740 | The window glass renders as flat opaque blue-grey panels with almost no reflection or depth, so it reads as a solid board rather than glazing; an evening exterior glimpse (REQ-05, deferred) is absent. | Increase glass specular/reflection response slightly and place a dim cool exterior backing plane behind the panes so they read as glass while remaining a no-transmission approximation. |

## Re-review

| Prior finding | Status | Evidence |
|---|---|---|
| F-01 window clipped / framing | OPEN | camera.png: left frame member still outside the image at x=0; the window is not fully within frame. |
| F-02 flat lighting, no visible practical | FIXED | camera.png: both ceiling disc fixtures are visible with warm pools on the ceiling and upper wall; soft falloff replaces the flat wash. |
| F-03 flat solid floor | OPEN | camera.png: floor remains a uniform peach plane; only three sparse grout lines and a clipped runner edge are visible. |
| F-04 window specular blob | FIXED | camera.png: the discrete bright blob is gone; the panes now show a smooth matte gradient. |

## Residual risks

- Machines, folding counter, waiting nook, baskets and other props (REQ-05) are not built yet; full composition, machine-wall framing and storytelling are deferred, not graded, by this milestone.
- Camera lens/FOV is not recorded in scene-facts.json; the window-clipping finding relies on the render and an estimated 35 mm view.
- The ceiling shows broad soft dark patches near the top edge (likely fixture/light self-shadowing) that read as smudges; not raised as a finding, but worth re-checking when the content pass changes the lighting.
- Lighting is judged on the empty shell only; the plant, counter and machine luminance will shift the balance once added.
