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

## Harness intake

The user does not need to create folders or copy files. Use `blender_workflow {action:"intake"}`.

- `scan:true` inspects explicit files or folders without writing the project. Use it during
  requirements discovery.
- `scan:false` copies accepted files into an open bounded change and adds their exact paths to the
  change. It writes `SOURCE.md`, `LICENSE.txt`, `Documents/INTAKE.md`, `Documents/ASSETS.md`, and
  `Documents/References/README.md` as applicable, including MIME type, bytes, dimensions, and
  SHA-256. File signatures are checked against the extension.
- Rejections, hashes, and duplicates are reported. The original files are never moved or deleted.
- `download` fetches an HTTPS asset into ignored `.temp/Intake/<project>/...` staging. It does not
  import or register it. Pass the returned path to `intake` with source and licence details.
- Project-owned models, textures, HDRIs, and audio use `source.external:false`; third-party files
  require `source.license` and verbatim `source.licenseText` or `source.licenseFile`.
- Do not use shell copy, direct project writes, or manual Git for user files.

## Workflow

1. Ask how the user wants assets sourced: use supplied files, search/download, project-owned
   primitives/materials, or a mix. Ask for exact paths when files are supplied.
2. If download is chosen, search first, inspect licence and size, then use `download` to stage. If the
   provider is not supported, ask the user to supply the file rather than inventing a URL.
3. Scan with `intake`; resolve rejected files, missing licences, and ambiguous use.
4. Open the bounded change with the intake document path, then call `intake` with `scan:false`. The
   action copies files and registers metadata.
5. Import a local model with the reviewed `import_asset` operation, link a `.blend` library with
   `link_library`, import audio with `import_audio`, and use `image_texture` or `world_hdri` for local
   images. Paths stay project-relative (`assets/...`). NEVER leave absolute paths. Declare the
   import's parent Empty name in `begin.objects`; inspect the imported children after the apply and
   use `extend` if later operations need to target them.
6. Check missing and packed files with `check_assets`; use `{strict:true}` on the final scene so a
   missing external file fails the apply. Pack only when the licence permits redistribution with
   `pack_assets`.
7. Record whether the `.blend` links, packs, or embeds the asset. Packed or embedded bytes remain
   third-party data even when source binaries are ignored.

The raw `blender_import_asset`, `blender_generate_3d`, and arbitrary project Python remain blocked.
Asset search does not authorize a remote import. Generated images are registered with `intake`
using `generated` metadata; they are not automatically scene assets.

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

- Run `check_assets` with `{strict:true}` on the final scene before sealing. It fails on missing
  external files. Completion is denied after asset use until the strict receipt is sealed on the
  final unchanged scene.
- Keep paths project-relative; verify moving the project folder does not break the scene.
- Run `pack_assets` only after licence review when packing is required.
- Require an `ASSETS.md` row for every third-party asset and derivative.
- Require `SOURCE.md` and verbatim `LICENSE.txt` in every external asset folder.
- Require a registered source, licence, and packaging decision for every linked, packed, or embedded
  third-party datablock.

For delivery, pack external data only when its licence permits redistribution, or ship the documented
asset folders. Re-run missing-file checks and inspect packed/embedded data before delivery.
