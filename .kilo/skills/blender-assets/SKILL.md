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
5. Link or import with relative paths from the `.blend` (`//assets/...`). NEVER leave absolute paths.
6. Check missing files before delivery.
7. Record whether the `.blend` links, packs, or embeds the asset. Packed or embedded bytes remain
   third-party data even when source binaries are ignored.

Imports and generation remain blocked until reviewed harness operations exist. Asset search does not
authorize an unsupported import.

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

- Run `bpy.ops.file.report_missing_files()` and inspect missing-file reports; an operator return
  status alone is not proof.
- Apply `bpy.ops.file.make_paths_relative()` and verify external paths resolve inside shipped folders.
- Verify moving the project folder does not break the scene.
- Require an `ASSETS.md` row for every third-party asset and derivative.
- Require `SOURCE.md` and verbatim `LICENSE.txt` in every external asset folder.
- Require a registered source, licence, and packaging decision for every linked, packed, or embedded
  third-party datablock.

For delivery, pack external data only when its licence permits redistribution, or ship the documented
asset folders. Re-run missing-file checks and inspect packed/embedded data before delivery.
