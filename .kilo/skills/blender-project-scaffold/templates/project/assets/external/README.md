# External Assets — {{PROJECT_NAME}}

This folder holds third-party assets. The default `.gitignore` excludes asset binaries so a project
does not accidentally commit large or non-redistributable files. Metadata stays tracked.

## Layout

```text
assets/external/
  <source-or-vendor>/
    <asset-name>/
      SOURCE.md
      LICENSE*        # or a copy of the licence terms
      <asset files>
```

## Rules

- Add a `SOURCE.md` for every asset using `SOURCE_TEMPLATE.md`.
- Record the asset in `../../Documents/ASSETS.md`.
- Do not commit an asset unless its licence allows redistribution. If it does, remove the ignore
  rule for that path or use `git add -f` deliberately, and keep the licence beside it.
- For large redistributable assets, use Git LFS rather than committing raw binaries.
- Link or import with relative paths. Check for missing files before delivery.
- Packing or embedding external data into a tracked or delivered `.blend` redistributes those bytes.
  Verify the licence, attribution, and redistribution terms first, and record the packaging mode in
  `Documents/ASSETS.md` and `SOURCE.md`.
- Pack external data only for delivery copies when permitted; keep an unpacked working copy when the
  assets need editing.
