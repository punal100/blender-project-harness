# External Assets — CozyComputerRoom

Final check: no third-party assets are used. All geometry and materials are authored procedurally in Blender. The register remains empty; no external files are linked, packed, or embedded, and no downloads or generated media were used.

Register every third-party asset and derivative used by this project. One row per asset. If an asset has no source or licence, it is not ready to ship.

| Asset ID | Asset | Type | Source URL | Author / vendor | Licence | Local path | Packaging | Redistributable | SHA-256 | Preview | Used in | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| — | None — procedural only | — | — | — | — | — | — | — | — | — | — | — |

## Rules

- Use `blender_workflow {action:"intake"}` for user files. It copies accepted assets, writes the `SOURCE.md`, `LICENSE.txt`, and this row, and records the SHA-256 in `INTAKE.md`.
- Store each external asset and third-party derivative at `assets/external/<source>/<asset>/`. Modification does not remove source, licence, attribution, or redistribution duties.
- Add a `SOURCE.md` beside the asset using `assets/external/SOURCE_TEMPLATE.md` when adding manually; `intake` creates the harness version automatically.
- Keep a verbatim copy of applicable licence terms named `LICENSE.txt` beside the asset; preserve original licence files too. Record the licence source URL and attribution exactly. Stop if terms are unavailable or incompatible with intended use. Verify `SOURCE.md` and `LICENSE.txt` are tracked before committing the project.
- If redistribution is not allowed, do not commit the binary. Keep acquisition instructions and hashes in `SOURCE.md` instead.
- Link assets into Blender with relative paths (`//assets/...`) and record whether the `.blend` uses linked, packed, or embedded data. A packed or embedded asset is part of the `.blend` deliverable and still needs redistribution permission.
- Re-check missing files before delivery.
- Inspect packed and embedded third-party datablocks in every tracked or delivered `.blend`; source, licence, attribution, and packaging must be recorded even when source binaries are git-ignored.
- This project uses none of the above; keep the register empty unless the confirmed scope changes through re-registration.
