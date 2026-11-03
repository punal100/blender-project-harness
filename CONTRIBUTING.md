# Contributing

Thanks for helping improve Blender Project Harness.

## Before you start

- Search existing issues, releases, and the README.
- Keep each pull request focused on one behavior, fix, or release concern.
- Never include tokens, secrets, `.kilo/blender-project-harness/config.json`, `.temp`, `node_modules`, or generated artifacts.
- Use the issue forms for bug reports, feature requests, and usage questions.

## Development setup

Requirements: Node.js 22 or newer, npm, and Python 3 for the harness contract tests.

```powershell
npm ci
npm ci --prefix .kilo/blender-project-harness/tools/harness
npm run doctor --prefix .kilo/blender-project-harness/tools/harness
```

## Checks

Run the checks relevant to your change before opening a pull request:

```powershell
npm run test:installer
npm run pack:check
node --test .kilo/blender-project-harness/tools/harness/*.test.mjs
```

The full harness suite includes a long-running plugin suite. Run the targeted tests for the area you changed, and include the exact commands and results in the pull request. For release work, run the full suite where practical.

For Blender scene or workflow changes, include the render path and the `blender_look` inspection result.

## Pull requests

- Link the issue with `Closes #...`.
- Include a one-line release note.
- Explain what changed, why, and how it was verified.
- Update the README or CHANGELOG when behavior or install steps change.
- Document breaking changes explicitly.

## Releases

1. Update `CHANGELOG.md` and the version fields in `package.json`, `package-lock.json`, and the nested harness package files.
2. Run installer tests, the package dry run, and the relevant harness tests.
3. Commit with `chore: release X.Y.Z`.
4. Create an annotated tag `vX.Y.Z` and push `main` plus the tag.
5. Build the tarball with `npm pack --pack-destination .temp`.
6. Create the GitHub release with install instructions, categorized changes, verification results, the SHA-256 checksum, and a full-changelog link.
7. Stage npm with `npx npm@11.15.0 stage publish .temp/<tarball> --tag latest`.
8. Approve the staged package with 2FA, then verify `npm view` and a clean `npx` install.

Use the existing `.github/release.yml` categories when generating release notes. Attach the built tarball and record its SHA-256 digest in the release body.
