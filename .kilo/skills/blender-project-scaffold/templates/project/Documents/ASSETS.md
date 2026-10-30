# External Assets — {{PROJECT_NAME}}

Register every third-party asset used by this project. One row per asset. If an asset has no
source or licence, it is not ready to ship.

| Asset | Source URL | Author / vendor | Licence | Local path | Redistributable | Notes |
|---|---|---|---|---|---|---|
| None yet | — | — | — | — | — | — |

## Rules

- Store each external asset at `assets/external/<source>/<asset>/`.
- Add a `SOURCE.md` beside the asset using `assets/external/SOURCE_TEMPLATE.md`.
- Keep the licence file with the asset. Record attribution requirements exactly.
- If redistribution is not allowed, do not commit the binary. Keep acquisition instructions and
  hashes in `SOURCE.md` instead.
- Link assets into Blender with relative paths (`//assets/...`) and record whether the `.blend`
  uses linked or packed data.
- Re-check missing files before delivery.
