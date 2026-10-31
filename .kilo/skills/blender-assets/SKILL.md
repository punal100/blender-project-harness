---
name: blender-assets
description: Use when adding, importing, linking, packing, or delivering external Blender assets. Enforces asset registration, licences, relative paths, missing-file checks, and git policy.
---

# Blender Assets

Project paths below are relative to `Blender/<Project>/`; the template reference is relative to this
skill's directory.

## Folder policy

- Store project-owned files in `assets/textures/`, `assets/hdri/`, `assets/models/`, `assets/audio/`.
- Store third-party files, including licensed files and derivatives, in
  `assets/external/<source-or-vendor>/<asset>/`. Modification does not remove source or licence duties.
- Record each third-party original and derivative in `Documents/ASSETS.md`; keep `SOURCE.md` and a
  verbatim `LICENSE.txt` beside every external asset. Preserve original licence files too.

## Workflow

1. Find the asset with Blender MCP `search_assets` or manual source discovery. Do not import before
   the source, licence, and intended-use checks below are complete.
2. Record source, author, licence, attribution, redistribution, local path, and packaging mode in
   `Documents/ASSETS.md`.
3. Add `SOURCE.md` from
   `../blender-project-scaffold/templates/project/assets/external/SOURCE_TEMPLATE.md`.
4. Copy the applicable licence terms verbatim to `LICENSE.txt` beside the asset, preserving any
   original licence files. Record the licence source URL and attribution exactly. If terms cannot be
   obtained or do not permit intended use, stop; do not invent, summarize, or substitute licence terms.
5. Link or import with relative paths from the `.blend` (`//assets/...`). Never leave
   machine-specific absolute paths.
6. Check missing files before delivery.
7. Decide whether the `.blend` links, packs, or embeds the asset, and record that decision. Treat
   packed or embedded bytes as part of the deliverable even when the source binary is ignored by git.

## Git policy

- External asset binaries are ignored by default.
- Commit only assets whose licence permits redistribution. Remove the ignore rule for that path or
  use `git add -f` deliberately.
- Use Git LFS for large redistributable binaries.
- Never commit non-redistributable assets, credentials, or paid asset packs.
- A tracked `.blend` containing packed or embedded third-party data is a redistribution of that data.
  Verify its licence, attribution, and delivery rights before committing or delivering the file.

## Validation

- Run `bpy.ops.file.report_missing_files()` and inspect missing-file reports; an operator return
  status alone does not prove files exist. Resolve every missing dependency before delivery.
- Apply `bpy.ops.file.make_paths_relative()` and verify external paths resolve within shipped folders.
- Verify moving or copying the project folder does not break the scene.
- Require an `ASSETS.md` row for every third-party asset and derivative.
- Require `SOURCE.md` and verbatim `LICENSE.txt` in every external asset folder, and verify both
  metadata files are tracked when committing the project.
- Require a registered source, licence, and packaging decision for every linked, packed, or embedded
  third-party datablock in a deliverable `.blend`.

For delivery copies, pack external data into the `.blend` only when its licence permits redistribution,
or ship the documented asset folders together. Keep an unpacked working copy when the assets still need
editing. Re-run missing-file checks and inspect packed/embedded third-party data before delivery.
