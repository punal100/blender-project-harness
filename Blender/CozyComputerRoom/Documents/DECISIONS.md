# Design Decisions — CozyComputerRoom

Record decisions that affect the visual result, scope, assets, or delivery. Keep the reason and impact, not a diary.

| Date | Decision | Reason | Impact |
|---|---|---|---|
| 2026-11-05 | Project scaffold created. | New design project. | Persist confirmed requirements and mode records, fill README and goal, then register before launch. |
| 2026-11-05 | Fully modeled, fully procedural scene with no external assets. | User direction: procedural only, no project scripts, no external assets. | All geometry comes from supported primitives and mesh operations; materials use base color, roughness, metallic, and emission. No missing-file risk. |
| 2026-11-05 | Enclosed room at 3.6 x 3.2 m with a 2.6 m ceiling. | User-specified compact full-room scale. | Camera and furniture must fit a tight interior; hero view must read the desk and window without clipping. |
| 2026-11-05 | Warm lamps against a cool dusk window. | User-specified semi-realistic stylized mood. | Lighting is a deliberate two-temperature setup: warm interior practicals plus cool blue window fill. |
| 2026-11-05 | Wide three-quarter eye-level hero camera. | Best framing for a full furnished room and the computer focal point. | Single camera near 1.5 m in a corner, 16:9 at 1920x1080. |
