# Blender Project Harness

Workspace template for building Blender projects with Kilo AI agents and
[MCP for Blender](https://github.com/ahujasid/mcp-for-blender). Projects live under
`Blender/<ProjectName>/`; shared launcher, scaffolding, and regression tests live under `tools/`.

Not affiliated with the Blender Foundation or the mcp-for-blender project.

## Requirements

- Windows with Blender installed. The launcher auto-discovers it; set `BLENDER_EXE` only to override.
- PowerShell 7 or Windows PowerShell. The validated PowerShell launcher is required; unsupported
  `--batch` and `KILO_BLENDER_FORCE_CMD` paths fail instead of bypassing project checks.
- Kilo with the workspace Blender MCP configured in `.kilo/kilo.jsonc`.

## Quick start

Confirm project requirements with the agent first. Record `Status: Confirmed`, `Confirmed: YYYY-MM-DD`,
and the exact `Confirmation:` response in the project requirements file. Select and record the
workflow mode before opening Blender.

Create a project:

```powershell
.\tools\new-blender-project.cmd -Name "ProjectName" -Description "What it is" -Goal "First design request"
```

Open it:

```powershell
.\tools\start-blender.cmd "Blender\ProjectName"
```

The launcher validates project containment, confirmation records, workflow selection, `.blend` paths,
the workspace MCP port, reparse points, active ports, and existing workspace Blender processes before
opening a live log terminal. It writes the session log to the project's ignored
`logs/blender-<timestamp>.log` and allows only one Blender instance spawned by this workspace at a time.

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

Read `AGENTS.md` and the matching skill before work. Production work requires an active goal; workspace
maintenance and read-only questions are exempt. Save the authoritative `.blend` after every meaningful
scene change and before risky work or handoff. Review git changes at milestones and commit atomically:
one logical, verified change per commit. Commits are mandatory; never batch a session into one
end-of-task commit. Inspect every visual change with `look` before reporting done.

New projects start with a requirements discussion and explicit confirmation. Then choose Fully
Autonomous or Partially Autonomous mode. On a return to a paused project, confirm whether to continue
or switch mode; automatic goal turns and compaction within the same active task do not repeat the gate.
Partially Autonomous asks for approval after every meaningful change.

Use web search during requirements for ambiguous or open-ended questions; cite sources and confirm
findings with the user before they become requirements. If a Blender or library API is undocumented
or unclear, use Context7, official docs, and web search, then test against the live version.

## Subagents

The main session is the controller and owns all design decisions. Copy `config.example.json` to the
gitignored `config.json`, set the `blender_subagents` model, provider, variant, and limits, then load
`blender-subagents`. Spawn one `blender-worker` at a time with `task`; workers execute one specific
task, stop at their budget, and return `BLOCKED` instead of deciding scope or design.

## Tooling checks

Run the maintenance regression suite from the workspace root:

```powershell
python -B -m unittest discover -s tools -p "test_*.py" -v
```

Launcher and scaffold checks use isolated temporary workspaces and PowerShell. Bootstrap checks mock
`bpy`; no test launches Blender. Frontmatter and worker-config checks require PyYAML and report a skip
when it is unavailable. Live addon behavior, Kilo registration, and actual Blender startup need a
separate runtime check.

## Licence

MIT. See [`LICENSE`](LICENSE). The Blender MCP workflow guides under
`.kilo/skills/blender-mcp/references/` are adapted from `ahujasid/mcp-for-blender`; attribution and
the upstream MIT notice are in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
