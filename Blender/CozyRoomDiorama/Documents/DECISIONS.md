# Design Decisions — CozyRoomDiorama

Record decisions that affect the visual result, scope, assets, or delivery. Keep the reason and impact, not a diary.

| Date | Decision | Reason | Impact |
|---|---|---|---|
| 2026-11-03 | Project scaffold created. | New design project. | Persist exact requirements, workflow, and review records; fill README and start the filled goal before launch. |
| 2026-11-03 | Low-poly diorama with open corner and no external assets. | User selected the low-poly diorama style and built-in-primitives constraint. | All geometry comes from primitives; materials are procedural; the diorama uses a floor and two walls. |
| 2026-11-03 | Rainy evening with cool window light and warm practical lamps. | User selected the rainy-evening, warm-lamp mood. | Two-temperature lighting scheme; rain visible on the window; monitor glow as a small warm accent. |
| 2026-11-03 | Room layout: desk and window on the back wall, bookshelf and floor lamp on the left wall, open foreground corner. | Supports a three-quarter hero view with the desk as the focal point and a balanced left wall. | Camera is placed outside the open corner; props layer from foreground rug to background desk. |
| 2026-11-03 | One authoritative 16:9 hero camera at 1920x1080 EEVEE. | Confirmed deliverable is one readable hero image. | Alternate angles and exports stay out of scope. |
| 2026-11-03 | Main scene saved at project root as `cozyroomdiorama.blend`. | Scaffold convention and harness scene path. | README, goal, and render evidence reference the same file. |
| 2026-11-03 | Curtain panels rebuilt as layered slats below the rod and framing re-centered. | R01 graders found the slabs rose above the rod and the hero framing was bottom-tight. | Six panels hang between z 0.24 and 2.24 m; rod sits behind at z 2.28. |
| 2026-11-03 | Desk group placed against the back wall with the monitor as the brightest surface. | R02 required the computer desk to become the clear focal point. | Desk, monitor, keyboard, mouse, PC tower, chair, desk lamp, rug, wall art, and plant added. |
| 2026-11-03 | Floor lamp added on the left wall; window darkened with rain streaks and a city silhouette. | R03 required the missing floor lamp and rainy-window evidence for REQ-03. | Warm floor lamp balances the cool window; rain, city block, and mullion read at hero distance. |
| 2026-11-03 | Teal rug, wall art, and chair accents with muted wood and floor. | R03 required a stronger teal accent and less saturated orange. | Cohesive warm/cool palette with visible teal accents. |
| 2026-11-03 | Filled bookshelf on the left wall, second plant on top, and mug/papers on the desk. | Complete REQ-04 contents and add lived-in detail. | Books, plant, and clutter make the room read as occupied; bookshelf balances the composition. |
| 2026-11-03 | Final full-spec change marked `final` with all REQ-01..REQ-10 in scope. | The delivered scene now contains every confirmed content category. | R05 is the delivery evidence and final review round. |
| 2026-11-03 | README and decisions updated with delivered paths and final review reference. | Keep delivery documentation current before the final seal. | README status is Delivered; final verdict is recorded under `Documents/Reviews/`. |
