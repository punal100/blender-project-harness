# External Assets — RetroTerminalNook

Register every third-party asset and derivative used by this project. One row per asset. If an asset
has no source or licence, it is not ready to ship.

| Asset | Source URL | Author / vendor | Licence | Local path | Packaging | Redistributable | Notes |
|---|---|---|---|---|---|---|---|
| None | — | — | — | — | — | — | Scene uses procedural primitives and materials only. |

## Rules

- Store each external asset and third-party derivative at `assets/external/<source>/<asset>/`.
  Modification does not remove source, licence, attribution, or redistribution duties.
- Add a `SOURCE.md` beside the asset using `assets/external/SOURCE_TEMPLATE.md`.
- Keep a verbatim copy of applicable licence terms named `LICENSE.txt` beside the asset.
- If redistribution is not allowed, do not commit the binary.
- Link assets into Blender with relative paths (`//assets/...`) and record packaging.
- Re-check missing files before delivery.
