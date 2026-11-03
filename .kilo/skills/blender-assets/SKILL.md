---
name: blender-assets
description: Use when adding, importing, linking, packing, or delivering external Blender assets. Enforces registration, licences, relative paths, and delivery checks.
---

# Blender Assets

Project paths are relative to `Blender/<Project>/`. External assets and derivatives MUST be
registered before use.

## Folder policy

- Project-owned files: `assets/textures/`, `assets/hdri/`, `assets/models/`, `assets/audio/`.
- Third-party files and derivatives:
  `assets/external/<source-or-vendor>/<asset>/`. Modification does not remove source or licence
  duties.
- Register every third-party original and derivative in `Documents/ASSETS.md`.
- Keep `SOURCE.md` and a verbatim `LICENSE.txt` beside every external asset. Preserve original
  licence files.

## Workflow

1. Find an asset with `blender_search_assets` or manual source discovery. Do not import before
   source, licence, and intended-use checks pass.
2. Record source, author, licence, attribution, redistribution, local path, and packaging mode in
   `Documents/ASSETS.md` through the harness document action.
3. Create `SOURCE.md` from `../../../tools/harness/templates/project/assets/external/SOURCE_TEMPLATE.md`.
4. Copy the applicable licence terms verbatim to `LICENSE.txt`. Record the licence source URL and
   attribution exactly. If terms are missing or incompatible, STOP; never invent or summarize them.
5. Import a local model with the reviewed `import_asset` operation, link a `.blend` library with
   `link_library`, import audio with `import_audio`, and use `image_texture` or `world_hdri` for local
   images. Paths stay project-relative (`assets/...`). NEVER leave absolute paths. Declare the
   import's parent Empty name in `begin.objects`; inspect the imported children after the apply and
   use `extend` if later operations need to target them.
6. The remote `blender_import_asset` tool and `blender_generate_3d` remain blocked. Search finds
   library assets, but the supported path is to download the file manually into
   `assets/external/<source>/<asset>/`, add `SOURCE.md` and `LICENSE.txt`, then run `import_asset`.
7. Check missing and packed files with `check_assets`; pack only when the licence permits
   redistribution with `pack_assets`.
8. Record whether the `.blend` links, packs, or embeds the asset. Packed or embedded bytes remain
   third-party data even when source binaries are ignored.

Asset-library auto-download and 3D generation are not implemented. Asset search does not authorize an
unsupported import.

## Git and delivery

- External asset binaries are ignored by default.
- Commit only assets whose licence permits redistribution. Remove the ignore rule for that exact
  path so the harness commit can stage it. Force-add is unsupported; request reviewed tooling instead
  of using manual Git.
- Use Git LFS for large redistributable binaries.
- NEVER commit non-redistributable assets, credentials, or paid asset packs.
- A tracked `.blend` with packed or embedded third-party data is a redistribution. Verify licence,
  attribution, and delivery rights before commit or delivery.
- Required metadata MUST be tracked with the project.
- Re-check missing files and packed/embedded data before delivery.

## Validation

- Run the `check_assets` operation and inspect its missing/external/packed report before delivery.
- Keep paths project-relative; verify moving the project folder does not break the scene.
- Run `pack_assets` only after licence review when packing is required.
- Require an `ASSETS.md` row for every third-party asset and derivative.
- Require `SOURCE.md` and verbatim `LICENSE.txt` in every external asset folder.
- Require a registered source, licence, and packaging decision for every linked, packed, or embedded
  third-party datablock.

For delivery, pack external data only when its licence permits redistribution, or ship the documented
asset folders. Re-run missing-file checks and inspect packed/embedded data before delivery.
