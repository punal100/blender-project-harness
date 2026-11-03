# Blender Project Workspace

This workspace takes you from an idea to a finished, reviewed Blender project. Kilo and the MCP for
Blender addon handle the building, inspection, grading, and records, while a guarded harness keeps
edits bounded and the project history clean.

Each project lives in its own folder under `Blender/<ProjectName>/`. The harness and checks live in
`.kilo/blender-project-harness/tools/`, with configuration at
`.kilo/blender-project-harness/config.json`. `AGENTS.md` contains the internal agent contract; this
README is the human setup and usage guide.

## What the workspace provides

- Requirements confirmation, project registration, and an active production goal.
- One guarded Blender instance per workspace and one writer at a time.
- Bounded scene changes with exact object names, paths, and declared scenes.
- Worker-executed apply tickets, WIP renders, and inspected review evidence.
- Independent visual, technical, and spec graders with primary and backup models.
- Scoped project commits, review records, checkpoints, and completion checks.
- Guarded intake for references, models, textures, HDRIs, audio, and source-only scripts.
- Strict asset checks, relative paths, licence records, and verified export receipts.
- Optional multi-scene projects, master Video Sequencer scenes, and media generation through the
  configured Media MCP when you approve the credits.

## Quick Start

1. **Git** — install from [git-scm.com/download/win](https://git-scm.com/download/win).
2. **Blender** — install the current stable or LTS Windows build from
   [blender.org/download](https://www.blender.org/download/), using the Windows installer. Blender
   5.2 is the current tested baseline; the MCP addon requires Blender 3.0 or newer.
3. **Node.js and npm** — install the current LTS Windows installer from
   [nodejs.org/download](https://nodejs.org/en/download). This repository requires Node.js 22 or
   newer; npm comes bundled with Node.js.
4. **uv and uvx** — install them with the Windows package manager:

   ```powershell
   winget install --id=astral-sh.uv -e
   ```

   Close and reopen PowerShell afterwards, then check that everything is on your PATH:

   ```powershell
   git --version
   node --version
   npm --version
   uvx --version
   ```

5. **Kilo** — pick whichever client you prefer:

   - Install [VS Code](https://code.visualstudio.com/download), then add the **Kilo Code**
     extension from [kilo.ai/install](https://kilo.ai/install).
   - Or install the CLI from PowerShell:

     ```powershell
     npm install -g @kilocode/cli
     kilo --version
     ```

   Sign in or connect a model provider through Kilo. Keep provider credentials in Kilo's own user
   configuration — never in this repository.

## Install with npm

In an existing Kilo workspace, install the harness without cloning this repository:

```powershell
npx blender-project-harness@latest install
```

The installer:

- copies the harness into `.kilo/blender-project-harness/tools/`;
- writes `VERSION`, `install.json`, `config.json`, and a copy of the package `AGENTS.md` in
  `.kilo/blender-project-harness/`;
- installs the harness dependencies with `npm ci`;
- updates `.kilo/kilo.jsonc` and `.kilo/plugins/blender-workflow.js`;
- adds missing workspace files such as `AGENTS.md`, `.kilo/skills/`, `.kilo/agent/`, and
  `Blender/README.md`;
- adds the local config and backups to `.gitignore`.

Run the same command to update. The previous installation is moved to
`.temp/blender-project-harness-backups/<version>-<timestamp>/` before the new version is installed.
Edit worker and grader models in `.kilo/blender-project-harness/config.json`. That config is
preserved across updates; use `--reset-config` to replace it with the package example. The package's
current `AGENTS.md` is always available at `.kilo/blender-project-harness/AGENTS.md`; the root
`AGENTS.md` is only installed when missing and is never overwritten.

Useful installer commands:

```powershell
npx blender-project-harness@latest status
npx blender-project-harness@latest doctor
npx blender-project-harness@latest install --dry-run
npx blender-project-harness@latest install --skip-deps
```

Use `--root <path>` when the workspace root is not the current directory. The installer requires
Node.js 22 or newer and npm. Blender, uvx, and the MCP addon are still installed separately.

## Work from a clone

The repository clone is the development source and the full workspace template. Clone it, open
PowerShell in its root, and install the locked local Node dependencies:

```powershell
git clone <repository-url>
Set-Location <repository-folder>
npm ci --prefix .kilo/blender-project-harness/tools/harness
npm run doctor --prefix .kilo/blender-project-harness/tools/harness
```

The doctor command checks Node.js, the npm-installed harness packages, Git, uvx, the workspace
config, the pinned `mcp-for-blender==2.2.6`, and the running Blender instance state. It does not open
Blender.

## Add MCP for Blender to Blender

Install the addon into Blender:

```powershell
uvx --from mcp-for-blender==2.2.6 mcp-for-blender install-addon
```

Open Blender and enable **Interface: MCP for Blender** under **Edit > Preferences > Add-ons**
(search for `MCP for Blender`). Restart Blender once it is enabled.

This workspace routes MCP through `.kilo/kilo.jsonc`, which sets `BLENDER_PORT` (default `9877`).
The harness and the addon both use that value, so you can change it to any free port as long as it
stays in one place. Do not create a project-local Kilo config or run a second MCP server. If you
installed `uvx` or the addon while Kilo was open, fully reload Kilo so it picks up the new PATH and
workspace configuration.

## Start building

Open this repository in Kilo and reload the workspace after the dependencies are installed. Then
describe what you want to make. The more you share up front — subject, style, key objects, camera and
lighting preferences, dimensions, required deliverables, and whether external files or paid media
generation are allowed — the fewer follow-up questions you will get.

For example:

```text
Create a small cozy retro computer room. Use warm lamp light, a cool window accent, a desk with a
CRT monitor, keyboard, mug, chair, rug, and wall decor. Make one hero camera view and save the scene
inside a new Blender project.
```

The agent then follows the harness flow:

1. Confirms requirements and asks for the workflow mode: **Fully Autonomous** or **Partially
   Autonomous**.
2. Asks for the review mode: **Off**, **Single**, or **All**.
3. Scaffolds the project, fills its records, registers it, and starts the goal.
4. Launches Blender through the harness and saves the bootstrap scene.
5. Builds the project in bounded changes using worker apply tickets.
6. Renders and inspects WIP evidence, then seals a review round.
7. Dispatches the configured graders and aggregates their reports.
8. Commits the scoped change, checkpoints the project, and reports the result.

The agent owns goals and project records end to end, so you can stay in plain language. You provide
requirements, answers, feedback, and approvals through the conversation.

## Files, assets, and media

- Put user-supplied files wherever you like and give the agent their paths. The harness
  `intake` action copies them into canonical project paths without moving or deleting the originals.
  You do not need to create project folders or rename files.
- `download` can stage a public HTTPS asset into ignored staging. The agent still has to inspect it,
  provide source and licence metadata, and run `intake` before using it.
- Generated references and images go through the configured Media MCP only with your permission.
  The agent saves the actual file, records provenance, shows it to you, and asks before using it as a
  texture or reference.
- External assets require `SOURCE.md` and `LICENSE.txt` beside them. Non-redistributable binaries
  stay out of Git; their metadata and acquisition details are recorded instead.
- Project scripts under `scripts/` are source-only. The harness never executes project Python.
- Every produced export needs a verified receipt with format, path, bytes, SHA-256, source scene, and
  signature. A missing or changed export blocks completion.

## Review and completion

- **Off** uses self-review only. **Single** uses one configured grader. **All** uses every configured
  grader, up to `max_parallel`.
- **Fully Autonomous** proceeds through reviewable changes; **Partially Autonomous** requires your
  approval before each reviewable change commits.
- Every worker and grader has a primary model and a backup model with a reasoning variant. A missing
  or disabled grader is a tooling failure, not a silent pass.
- A review round seals the saved scene, per-scene renders, camera evidence, scene facts, manifest,
  evidence key, and review folder. The sealed render must be inspected before review.
- Technical evidence includes object dimensions and topology, not just names and types.
- When assets are used, a strict `check_assets` run must leave a receipt on the final unchanged
  scene, and the sealed manifest must include it.
- A design review can end in `PASS` or `CHANGES_REQUIRED`; missing evidence or tooling problems end
  in `BLOCKED`. A blocked round is preserved and checkpointed, never downgraded to a pass.
- Completion requires the final full-spec pass, a clean checkpoint, current documents, a complete
  goal, and a completed task tracker. Blender is stopped unless you ask to leave it open for
  inspection.

## House rules

- Keep every Blender project under `Blender/<ProjectName>/`.
- Let the agent launch and stop Blender through `blender_workflow`; do not run `blender.exe` or any
  legacy script directly for workspace work.
- Project documents and project commits go through the harness; manual project Git commits are
  blocked.
- Requirements, workflow, review, and goal records are frozen after registration. Changing them
  requires an explicit re-registration, not a normal edit.
- Read-only shell inspection is allowed. Other non-project shell commands require a reasoned,
  two-step approval committed under the project's `Documents/Commands/` or the root `Commands/`.
- Run only one Blender instance from this workspace at a time.
- Keep credentials, local model settings, logs, caches, backups, and temporary renders out of Git.
- Use relative paths inside Blender projects so scenes stay portable.
- Do not edit the harness-owned task tracker or task records by hand.
- Check each project's `README.md` and `Documents/` for its own requirements and deliverables.

## Useful checks and fixes

Run these from the workspace root when something looks off, or when you are contributing to the
tooling:

```powershell
npx blender-project-harness@latest status
npx blender-project-harness@latest doctor
npm run test:installer
npm test --prefix .kilo/blender-project-harness/tools/harness
python -B -m unittest discover -s .kilo/blender-project-harness/tools -p "test_*.py" -v
```

The Node suite is comprehensive and can take several minutes on Windows. Use `npm run pack:check`
to inspect the npm package contents without publishing.

Common fixes:

- **`uvx` not found:** reopen PowerShell after installing uv, then reload Kilo.
- **Harness dependency missing:** rerun `npx blender-project-harness@latest install --force`, or run
  `npm ci` in `.kilo/blender-project-harness/tools/harness`.
- **Addon or port error:** reinstall with
  `uvx --from mcp-for-blender==2.2.6 mcp-for-blender install-addon`, restart Blender, and reload
  Kilo. Keep `BLENDER_PORT` in `.kilo/kilo.jsonc`; the harness reads it for launch and addon startup.
- **Blender not found:** point `BLENDER_EXE` at your installed Blender executable, then relaunch
  with `blender_workflow`.
- **Stale or conflicting instance:** stop the running instance through the harness before launching
  another project.

## What's in the repo

```text
AGENTS.md                 Internal agent contract and workflow rules
README.md                 This human setup and usage guide
package.json              npm package metadata and installer entry point
bin/                      npm installer executable
installer/                Versioned installer, update, and backup logic
.kilo/                    Workspace Kilo config, skills, agents, and plugin
.kilo/blender-project-harness/
                          Harness, config, and version records
.kilo/blender-project-harness/config.example.json
                          Default worker and grader configuration
.kilo/blender-project-harness/config.json
                          Local worker and grader configuration (ignored)
.kilo/blender-project-harness/tools/harness/
                          Guarded Node.js workflow, MCP bridge, and harness tests
.kilo/blender-project-harness/tools/harness/EXPECTED_FLOW.md
                          Developer reference for the expected lifecycle and evidence
Blender/                  Blender project collection
Commands/                 Approved non-project shell-command records
```

[`Blender/README.md`](Blender/README.md) covers the project-collection conventions. The generic
harness lifecycle and evidence contract are documented in
[`.kilo/blender-project-harness/tools/harness/EXPECTED_FLOW.md`](.kilo/blender-project-harness/tools/harness/EXPECTED_FLOW.md).
Licensing lives in
[`LICENSE`](LICENSE) and [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## Known limits

- No arbitrary Blender Python execution.
- No browser or authentication bypass.
- No automatic licence acceptance.
- Media generation is agent-owned; the harness intakes and records the result.
- Multi-scene, media-generation, and export paths are implemented, but the current live acceptance
  run is a single scene. Verify those paths in the project where they are used.
- One live Blender instance and one writer at a time; parallel read-only inspection is allowed.
