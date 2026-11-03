# Changelog

## 1.0.2

- Rebuild the npm package so the published README matches the repository README.
- No runtime changes.

## 1.0.1

- Publish the package as `@punal_manalan/blender-project-harness`.
- Add GitHub repository, homepage, and issue tracker metadata.
- Update installer and documentation commands to the scoped package name.

## 1.0.0

- Initial npm release of `blender-project-harness`.
- Installs the harness under `.kilo/blender-project-harness/tools/`.
- Installs dependencies with `npm ci` and keeps the installed harness self-contained.
- Preserves `config.json` across updates.
- Backs up previous installations under `.temp/blender-project-harness-backups/`.
- Keeps the package `AGENTS.md` copy at `.kilo/blender-project-harness/AGENTS.md`.
- Updates the MCP command and Kilo plugin to the installed harness path.
