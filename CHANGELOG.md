# Changelog

## Unreleased

## 1.0.5 - 2026-11-05

### Added

- Harness-owned `/goal-blender` mission lifecycle with `goal_blender` start, status, pause, resume,
  complete, and clear actions, persisted mission metadata, and bounded auto-continuation.
- The initial scaffold commit and post-completion tracker commit remain the mission boundaries.

### Changed

- The built-in `goal` and `goal_report` tools are disabled. Using `/goal` invalidates the Blender
  registration and requires `/goal clear`, closing any open change, and re-registration.
- `question` is available during `/goal-blender` for clarifications and Partially Autonomous approvals.
- Root `AGENTS.md` and `README.md` are refreshed on update only when they are identical to the previous
  install; locally modified files are preserved, and the replaced file is backed up under
  `.temp/blender-project-harness-backups/`.

### Fixed

- Requirements discovery now requires the runtime reference question and answer before registration;
  declining external assets no longer skips it, and `prepare` rejects without the receipt.
- Goal-conflict recovery now preserves applied and reviewed changes safely, rejects recovery while a
  worker ticket is pending, and blocks new ticket authorization.
- Auto-continuation metadata is initialized on reclaim and is not reset by starting an already-active
  mission.

## 1.0.4 - 2026-11-05

### Fixed

- Harness Git operations now retry transient timeouts and lock contention with backoff, recognize a commit that landed before its timeout, and keep a grader's verdict when task-metadata commit fails transiently.
- Valid grader reports are preserved: PASS and CHANGES_REQUIRED reports are recovered instead of re-dispatched, BLOCKED retries archive the prior report as `REPORT.attemptN.md`, and a grader cannot overwrite a valid report.
- A missing grader config now reports a workflow gate instead of an unhandled file error.
- Grader budgets raised after a live final review exhausted 10 steps before writing the technical report: the ceiling is now 24, visual/technical default to 16 steps and 8 minutes, and a full-spec `spec` grader defaults to 20 steps and 10 minutes.
- Grader prompts now name the exact frozen-image call (`blender_look {image:"..."}`), tell graders to skip optional documents, reserve a step for the report write, and write the verdict from available evidence instead of ending without a report after a denied look or a tight budget.
- Scaffolded projects now receive `.gitignore` from the npm package (template files renamed to `gitignore` because npm strips dotfiles); launch logs, WIP renders, review evidence, `.blend1`, and caches no longer break `begin`.
- Installer workspace `.gitignore` now covers logs, WIP renders, review evidence, Blender backups, caches, and nested `node_modules`.
- `recover` treats an unstarted ticket as expired after its TTL instead of waiting for Blender to stop; worker tickets rebind to a fresh child when the prior child never executed.
- Added `abandon {reason}` and empty-change `commit {mode:"wip"}` so an expired change with no applies can close without a commit.
- `reclaim` now refuses a registration whose checkpoint or snapshot does not match the current checkout; `forget {project,reason}` discards such branch-local state.
- `prepare` requires an explicit `Reference images / links:` answer and rejects the template placeholder.
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
- Goal skill documents explicit goal start and resume call forms.

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
