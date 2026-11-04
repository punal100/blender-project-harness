# Changelog

## Unreleased

### Fixed

- Scaffolded projects now receive `.gitignore` from the npm package (template files renamed to `gitignore` because npm strips dotfiles); launch logs, WIP renders, review evidence, `.blend1`, and caches no longer break `begin`.
- Installer workspace `.gitignore` now covers logs, WIP renders, review evidence, Blender backups, caches, and nested `node_modules`.
- `recover` treats an unstarted ticket as expired after its TTL instead of waiting for Blender to stop; worker tickets rebind to a fresh child when the prior child never executed.
- Added `abandon {reason}` and empty-change `commit {mode:"wip"}` so an expired change with no applies can close without a commit.
- Worker/grader model matching is case-insensitive, ignores provider prefixes on model ids, aliases `xhigh`/`extra-high`, and prints observed versus expected values; read-only worker preflight is no longer blocked by the model gate.
- `autoCommit` and `checkpoint` tolerate workspace-level commits interleaved with an open project change.
- Workspace-level shell approvals refresh the owning project snapshot.
- `prepare` explains the difference between the bare `.blend` filename and project-relative `begin` paths.
- Requirements discovery now asks for reference images or links explicitly and gates requirements against harness capabilities.
- Documented live primitive sizing and unsupported material/world features.
- Doctor reports workspace `.gitignore` coverage and project Git cleanliness.

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
