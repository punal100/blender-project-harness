---
name: blender-assets
description: Use when adding, importing, linking, packing, or delivering external Blender assets. Enforces registration, licences, relative paths, and delivery checks.
---

# Blender Assets

Project paths are relative to `Blender/<Project>/`. External assets and derivatives must be
registered before use. The user does not need to create folders or copy files; `intake` owns that.

## Folder and metadata policy

- Project-owned files: `assets/textures/`, `assets/hdri/`, `assets/models/`, `assets/audio/`.
- Third-party files and derivatives: `assets/external/<source-or-vendor>/<asset>/`. Modification does
  not remove source or licence duties.
- Register every third-party original and derivative in `Documents/ASSETS.md`.
- Keep `SOURCE.md` and a verbatim `LICENSE.txt` beside every external asset. Preserve original licence
  files. The source template is under
  `../../../.kilo/blender-project-harness/tools/harness/templates/project/assets/external/SOURCE_TEMPLATE.md`.
- Project-owned models, textures, HDRIs, and audio use `source.external:false`; third-party files
  require `source.license` and verbatim `source.licenseText` or `source.licenseFile`.

## Intake and media

- `intake {scan:true}` inspects explicit files or folders without writing the project. Use it during
  requirements discovery. A reference answer of `Use my references` is not complete until the exact
  supplied paths are scanned; `prepare` rejects without that scan.
- `intake {scan:false}` copies accepted files into an open bounded change, adds exact paths, and
  writes sidecars, `Documents/INTAKE.md`, `Documents/ASSETS.md`, and reference registers as
  applicable. It reports hashes, duplicates, and rejections; originals are never moved. After
  bootstrap, a scanned supplied reference becomes a pending gate that blocks scene work until every
  scanned file is copied.
- `download` fetches a public HTTPS asset into ignored `.temp/Intake/<project>/...` staging. It does
  not import or register; pass the path to `intake` with source and licence. No credentials, private
  hosts, authentication bypass, CAPTCHA bypass, or unlimited scope.
- Browser/provider and user-assisted files return through `intake` with their actual local path.
  Never ask the user to move a file into the project.
- Media generation is harness-booked. After registration, with the initial scene saved and
  checkpointed, open a bounded change and call `media-request` before any Media MCP generation.
  Generated files stay under `.temp`; call `media-complete`, then `intake {media:<id>}`. Display the
  result and ask before using it as a texture or reference. Retry at most twice with `media-fail`.
- Do not use shell copy, direct project writes, or manual Git for user files.

## Workflow

1. Ask how the user wants assets sourced: supplied files, search/download, project-owned
   primitives/materials, or a mix. Ask for exact paths when supplied.
2. If download is chosen, search first, inspect licence and size, then `download` to stage. If the
   provider is unsupported, ask the user to supply the file rather than inventing a URL.
3. Scan with `intake`; resolve rejected files, missing licences, and ambiguous use.
4. Open the bounded change with the intake document path, then call `intake` with `scan:false`.
5. Import a local model with `import_asset`, link a `.blend` library with `link_library`, import audio
   with `import_audio`, and use `image_texture` or `world_hdri` for local images. Paths stay
   project-relative. Declare the import's parent Empty name in `begin.objects`; inspect imported
   children after the apply and use `extend` if later operations target them.
6. Check missing and packed files with `check_assets`; use `{strict:true}` on the final scene. Pack
   only when the licence permits redistribution with `pack_assets`.
7. Record whether the `.blend` links, packs, or embeds the asset. Packed or embedded bytes remain
   third-party data even when source binaries are ignored.

The raw `blender_import_asset`, `blender_generate_3d`, and arbitrary project Python remain blocked unless
this session is explicitly listed in `unsafe.sessions`; do not enable that for production.
Asset search does not authorize a remote import. Generated images are registered with `intake` using
`generated` metadata; they are not automatically scene assets.

## Git and delivery

- External asset binaries are ignored by default.
- Commit only assets whose `SOURCE.md` says `Redistribution allowed: yes`. The harness rejects a
  tracked or force-staged external binary without that clearance.
- Use Git LFS for large redistributable binaries.
- Never commit non-redistributable assets, credentials, or paid asset packs.
- A tracked `.blend` with packed or embedded third-party data is a redistribution. Verify licence,
  attribution, and delivery rights before commit or delivery.
- Required metadata must be tracked with the project. Re-check missing files and packed/embedded data
  before delivery.

## Validation

- Run `check_assets` with `{strict:true}` on the final scene before sealing. Completion is denied
  after asset use until the strict receipt is sealed on the final unchanged scene.
- Keep paths project-relative; verify moving the project folder does not break the scene.
- Require an `ASSETS.md` row for every third-party asset and derivative with asset ID, type, local
  path, source, licence, SHA-256, packaging, preview path when available, scene use, and
  redistribution status.
- Require `SOURCE.md` and verbatim `LICENSE.txt` in every external asset folder.
- Require a harness export receipt with format, path, bytes, SHA-256, source scene, and signature for
  every produced export. A missing or changed export blocks completion.
