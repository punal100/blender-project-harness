# Design Decisions — CozyLaundromat

Record decisions that affect the visual result, scope, assets, or delivery. Keep the reason and impact, not a diary.

| Date | Decision | Reason | Impact |
|---|---|---|---|
| 2026-11-05 | Project scaffold created. | New design project. | Persist exact requirements, workflow, and review records; fill README and start `/goal-blender` before launch. |
| 2026-11-05 | Deliver one wide eye-level hero shot rather than multiple angles. | User selected the interior wide shot. | One camera and one sealed hero render define acceptance. |
| 2026-11-05 | Generate the reference image after registration instead of supplying or downloading one. | User chose generated references. | Reference generation is deferred and must not delay registration. |
| 2026-11-05 | Build glass, openings, and surface detail with geometry and flat materials. | Harness materials support only base colour, roughness, metallic, and emission; no transmission, bump, or boolean openings. | Window and machine doors use tinted low-roughness panels; wall openings use separate panels; detail comes from prop geometry. |
