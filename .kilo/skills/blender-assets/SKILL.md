---
name: blender-assets
description: Use when adding, importing, linking, packing, or delivering external Blender assets. Enforces asset registration, licences, relative paths, missing-file checks, and git policy.
---

# Blender Assets

All paths below are relative to `Blender/<Project>/`.

## Folder policy

- Project-owned files: `assets/textures/`, `assets/hdri/`, `assets/models/`, `assets/audio/`.
- Third-party files: `assets/external/<source-or-vendor>/<asset>/`.
- Documentation: `Documents/ASSETS.md` and a `SOURCE.md` beside each external asset.

## Workflow

1. Search with the Blender MCP `search_assets` tool or import manually.
2. Record source, author, licence, attribution, redistribution, and local path in
   `Documents/ASSETS.md`.
3. Add `SOURCE.md` from
   `blender-project-scaffold/templates/project/assets/external/SOURCE_TEMPLATE.md`.
4. Keep the licence file with the asset.
5. Link or import with relative paths from the `.blend` (`//assets/...`). Never leave
   machine-specific absolute paths.
6. Check missing files before delivery.
7. Decide whether the `.blend` links or packs the asset, and record that decision.

## Git policy

- External asset binaries are ignored by default.
- Commit only assets whose licence permits redistribution. Remove the ignore rule for that path or
  use `git add -f` deliberately.
- Use Git LFS for large redistributable binaries.
- Never commit non-redistributable assets, credentials, or paid asset packs.

## Validation

- `bpy.ops.file.report_missing_files()` reports nothing.
- `bpy.ops.file.make_paths_relative()` has been applied.
- Moving or copying the project folder does not break the scene.
- `Documents/ASSETS.md` has a row for every third-party asset.
- Every external asset folder contains `SOURCE.md` and the licence terms.

For delivery copies, pack external data into the `.blend` or ship the documented asset folders
together. Keep an unpacked working copy when the assets still need editing.
