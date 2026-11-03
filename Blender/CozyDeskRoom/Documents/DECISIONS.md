# Design Decisions — CozyDeskRoom

Record decisions that affect the visual result, scope, assets, or delivery. Keep the reason and
impact, not a diary.

| Date | Decision | Reason | Impact |
|---|---|---|---|
| 2026-11-03 | Project scaffold created. | New design project. | Persist exact requirements, workflow, and review records; fill README and start the filled goal before launch. |
| 2026-11-03 | Room is a 3.6 × 3.6 × 2.7 m corner with a back wall and right wall, leaving the camera side open. | Keeps the three-quarter composition readable without ceiling or unused walls. | Less geometry; camera stays inside the room volume. |
| 2026-11-03 | Geometry uses only primitives and simple Principled materials. | Harness operations support primitives, transforms, and basic materials; external assets are out of scope. | Stylised-realistic forms; detail comes from proportion, grouping, and light. |
| 2026-11-03 | Lighting is four practicals: warm ceiling key, warm desk lamp, cool window area, and a small monitor glow. | Reads as cozy evening with cool exterior contrast. | Mood depends on light balance; energies and placement are tuned against sealed renders. |
| 2026-11-03 | Window is an emissive twilight plane with a wood frame and curtains rather than real glass. | No texture, HDRI, or transmission beyond base Principled controls. | Window reads as a bright cool source while remaining geometry-light. |
