# Blender Project Workspace

Human-facing workspace for creating Blender projects with Kilo and MCP for Blender.
Projects live under `Blender/<ProjectName>/`. Shared launchers and checks live under `tools/`.

`AGENTS.md` contains internal agent rules. Humans provide the creative brief, constraints, answers,
feedback, and approvals. The agent creates project documents and goals, runs the workflow, updates
records, operates Blender, and reports progress.

## Quick Start: Fresh Windows PC

Install these once on a new PC:

1. **Git** — install from [git-scm.com/download/win](https://git-scm.com/download/win).
2. **Blender** — install the current stable or LTS Windows build from
   [blender.org/download](https://www.blender.org/download/). Use the Windows installer. Blender
   3.0 or newer is required by MCP for Blender.
3. **Node.js and npm** — install the current LTS Windows installer from
   [nodejs.org/download](https://nodejs.org/en/download). This repository requires Node.js 22 or
   newer; npm is included with Node.js.
4. **uv and uvx** — install the Windows package manager with PowerShell:

   ```powershell
   winget install --id=astral-sh.uv -e
   ```

   Close and reopen PowerShell after installation. Confirm both commands work:

   ```powershell
   git --version
   node --version
   npm --version
   uvx --version
   ```

5. **Kilo** — choose one client:

   - Install [VS Code](https://code.visualstudio.com/download), then install the **Kilo Code**
     extension from [kilo.ai/install](https://kilo.ai/install).
   - Or install the CLI from PowerShell:

     ```powershell
     npm install -g @kilocode/cli
     kilo --version
     ```

   Sign in or configure a model provider through Kilo. Keep provider credentials in Kilo's user
   configuration; never put them in this repository.

## Install This Workspace

Clone the repository, open PowerShell in its root, and install the locked local Node dependencies:

```powershell
git clone <repository-url>
Set-Location <repository-folder>
npm ci --prefix tools/harness
npm run doctor --prefix tools/harness
```

The doctor command checks Node.js, npm-installed harness packages, Git, uvx, the workspace config,
and pinned `mcp-for-blender==2.2.6`. It does not open Blender.

## Install MCP for Blender

Install the addon into Blender:

```powershell
uvx --from mcp-for-blender==2.2.6 mcp-for-blender install-addon
```

Open Blender, then enable **MCP for Blender** in **Edit > Preferences > Add-ons**. Search for
`MCP for Blender` and enable **Interface: MCP for Blender**. Restart Blender after enabling it.

This workspace routes MCP through `.kilo/kilo.jsonc` and expects port `9877`. Do not create a
project-local Kilo config or run a second MCP server. If `uvx` or the addon was installed while Kilo
was open, fully reload Kilo so it sees the new PATH and workspace configuration.

## Start Working

Open this repository folder in Kilo and reload the workspace after installing dependencies. Describe
what you want to build. Include the subject, style, important objects, camera or lighting
preferences, dimensions, and required deliverables when known.

Example:

```text
Create a small cozy retro computer room. Use warm lamp light, a cool window accent, a desk with a
CRT monitor, keyboard, mug, chair, rug, and wall decor. Make one hero camera view and save the scene
inside a new Blender project.
```

The agent handles the rest:

- asks only for requirements or decisions that need your input;
- creates the project, goal files, requirements, workflow, and review records;
- starts Blender through the validated workspace launcher;
- builds and checks the scene through the guarded MCP workflow;
- saves renders and review evidence, updates project documents, and reports blockers or corrections.

The agent owns goals and project records end to end. You only provide normal-language requirements,
answers, feedback, and approvals through the conversation. It creates and updates goals as work
changes.

## Project Rules For Humans

- Keep each Blender project under `Blender/<ProjectName>/`.
- Let the agent launch Blender with `tools/start-blender.cmd`; do not launch `blender.exe` directly
  for workspace work.
- Only one Blender instance from this workspace may run at a time.
- Keep credentials, local model settings, logs, caches, backups, and temporary renders out of Git.
- Use relative paths inside Blender projects so scenes remain portable.
- Review project-specific requirements and deliverables in each project's `README.md` and `Documents/`.

## Useful Checks

Run these from the workspace root when troubleshooting or contributing to the tooling:

```powershell
npm run doctor --prefix tools/harness
python -B -m unittest discover -s tools -p "test_*.py" -v
npm test --prefix tools/harness
```

Common fixes:

- **`uvx` unavailable:** reopen PowerShell after installing uv, then reload Kilo.
- **Harness dependency missing:** run `npm ci --prefix tools/harness` again.
- **Addon or port error:** reinstall with `uvx --from mcp-for-blender==2.2.6 mcp-for-blender install-addon`, restart Blender, and
  reload Kilo. Keep the workspace port at `9877`.
- **Blender discovery error:** set `BLENDER_EXE` to the installed Blender executable path, then let
  the workspace launcher start Blender.

## Repository Layout

```text
AGENTS.md                 Internal agent contract
README.md                 This human setup guide
.kilo/                    Workspace Kilo config, skills, agents, and plugin
Blender/                  Blender project collection
tools/                    Project scaffold, launcher, MCP bootstrap, and tests
tools/harness/             Guarded Node.js workflow and MCP bridge
```

See [`Blender/README.md`](Blender/README.md) for project-collection conventions. See
[`LICENSE`](LICENSE) and [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) for licensing.
