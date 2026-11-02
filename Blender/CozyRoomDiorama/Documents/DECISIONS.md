# Design Decisions — CozyRoomDiorama

Record decisions that affect the visual result, scope, assets, or delivery. Keep the reason and impact, not a diary.

| Date | Decision | Reason | Impact |
|---|---|---|---|
| 2026-11-03 | Project scaffold created. | New design project. | Persist exact requirements, workflow, and review records; fill README and start the filled goal before launch. |
| 2026-11-03 | Low-poly diorama with open corner and no external assets. | User selected the low-poly diorama style and built-in-primitives constraint. | All geometry comes from primitives; materials are procedural; the diorama uses a floor and two walls. |
| 2026-11-03 | Rainy evening with cool window light and warm practical lamps. | User selected the rainy-evening, warm-lamp mood. | Two-temperature lighting scheme; rain visible on the window; monitor glow as a small warm accent. |
| 2026-11-03 | Room layout: desk and window on the back wall, bookshelf on the left wall, open foreground corner. | Supports a three-quarter hero view with the desk as the focal point. | Camera is placed outside the open corner; props layer from foreground rug to background desk. |
| 2026-11-03 | One authoritative 16:9 hero camera at 1920x1080 EEVEE. | Confirmed deliverable is one readable hero image. | Alternate angles and exports stay out of scope. |
| 2026-11-03 | Main scene saved at project root as `cozyroomdiorama.blend`. | Scaffold convention and harness scene path. | README, goal, and render evidence reference the same file. |
