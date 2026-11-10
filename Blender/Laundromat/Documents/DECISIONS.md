# Design Decisions — Laundromat

Record decisions that affect the visual result, scope, assets, or delivery. Keep the reason and
impact, not a diary.

| Date | Decision | Reason | Impact |
|---|---|---|---|
| 2026-11-10 | Project scaffold created. | New design project. | Persist exact requirements, workflow, and review records; fill README and goal before launch. |
| 2026-11-10 | Model everything with primitives and simple materials. | User chose no external assets, no generated media, and no scripts. | Realism comes from layout, geometry detail, material colour and roughness, and lighting. |
| 2026-11-10 | Interior-only room about 8 x 12 m with a 2.9 m ceiling. | User chose interior only; scale must be plausible for a coin laundromat. | Camera and aisle composition sized to the room; no exterior. |
| 2026-11-10 | Warm fluorescent ceiling panels plus cool daylight from the entrance. | Realistic laundromats mix interior fluorescents with storefront daylight. | Two light families; storefront glow behind the camera adds depth. |
| 2026-11-10 | Single visual grader reviews every change. | User selected `Single` with the Visual grader. | Each reviewable change needs a visual grader report before commit. |
| 2026-11-10 | Fully Autonomous workflow. | User selected Fully Autonomous. | No approval pauses; commit each reviewed change after checkpoint. |
