# External Assets — CozyLaundromat

Register every third-party asset and derivative used by this project. One row per asset. If an asset has no source or licence, it is not ready to ship.

| Asset ID | Asset | Type | Source URL | Author / vendor | Licence | Local path | Packaging | Redistributable | SHA-256 | Preview | Used in | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| — | None yet | — | — | — | — | — | — | — | — | — | — | — |

## Rules

- No downloaded or user-supplied third-party assets are planned. The visual reference is generated after registration and is not a scene asset.
- Generated images are brought in with `intake` using generated metadata and are never treated as licensed third-party assets.
- Use `blender_workflow {action:"intake"}` for every asset file. It copies accepted assets, writes the `SOURCE.md`, `LICENSE.txt`, and this row, and records the SHA-256 in `INTAKE.md`.
- Store each external asset and third-party derivative at `assets/external/<source>/<asset>/`. Modification does not remove source, licence, attribution, or redistribution duties.
- Link assets into Blender with relative paths (`//assets/...`) and record whether the `.blend` uses linked, packed, or embedded data. A packed or embedded asset is part of the `.blend` deliverable and still needs redistribution permission.
- Re-check missing files before delivery and inspect packed or embedded datablocks in every tracked or delivered `.blend`.
