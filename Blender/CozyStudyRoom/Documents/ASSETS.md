# External Assets — CozyStudyRoom

Register every third-party asset and derivative used by this project. One row per asset. If an asset
has no source or licence, it is not ready to ship.

| Asset ID | Asset | Type | Source URL | Author / vendor | Licence | Local path | Packaging | Redistributable | SHA-256 | Preview | Used in | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 460dd08d240f | Poly Haven — Wood Table 001 | texture | https://polyhaven.com/a/wood_table_001 | Poly Haven contributors | CC0-1.0 | assets/external/local/Poly-Haven/wood_table_001_diff_1k.jpg | external; pack before delivery | yes | 460dd08d240f4a1f02982415048c3c5c200f385db212da18dc7e2df68bf4d0be | — | Desk_Top, Desk_Drawer, Desk_Leg_*, Shelf, Shelf_Bracket_*, Chair_Leg_* | 1k diffuse wood grain |
| aeb7a1487b77 | Poly Haven — Fabric Pattern 07 | texture | https://polyhaven.com/a/fabric_pattern_07 | Poly Haven contributors | CC0-1.0 | assets/external/local/Poly-Haven/fabric_pattern_07_col_1_1k.jpg | external; pack before delivery | yes | aeb7a1487b77aec55e39de662def4d371f5c7c617f62d1f291d7f9932ffebdc9 | — | Chair_Seat, Chair_Back, Curtain_L, Curtain_R, Rug | 1k woven fabric |
| 1f2c623e87b0 | Poly Haven — Wood Floor Deck | texture | https://polyhaven.com/a/wood_floor_deck | Poly Haven contributors | CC0-1.0 | assets/external/local/Poly-Haven/wood_floor_deck_diff_1k.jpg | external; pack before delivery | yes | 1f2c623e87b0ee905f6f4ec8664dd19b4b135207c96e86198ff2919770b47166 | — | Floor | 1k wood plank floor |
| 440310f05af0 | Poly Haven — Painted Plaster Wall | texture | https://polyhaven.com/a/painted_plaster_wall | Poly Haven contributors | CC0-1.0 | assets/external/local/Poly-Haven/painted_plaster_wall_diff_1k.jpg | external; pack before delivery | yes | 440310f05af089f2c93353167573403cbc3f805948203237b5d26431eeb9e19c | — | Wall_Back, Wall_Left, Wall_Right, Wall_Front, Ceiling | 1k painted plaster |

## Rules

- Use `blender_workflow {action:"intake"}` for user files. It copies accepted assets, writes the
  `SOURCE.md`, `LICENSE.txt`, and this row, and records the SHA-256 in `INTAKE.md`.
- Store each external asset and third-party derivative at `assets/external/<source>/<asset>/`.
  Modification does not remove source, licence, attribution, or redistribution duties.
- Add a `SOURCE.md` beside the asset using `assets/external/SOURCE_TEMPLATE.md` when adding manually;
  `intake` creates the harness version automatically.
- Keep a verbatim copy of applicable licence terms named `LICENSE.txt` beside the asset; preserve
  original licence files too. Record the licence source URL and attribution exactly. Stop if terms
  are unavailable or incompatible with intended use. Verify `SOURCE.md` and `LICENSE.txt` are tracked
  before committing the project.
- If redistribution is not allowed, do not commit the binary. Keep acquisition instructions and
  hashes in `SOURCE.md` instead.
- Link assets into Blender with relative paths (`//assets/...`) and record whether the `.blend`
  uses linked, packed, or embedded data. A packed or embedded asset is part of the `.blend`
  deliverable and still needs redistribution permission.
- Re-check missing files before delivery.
- Inspect packed and embedded third-party datablocks in every tracked or delivered `.blend`; source,
  licence, attribution, and packaging must be recorded even when source binaries are git-ignored.

## Current sources

- Four CC0 Poly Haven 1k textures are registered above and used by the scene: wood table, fabric pattern, wood floor deck, and painted plaster wall.
- The `.blend` must pack these images before delivery; source JPGs are git-ignored, while `SOURCE.md`, `LICENSE.txt`, `INTAKE.md`, and this register are tracked.
- If the scene is extended later, add each new CC0 asset with source, licence, SHA-256, packaging, and redistribution before commit.
