# Changelog

## Unreleased

## 1.0.3

### Added

- Harness-booked media requests with staged-file hashes, generated metadata, retry limits, committed failure records, and a harness-owned `Documents/MEDIA.md` ledger.
- Media generation gating before registration or without an open media request.
- Required intake linking for generated media before commit.

### Changed

- Trimmed `AGENTS.md` from 244 to 152 lines; procedural detail moved into harness `capabilities` and `nextStep`.
- Refactored all 10 skill files: reduced total line count from 1,245 to 823.
- `capabilities` action table now exposes exact payload shapes for every action; recovery actions split into individual rows.
- Fixed `BLOCKED` vs `CHANGES_REQUIRED` verdict wording in `blender-subagents` and `blender-project-grading`.
- Goal skill now includes explicit `goal(action="start", …)` and `goal(action="resume")` call forms.

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
