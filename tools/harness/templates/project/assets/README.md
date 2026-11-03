# Assets — {{PROJECT_NAME}}

| Folder | Use |
|---|---|
| `external/` | Third-party models, textures, HDRIs, audio, and libraries. Register in `Documents/ASSETS.md`. |
| `textures/` | Project-owned textures only. |
| `hdri/` | Project-owned environment maps only. |
| `models/` | Project-owned meshes and linked libraries only. |
| `audio/` | Project-owned sound effects, music, and voice assets only. |

Use relative paths from the `.blend` file (`//assets/...`). Do not embed absolute paths.
Store licensed third-party assets and their derivatives under `external/<source>/<asset>/`; modifying
an asset does not remove its source, licence, attribution, registration, or redistribution duties.
Keep `SOURCE.md` and verbatim `LICENSE.txt` beside each external asset and register every derivative.

Supported reviewed operations: `import_asset` for local GLB/glTF/FBX/OBJ/USD/`.blend`, `link_library`
for `.blend` link/append, `import_audio`, `image_texture`, `world_hdri`, `check_assets`,
`pack_assets`, and `export_scene`. Remote asset-library downloads and 3D generation remain blocked.
