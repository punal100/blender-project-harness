# External Assets — CozyRoomLive

This folder holds third-party assets. The default `.gitignore` excludes asset binaries so a project
does not accidentally commit large or non-redistributable files. Metadata stays tracked.

## Layout

```text
assets/external/
  <source-or-vendor>/
    <asset-name>/
      SOURCE.md
      LICENSE.txt     # mandatory verbatim licence terms; preserve originals too
      <asset files>
```

## Rules

- Add a `SOURCE.md` for every asset using `SOURCE_TEMPLATE.md`.
- Copy applicable licence terms verbatim into `LICENSE.txt`; preserve original licence files too.
  Record the licence source URL and required attribution exactly. Stop if terms are unavailable or
  do not permit the intended use; do not invent or summarize them. Verify `SOURCE.md` and
  `LICENSE.txt` are tracked before committing the project.
- Keep third-party originals and derivatives in this folder, including licensed assets. Register
  derivatives and identify source and modifications; project modification does not remove licence duties.
- Record the asset in `../../Documents/ASSETS.md`.
- Do not commit an asset unless its licence allows redistribution. If it does, remove the ignore
  rule for that exact path so the harness commit can stage it, and keep the licence beside it.
  Force-add is unsupported; request reviewed tooling instead of using manual Git.
- For large redistributable assets, use Git LFS rather than committing raw binaries.
- Link or import with relative paths. Check for missing files before delivery.
- Packing or embedding external data into a tracked or delivered `.blend` redistributes those bytes.
  Verify the licence, attribution, and redistribution terms first, and record the packaging mode in
  `../../Documents/ASSETS.md` and `SOURCE.md`.
- Pack external data only for delivery copies when permitted; keep an unpacked working copy when the
  assets need editing.
