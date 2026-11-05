# Grader Report — technical

- Round: R04-20261105T053219Z
- Grader: technical
- Focus: scale, geometry, topology, render settings, missing files, scene health
- Model/variant: punal-9router-compatable / ocg/deepseek-v4.1-flash / Max (primary; backup codex-everywhere/gpt-6.1-sol / xhigh)
- Target: base 7f30855b24aaa31e1fb0ee009a93c846eee0fddf, saved scene SHA-256 df8878a61dcf14f2e2db7f4bc9b9bfa2e4a8aa03256b5313538891ea9161b86d, project dirty
- Evidence key: 5c22c097c8312660cf0dc4c1be149d014c6b458c034400e9e7b79103683bf433
- Verdict: CHANGES_REQUIRED
- Evidence inspected: renders/final/R04-20261105T053219Z.png (sha256 87f63d0f...); _evidence/scenes/Scene/camera.png (same hash); _evidence/scenes/Scene/scene-facts.json and scene.txt (same hash a268583a...); Documents/REQUIREMENTS.md; Documents/Goals/01-project-brief.md.

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1 Spec fidelity (REQ-04, REQ-05) | PASS | camera.png shows bed, bookshelf with books, rug, plant, wall art, curtains, mug, papers and blanket; scene.txt assigns wood, fabric, plastic, metal, paper, ceramic and plant materials. |
| 2 Composition and camera | not-assessed | Outside assigned technical focus. |
| 3 Lighting and exposure | not-assessed | Outside assigned technical focus. |
| 4 Materials and colour | not-assessed | Outside assigned technical focus; material names present in scene.txt. |
| 5 Geometry and scale | FAIL | F-01 and F-02 from scene.txt coordinates; otherwise room, desk, bed, shelf and rug scale is believable and all solids are manifold. |
| 6 Detail and storytelling | not-assessed | Outside assigned technical focus. |
| 7 Technical readiness | PASS | scene.txt: HeroCam set, 1920x1080, EEVEE 64 samples, AgX, single Collection, 0 non-manifold edges / loose verts / degenerate faces on all solids; render exists at 1920x1080. |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.82 | major | 5 | REQ-04, REQ-05 | scene.txt: PlantPot z=1.79, dims z=0.18 (bottom 1.70); BookshelfShelfHigh top z=0.74; side panels only at y=-0.18/0.78; no top panel object; camera.png plant above shelf | Potted plant floats 0.96 m above the bookshelf's high shelf: its 0.18 m footprint at y=0.36-0.54 sits over the open bay with no board beneath it. The hero camera hides the gap behind the shelf rim, but any other view exposes it. | Add a bookshelf top panel at z~1.70 spanning the 0.92 m bay (0.32 x 0.92 x 0.04) under the pot, or lower the pot onto the high shelf top (z=0.74) clear of the book rows. |
| F-02 | 0.75 | minor | 5 | REQ-04 | scene.txt: Headboard z=0-0.84, y=1.535-1.595, x=0.58-1.72; WindowFrameBottom z=0.835-0.905 (underside 5 mm below headboard top) | The bed headboard intersects the window sill frame by 5 mm across the window-width overlap; the bed is otherwise correctly placed under the window. | Lower the headboard top by at least 10 mm or raise the window frame; keep the headboard at least 5 mm off the back wall. |

## Re-review

- R03 F-01 (desk legs vs desk-top underside, minor technical) -> OPEN. Disposition supplied by ticket: deferred to the final fix pass. scene.txt still shows DeskLegLeft/Right top z=0.720 vs DeskTop underside z=0.725 (5 mm gap). Not re-counted as a new finding this round.

## Residual risks

- Node-level material graphs and image/packed file references are not in scene facts; "no missing external files" and procedural material status rest on scene.txt material names plus the render (no image textures or file errors visible).
- Modifier parameters (ARRAY count/offset, BEVEL widths), custom normals and the saved .blend file name were not inspectable; scene facts report 0 non-manifold edges, loose verts and degenerate faces on all solids.
- Bookshelf bay from z=0.74 to 1.70 is empty above the two book rows and reads as a large blank panel in the hero render; visual-quality risk, not a REQ-04 failure.
- Hidden overlaps read acceptably in camera.png: mattress 30 mm into bed frame, bed frame 24 mm into rug, chair base 24 mm into rug; all concealed inside solid volumes.
- Prior R03 report read was denied by the harness gate; the R03 disposition above is taken from the grader ticket.
