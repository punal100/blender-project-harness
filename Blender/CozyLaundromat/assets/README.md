# Assets — CozyLaundromat

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

Bring user files in with `blender_workflow {action:"intake"}`. Scan first, then copy inside an open
change; it hashes, classifies, deduplicates, writes source/licence sidecars, and updates the registers.
Use `download` only to fetch a public HTTPS asset into ignored staging. Do not ask the user to
create folders or copy files by hand. Browser/provider and user-assisted files return through
`intake` with their actual local path; never bypass authentication, CAPTCHA, or provider
restrictions.

External binaries under `assets/external/` are not committed unless `SOURCE.md` says
`Redistribution allowed: yes`. Sidecars, hashes, and metadata are committed. Media generation is
agent-owned and requires explicit permission before spending credits; pass the actual generated
file to `intake` with generated metadata.

Supported reviewed operations: `import_asset` for local GLB/glTF/FBX/OBJ/USD/`.blend`, `link_library`
for `.blend` link/append, `import_audio`, `image_texture`, `world_hdri`, `check_assets`,
`pack_assets`, and `export_scene`. Remote asset-library import and 3D generation remain blocked;
`download` and `intake` are the supported local staging path.
