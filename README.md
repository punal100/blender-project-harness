# Blender Project Collection

Workspace for managing multiple Blender projects through Kilo. Projects live under
`Blender/<ProjectName>/`; shared launcher and scaffolding tools live under `tools/`.

## Requirements

- Windows with Blender installed. The launcher auto-discovers it; set `BLENDER_EXE` only to override.
- PowerShell 7 or Windows PowerShell. `.\tools\start-blender.cmd --batch` provides a pure batch fallback.
- Kilo with the workspace Blender MCP configured in `.kilo/kilo.jsonc`.

## Quick start

Confirm project requirements with the agent first. Do not scaffold or open Blender until the user
has approved them.

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
- [`.kilo/skills/`](.kilo/skills/): workspace skills for goals, subagents, requirements, workflow, scaffolding, READMEs, assets, and MCP.
- [`.kilo/agent/blender-worker.md`](.kilo/agent/blender-worker.md): bounded worker definition.
- [`config.example.json`](config.example.json): subagent model and budget template; copy to gitignored `config.json`.
- [`Blender/README.md`](Blender/README.md): project collection and quick start.
- Each project has its own `README.md`, `Documents/`, and asset register.

## Workflow

Read `AGENTS.md` and the matching skill before work. Start or resume a goal for every session, save
the `.blend` every few turns, git-commit major milestones, and inspect every visual change with
`look` before reporting done.

New projects start with a requirements discussion and explicit confirmation. Then choose Fully
Autonomous or Partially Autonomous mode. The mode is asked again on every resume and can be changed
at any time. Partially Autonomous asks for approval after every meaningful change.

Use web search during requirements for ambiguous or open-ended questions; cite sources and confirm
findings with the user before they become requirements. If a Blender or library API is undocumented
or unclear, use Context7, official docs, and web search, then test against the live version.

## Subagents

The main session is the controller and owns all design decisions. Copy `config.example.json` to the
gitignored `config.json`, set the `blender_subagents` model, provider, variant, and limits, then load
`blender-subagents`. Spawn one `blender-worker` at a time with `task`; workers execute one specific
task, stop at their budget, and return `BLOCKED` instead of deciding scope or design.
