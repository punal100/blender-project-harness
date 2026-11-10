# Design Decisions — Urban Laundromat

Record decisions that affect the visual result, scope, assets, or delivery. Keep the reason and impact, not a diary.

| Date | Decision | Reason | Impact |
|---|---|---|---|
| 2026-11-11 | Project scaffold created under the name Urban Laundromat. | The requested Laundromat and Realistic Laundromat names already had stale registrations owned by absent sessions; a fresh unused name avoided blocking the new project. | Project path is `Blender/Urban Laundromat`; abandoned scaffolds remain untracked and unused. |
| 2026-11-11 | No external images, HDRIs, textures, models, or scripts. | User chose no external images and no scripts. | Realism relies on modeled geometry, flat-color material variation, and lighting; no texture authoring or licensing work. |
| 2026-11-11 | Fluorescent tube fixtures plus cool dusk storefront light. | Gritty urban laundromats read through mixed warm interior and cool street light. | Lighting is modeled with area lights and emissive tube meshes; no world HDRI. |
| 2026-11-11 | Single visual review with grader `visual`. | User selected Single (visual) review. | Each reviewable change gets one visual grader round before commit; technical and spec graders are not dispatched. |
| 2026-11-11 | Hero still plus three detail stills, .blend, and GLB. | User selected PNG + .blend + GLB deliverables. | Final change must include four renders and a verified GLB export receipt. |
