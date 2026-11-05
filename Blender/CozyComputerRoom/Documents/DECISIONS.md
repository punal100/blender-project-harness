# Design Decisions — CozyComputerRoom

Record decisions that affect the visual result, scope, assets, or delivery. Keep the reason and impact, not a diary.

| Date | Decision | Reason | Impact |
|---|---|---|---|
| 2026-11-05 | Project scaffold created. | New design project. | Persist confirmed requirements and mode records, fill README and goal, then register before launch. |
| 2026-11-05 | Fully modeled, fully procedural scene with no external assets. | User direction: procedural only, no project scripts, no external assets. | All geometry comes from supported primitives and mesh operations; materials use base color, roughness, metallic, and emission. No missing-file risk. |
| 2026-11-05 | Enclosed room at 3.6 x 3.2 m with a 2.6 m ceiling. | User-specified compact full-room scale. | Camera and furniture fit a tight interior; the hero view reads the desk and window without clipping. |
| 2026-11-05 | Warm lamps against a cool dusk window. | User-specified semi-realistic stylized mood. | Lighting is a deliberate two-temperature setup: warm interior practicals plus cool blue window fill. |
| 2026-11-05 | Wide three-quarter hero camera, final 20 mm at 1.62 m. | Best framing for the full room and computer focal point while including the plant, rug, window, and desk. | Single hero camera, 16:9 at 1920x1080; final render `renders/final/R06-20261105T060316Z.png`. |
| 2026-11-05 | Material variation uses supported channels only. | The harness material operation exposes base color, roughness, metallic, and emission; procedural texture nodes, bump, and weave are not exposed. | Surface interest comes from distinct wood, fabric, metal, ceramic, paper, and plant palettes plus geometric detail such as the rug border, folded throw, art layers, book stack, and chair cushion. Texture grain and weave are intentionally omitted rather than faked. |
| 2026-11-05 | Desk-lamp point light moved below the shade; a soft screen-spill point light added. | The original lamp light was enclosed by the closed shade cylinder and could not light the desk. | Warm pool on the desk plus a soft screen spill; the cool dusk window remains the contrasting key light. |
| 2026-11-05 | Final full-spec review round R06 and delivered state. | All accepted furnishing, framing, and material passes complete. | Scene saved as `cozycomputerroom.blend`; README, decisions, and asset records reflect the delivered state. |
