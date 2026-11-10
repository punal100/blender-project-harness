# Grader Report — visual

- Round: R01-20261110T131240Z
- Grader: visual
- Focus: composition, camera, lighting, colour, materials, mood
- Model/variant: punal-9router-compatable / nvidia/mistralai/mistral-large-4-1t-a52b / high
- Target: base 8d63745d96fd12ee688fde42333a276191693978, saved scene SHA-256 752c5b5b23b6eed28aca24af99e3d1ba17b4cbfdc5d59f225c57c9c85daf4521, project dirty
- Evidence key: 38a4bf3fedbda259abc498a6acf2977cab070e210941fae47a45c159755963a9
- Verdict: CHANGES_REQUIRED
- Evidence inspected: renders/final/R01-20261110T131240Z.png (viewed), _evidence/scenes/Scene/camera.png (same sha256, viewed), _evidence/scenes/Scene/scene-facts.json, _evidence/scenes/Scene/scene.txt, manifest.json, REQUIREMENTS.md, Goals/01-project-brief.md

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1 Spec fidelity (REQ-01, REQ-05, REQ-07, REQ-09) | FAIL | REQ-01/05/07 satisfied for the shell milestone (scene-facts.json: RoomShell 10x7x3.3 m, Floor+GroutX/Y, WindowMullions+WindowSill, Baseboard x3, EntranceMat, FixtureRowLeft/Right, NightBackdrop, LightWarm+LightCool; camera.png shows all). REQ-09 fails: camera.png is a dead-frontal symmetric view, not three-quarter, and HeroCamera sits at the rear wall, not near the entrance. |
| 2 Composition and camera | FAIL | camera.png: perfectly symmetric frontal framing of the glazing wall. scene-facts.json: HeroCamera location [0, 2.9, 1.65], rotation [1.4982, 0, 3.1053] (yaw 177.9 deg, ~2 deg off straight -Y, x=0 centered). Entrance mat at y=-2.7 marks the entrance; camera at y=+2.9 is ~5.6 m behind it. Eye level 1.65 m and 1920x1080 16:9 are correct. |
| 3 Lighting and exposure | PASS | camera.png: four emissive fluorescent bars (FixtureRowLeft/Right, Fluoro_Material) read as the warm key; a cool dusk pool from LightCool is visible on the ceiling/window side against the dark NightBackdrop; AgX exposure 0 keeps floor, walls and fixtures readable with no crushed shadows; fixture tubes clip white as expected for emissive. |
| 4 Materials and colour | PASS | camera.png + scene-facts.json: light ceramic FloorTile with dark Grout grid, painted ShellPaint walls, dark drop ceiling, FrameMetal mullions/sill, MatRubber entrance mat, dark blue night glazing; palette is coherent cool-evening with warm fixture accents. |
| 5 Geometry and scale | not-assessed | Outside assigned focus; room scale sanity (10x7x3.3 m vs approx 10x7x3.2 m, 1 unit = 1 m) noted under dimension 1. |
| 6 Detail and storytelling | not-assessed | Machine rows, props and signage are future milestone scope; deferred, not a finding. |
| 7 Technical readiness | not-assessed | Outside assigned focus; render is 1920x1080 PNG, camera set to HeroCamera, EEVEE, AgX per scene-facts.json. |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.90 | major | 2 (also 1) | REQ-09: eye-level three-quarter interior view from near the entrance, 16:9 | scene-facts.json HeroCamera location [0,2.9,1.65] rotation z=3.1053 rad (177.9 deg); camera.png shows symmetric frontal view; EntranceMat at y=-2.7 marks the entrance | Camera is centered (x=0), dead-frontal (yaw ~2 deg off axis), and at the rear wall y=+2.9, ~5.6 m from the entrance mat at y=-2.7. REQ-09 requires a three-quarter view from near the entrance; only eye level (1.65 m) and 16:9 are met. Machine-row framing is deferred, but angle and position are current scope and visibly wrong. | Move HeroCamera near the entrance (y approx -2.3 to -2.7, z=1.65), offset laterally (x approx +/-2.5 to 3.0), and yaw/pitch it diagonally across the room (~30-45 deg off the wall axis) so both side walls and room depth read in three-quarter; keep 1920x1080. |
| F-02 | 0.70 | minor | 1 (also 4) | REQ-05: drop ceiling with recessed fluorescent fixtures | scene-facts.json FixtureRowLeft/Right at z=3.13 (top 3.16) vs RoomShell height 3.3; camera.png shows bars hanging proud of the ceiling plane | The fluorescent bars are surface-hung below the shell ceiling rather than recessed into a drop-ceiling plane; no separate drop-ceiling grid is modeled. | Add a drop-ceiling plane at ~3.15 m with openings, or sink the fixture boxes flush into the ceiling so they read as recessed troffers. |

## Re-review

First review for this grader; no prior report supplied. Prior attempt 1 timed out before writing a report, so there are no prior findings to disposition.

## Residual risks

- REQ-09's framing of both machine rows and the folding area, and REQ-07's emissive accents on machines/vending, cannot be assessed because machines and props are unbuilt future scope; they are deferred, not findings.
- Warm vs cool balance in camera.png reads mostly neutral (white fluorescent key, cool pool on ceiling); machine-level emissive accents may shift the evening mood later.
- RoomShell height is 3.3 m vs the spec's approx 3.2 m; within "approximately", noted only.
- scene-facts.json lists no FrontGlass object (deleted in T006), yet the glazing still reads via NightBackdrop + mullions; glass material presence could not be confirmed from facts alone.
