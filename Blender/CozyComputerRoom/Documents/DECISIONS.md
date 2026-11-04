# Design Decisions — CozyComputerRoom

Record decisions that affect the visual result, scope, assets, or delivery. Keep the reason and impact, not a diary.

| Date | Decision | Reason | Impact |
|---|---|---|---|
| 2026-11-05 | Project scaffold created. | New design project. | Persist exact requirements, workflow, and review records; fill README and start the filled goal before launch. |
| 2026-11-05 | Use a semi-realistic stylized direction rather than low-poly or photoreal. | User choice; balances warmth, readability, and feasible procedural detail. | Geometry uses clean simplified forms with believable proportions and procedural materials. |
| 2026-11-05 | Furnish a compact full room rather than a desk-only vignette. | User selected a small full room. | Scene includes an enclosed room shell with desk, bed, window, bookshelf, rug, plant, and props. |
| 2026-11-05 | Use a desktop computer with monitor, tower, keyboard, and mouse. | User selected a desktop with monitor. | Workstation geometry includes all four elements and the monitor carries a warm screen glow. |
| 2026-11-05 | Light the room with warm evening lamps against a cool dusk window. | User chose warm evening lamps; the cool contrast adds depth and a calm mood. | Lighting rig uses warm practicals plus a cool window source with soft shadows. |
| 2026-11-05 | Use procedural assets only, with no external media and no scripts. | User constraints. | No intake, downloads, generated media, or project Python; all shading is node-based. |
| 2026-11-05 | Deliver one 1920x1080 hero PNG plus the saved `.blend`. | User selected hero render plus scene file. | One final render and saved scene; extra angles are deferred. |
| 2026-11-05 | Frame the desk and computer as the focal point from an eye-level three-quarter camera. | Keeps the computer clearly readable while showing enough room context. | One hero camera near 1.5 m at 16:9. |
| 2026-11-05 | Final lighting uses four AREA lights: an 18 W desk lamp, 65 W pendant, 25 W floor lamp, and 55 W cool window area; the window pane is a deep dusk blue with low emission. | Warm practicals against a cool window keep highlights controlled and the mood calm; area lights provide the required soft shadows without unsupported point-light radius controls. | Final render is warm and low-contrast with a deep blue window accent and soft shadow edges. |
| 2026-11-05 | Model a fixture for every practical light: desk lamp, floor lamp with bulb, and pendant cord and shade; add a curtain rod. | Avoid invisible light sources and explain the curtain placement. | Scene facts include fixture geometry for all practicals. |
| 2026-11-05 | Seat the door frame flush with WallRight, move the curtains 5-6 cm into the room, and lower the chair back onto its seat. | Clear contact and interpenetration findings without changing the design. | Door, curtains, headboard, wall art, and chair contacts are clean in the final scene. |
| 2026-11-05 | Lower the hero camera to 1.47 m and keep a 24 mm lens, 16:9. | Show the rug, plant, and bed context while keeping the monitor readable. | Final sealed render frames the workstation with room context. |
| 2026-11-05 | Keep delivery procedural with no external assets, downloads, or scripts; final PNG lives in `renders/final/`. | Confirmed scope. | The `.blend` is self-contained and the asset register stays empty. |
| 2026-11-05 | Soft-shadow revision replaced the three point practicals with AREA lights, lightened the chair and tower, and assigned the pendant cord a dark material; render samples raised to 256. | Close visual F-01 hard shadows, visual F-05 near-black chair/tower, and technical F-01 unassigned pendant cord. | Final scene has soft shadow edges and carried no open major in the final review round. |