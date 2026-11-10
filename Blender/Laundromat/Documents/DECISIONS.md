# Design Decisions — Laundromat

| Date | Decision | Reason | Impact |
|---|---|---|---|
| 2026-11-10 | Interior-only composition with front glazing showing a dark evening street. | User selected "Interior room only". | No exterior facade or street modeling in scope; windows provide depth and cool contrast. |
| 2026-11-10 | Lived-in evening realism: warm fluorescent interior, cool dusk spill, visible wear and clutter. | User selected "Lived-in evening realism". | Materials and props emphasize believable age and use rather than a showroom finish. |
| 2026-11-10 | All geometry and materials built in-scene; no external assets or textures. | User selected "Model everything in-scene". | Self-contained scene; realism comes from form, material values, lighting, and detail geometry. |
| 2026-11-10 | Single scene, hero camera at eye level, 1920x1080 16:9. | User selected scene plus render plus GLB and 1920x1080 output. | One camera and one render path keep review evidence focused. |
| 2026-11-10 | Fully Autonomous workflow with Single `visual` grader review. | Runtime answers during discovery. | Every reviewable change seals, is inspected, reviewed by `visual`, committed, and checkpointed without approval pauses. |
| 2026-11-10 | Scripts are source-only under `scripts/`; the harness never executes them. | User permitted source-only scripts. | Any helper source is documentation only; scene work stays in reviewed operations. |
