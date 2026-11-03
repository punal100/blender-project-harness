# Design Decisions — CozyDeskRoom

Record decisions that affect the visual result, scope, assets, or delivery. Keep the reason and
impact, not a diary.

| Date | Decision | Reason | Impact |
|---|---|---|---|
| 2026-11-03 | Project scaffold created. | New design project. | Persist exact requirements, workflow, and review records; fill README and start the filled goal before launch. |
| 2026-11-03 | Room shell is 4.0 × 4.0 × 2.7 m with back, left, and right walls, leaving the camera side open. | Slightly larger than the brief's roughly 3.6 m guidance so the desk, chair, plant, and three-quarter camera fit without crowding while staying human-scaled. | More breathing room; camera stays inside the room volume. |
| 2026-11-03 | Geometry uses only primitives and simple Principled materials. | Harness operations support primitives, transforms, and basic materials; external assets are out of scope. | Stylised-realistic forms; detail comes from proportion, grouping, and light. |
| 2026-11-03 | Window is a real opening in segmented back-wall geometry with a recessed frame, mullions, emissive twilight glass, sill, and curtains. | No textures, HDRI, or transmission beyond base Principled controls, but the window still needs depth and a readable frame. | Window reads as a cool exterior source and anchors the right side of the composition. |
| 2026-11-03 | Lighting is four practicals: a warm ceiling area key at 3200 K, a warm desk-lamp point at 2700 K, a cool window area fill at 7500 K, and a small monitor glow at 2600 K. | Reads as cozy evening with cool exterior contrast while keeping the desk readable. | Mood depends on light balance; energies are tuned against sealed renders. |
| 2026-11-03 | Added potted plant, framed teal print, curtain rod, four-pane mullions, chair cushion, and a fourth book. | Completes the lived-in dressing and gives the empty right corner a focal point. | Composition gains foreground interest and a cool colour accent. |
| 2026-11-03 | Hero camera moved to (-1.75, -1.70, 1.72) with a 26 mm lens, aimed at the desk with the window behind. | Shows the whole desk, shelf, window, and plant without clipping the room. | Desk remains the subject; chair overlaps the lower centre as a foreground cue. |
| 2026-11-03 | Final scene saved with EEVEE, 1920 × 1080, 96 samples, and Camera_Hero set. | Delivery needs one clean hero render from the project file. | Render settings are reproducible from the saved scene. |
