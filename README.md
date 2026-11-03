# Blender Project Workspace

This workspace takes you from an idea to a finished Blender scene, with Kilo and MCP for Blender
handling the building and checking along the way. Each project lives in its own folder under
`Blender/<ProjectName>/`, and the shared MCP harness and checks live in `tools/harness/`.

`AGENTS.md` holds the internal rules the agent follows. You bring the creative brief, constraints,
answers, feedback, and approvals. The agent turns those into project documents and goals through the
harness, runs the workflow, keeps records up to date, operates Blender, and reports back as it goes.
Project document creation and project commits go through `blender_workflow`; manual project Git
commits are blocked.

## Quick Start

1. **Git** — install from [git-scm.com/download/win](https://git-scm.com/download/win).
2. **Blender** — install the current stable or LTS Windows build from
   [blender.org/download](https://www.blender.org/download/), using the Windows installer. The MCP
   addon needs Blender 3.0 or newer.
3. **Node.js and npm** — install the current LTS Windows installer from
   [nodejs.org/download](https://nodejs.org/en/download). This repository needs Node.js 22 or newer;
   npm comes bundled with Node.js.
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

## Get the workspace running

Clone the repository, open PowerShell in its root, and install the locked local Node dependencies:

```powershell
git clone <repository-url>
Set-Location <repository-folder>
npm ci --prefix tools/harness
npm run doctor --prefix tools/harness
```

The doctor command checks Node.js, the npm-installed harness packages, Git, uvx, your workspace
config, and the pinned `mcp-for-blender==2.2.6`. It does not open Blender.

## Add MCP for Blender to Blender

Install the addon into Blender:

```powershell
uvx --from mcp-for-blender==2.2.6 mcp-for-blender install-addon
```

Open Blender and enable **Interface: MCP for Blender** under **Edit > Preferences > Add-ons**
(search for `MCP for Blender`). Restart Blender once it is enabled.

This workspace routes MCP through `.kilo/kilo.jsonc`, which sets `BLENDER_PORT` (default `9877`).
The harness and the addon both use that value, so you can change it to any free port as long as it
stays in one place. Please don't create a project-local Kilo config or run a second MCP server. If
you installed `uvx` or the addon while Kilo was open, fully reload Kilo so it picks up the new PATH
and workspace configuration.

## Start building

Open this repository in Kilo and reload the workspace after the dependencies are installed. Then
just describe what you want to make. The more you share up front — subject, style, key objects,
camera and lighting preferences, dimensions, and required deliverables — the less the agent has to
ask later.

For example:

```text
Create a small cozy retro computer room. Use warm lamp light, a cool window accent, a desk with a
CRT monitor, keyboard, mug, chair, rug, and wall decor. Make one hero camera view and save the scene
inside a new Blender project.
```

From there, the agent takes over:

- it asks only for the requirements and decisions it genuinely needs from you;
- creates the project, goal files, requirements, workflow, and review records;
- launches and stops Blender through the guarded harness, tracking one instance per workspace;
- copies user-supplied references, models, textures, HDRIs, audio, and source-only scripts through
  the guarded `intake` action instead of asking you to make folders; `download` can stage a public
  HTTPS asset for the same intake flow when you provide a URL;
- can build multiple authored scenes in one project, with a scene-specific camera and render
  evidence for each, plus an optional master Video Sequencer scene;
- builds and checks the scene through the guarded MCP workflow;
- saves per-scene renders and review evidence, verifies exports, keeps the project documents
  current, and tells you about any blockers or corrections.

The agent owns goals and project records end to end, so you can stay in plain language. You provide
requirements, answers, feedback, and approvals through the conversation, and it creates and updates
goals as the work changes.

## House rules

- Keep every Blender project under `Blender/<ProjectName>/`.
- Let the agent launch and stop Blender through `blender_workflow`; don't run `blender.exe` or any
  script directly for workspace work.
- Project documents and project commits go through the harness; manual project Git commits are
  blocked.
- Read-only shell inspection is allowed. Other non-project shell commands require a reasoned,
  two-step approval committed under the project's `Documents/Commands/` or the root `Commands/`.
- Every worker and grader uses a configured primary model plus a backup model and reasoning variant.
- Run only one Blender instance from this workspace at a time.
- Keep credentials, local model settings, logs, caches, backups, and temporary renders out of Git.
- Use relative paths inside Blender projects so scenes stay portable.
- Let the harness copy user files through `intake`; do not create project folders or copy by hand.
- Project Python under `scripts/` is source-only; arbitrary Blender Python execution is not
  supported. Media generation uses the configured Media MCP only with your permission; generated
  files go through `intake` with provenance.
- External binaries are committed only when their source metadata allows redistribution; every
  produced export has a verified receipt.
- Check each project's `README.md` and `Documents/` for its own requirements and deliverables.

## Useful checks and fixes

Run these from the workspace root when something looks off, or when you're contributing to the
tooling:

```powershell
npm run doctor --prefix tools/harness
python -B -m unittest discover -s tools -p "test_*.py" -v
npm test --prefix tools/harness
```

Common fixes:

- **`uvx` not found:** reopen PowerShell after installing uv, then reload Kilo.
- **Harness dependency missing:** run `npm ci --prefix tools/harness` again.
- **Addon or port error:** reinstall with
  `uvx --from mcp-for-blender==2.2.6 mcp-for-blender install-addon`, restart Blender, and reload
  Kilo. Keep `BLENDER_PORT` in `.kilo/kilo.jsonc`; the harness reads it for launch and addon startup.
- **Blender not found:** point `BLENDER_EXE` at your installed Blender executable, then relaunch
  with `blender_workflow`.

## What's in the repo

```text
AGENTS.md                 Internal agent contract
README.md                 This human setup guide
.kilo/                    Workspace Kilo config, skills, agents, and plugin
Blender/                  Blender project collection
tools/                    Workspace checks and the guarded harness
tools/harness/             Guarded Node.js workflow and MCP bridge
```

[`Blender/README.md`](Blender/README.md) covers the project-collection conventions. Licensing lives
in [`LICENSE`](LICENSE) and [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
