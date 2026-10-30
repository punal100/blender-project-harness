# Blender Project Collection

Workspace for managing multiple Blender projects through Kilo. Projects live under
`Blender/<ProjectName>/`; shared launcher and scaffolding tools live under `tools/`.

## Requirements

- Windows with Blender installed. The launcher auto-discovers it; set `BLENDER_EXE` only to override.
- PowerShell 7 or Windows PowerShell. `.\tools\start-blender.cmd --batch` provides a pure batch fallback.
- Kilo with the workspace Blender MCP configured in `.kilo/kilo.jsonc`.

## Quick start

Create a project:

```powershell
.\tools\new-blender-project.cmd -Name "ProjectName" -Description "What it is" -Goal "First design request"
```

Open it:

```powershell
.\tools\start-blender.cmd "Blender\ProjectName"
```

The launcher opens a live log terminal and writes the session log to the project's ignored
`logs/blender-<timestamp>.log`. It uses the workspace MCP port and allows only one Blender instance
spawned by this workspace at a time.

## Layout

```text
.
  AGENTS.md
  README.md
  .gitignore
  .kilo/
    kilo.jsonc
    skills/
  Blender/
    README.md
    <Project>/
  tools/
    new-blender-project.cmd
    new-blender-project.ps1
    start-blender.cmd
    start-blender.ps1
    start-blender-log.ps1
    start_blender_mcp.py
```

Keep the workspace root for documentation and configuration. Project files, renders, exports, and
logs belong inside their project folder.

## Documentation

- [`AGENTS.md`](AGENTS.md): binding agent rules and skill routing.
- [`.kilo/skills/`](.kilo/skills/): workspace skills for goals, scaffolding, READMEs, assets, and MCP.
- [`Blender/README.md`](Blender/README.md): project collection and quick start.
- Each project has its own `README.md`, `Documents/`, and asset register.

## Workflow

Read `AGENTS.md` and the matching skill before work. Start a goal for non-trivial Blender requests,
save the `.blend` every few turns, git-commit major milestones, and inspect every visual change with
`look` before reporting done.
