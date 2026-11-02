# Design Decisions — CozyRoomLive

Record decisions that affect the visual result, scope, assets, or delivery. Keep the reason and impact, not a diary.

| Date | Decision | Reason | Impact |
|---|---|---|---|
| 2026-11-02 | Project scaffolded as CozyRoomLive instead of reusing the stale CozyRoom registration. | The prior branch left an abandoned CozyRoom registration; a new project keeps registration and evidence clean. | New project root, `cozyroomlive.blend`, fresh review rounds. |
| 2026-11-02 | Reuse the confirmed CozyRoom brief without scope changes. | User confirmed the prior brief for a full live-test project. | Requirements, workflow, and review records copied and adapted to the new name only. |
| 2026-11-02 | Build with harness-supported primitives and operations only; no external assets. | Harness operations and primitives are the only reviewed production path. | Stylized, geometry-based room; no import or external texture dependency. |
