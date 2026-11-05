# External Assets — CozyComputerRoom

Register every third-party asset and derivative used by this project. One row per asset. If an asset has no source or licence, it is not ready to ship.

| Asset ID | Asset | Type | Source URL | Author / vendor | Licence | Local path | Packaging | Redistributable | SHA-256 | Preview | Used in | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| — | None | — | — | — | — | — | — | — | — | — | — | All geometry, materials, and lighting are authored procedurally in Blender. |

## Rules

- No external assets are used. Requirements forbid downloads, imports, generated media, and third-party models or textures.
- If the scope later changes, use `blender_workflow {action:"intake"}` for user files and record source, licence, attribution, and redistribution before use.
- Store any future external asset at `assets/external/<source>/<asset>/` with `SOURCE.md` and a verbatim `LICENSE.txt`.
- Use relative paths from the `.blend` and record linked, packed, or embedded state.
- Re-check missing files and packed or embedded third-party data before delivery.
