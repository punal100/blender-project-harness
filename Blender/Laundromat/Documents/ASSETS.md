# External Assets — Laundromat

No external assets are planned. Every prop, surface, and light is authored in the scene through reviewed harness operations; no third-party files or generated media enter the project.

| Asset ID | Asset | Type | Source URL | Author / vendor | Licence | Local path | Packaging | Redistributable | SHA-256 | Preview | Used in | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| — | None | — | — | — | — | — | — | — | — | — | — | No external assets. |

## Rules

- Use `blender_workflow {action:"intake"}` for user files. It copies accepted assets, writes the `SOURCE.md`, `LICENSE.txt`, and this row, and records the SHA-256 in `INTAKE.md`.
- Store each external asset and third-party derivative at `assets/external/<source>/<asset>/`.
- Keep a verbatim copy of applicable licence terms named `LICENSE.txt` beside the asset; preserve original licence files too.
- If redistribution is not allowed, do not commit the binary. Keep acquisition instructions and hashes in `SOURCE.md` instead.
- Link assets into Blender with relative paths (`//assets/...`) and record whether the `.blend` uses linked, packed, or embedded data.
- Re-check missing files before delivery and inspect packed or embedded third-party datablocks.
