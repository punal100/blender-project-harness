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
- `uvx` on `PATH` for the configured `mcp-for-blender` server, plus the matching Blender addon.

The enabled-only `mediamcp` entry inherits its full server definition from user-level Kilo config;
this repository does not contain its command or credentials. Configure that optional integration
globally before using it, or disable its workspace entry when unavailable. Never copy credentials
into tracked config. The disabled Playwright entry overrides any inherited server.

## Quick start

Confirm project requirements with the agent first, then select workflow and review modes. Keep the
exact answers until scaffolding exists. After creating the project, persist all three records before
opening Blender: requirements need `Status: Confirmed`, `Confirmed: YYYY-MM-DD`, and the exact
`Confirmation:` response; mode records need their selected mode and date.

Create a project:

```powershell
.\tools\new-blender-project.cmd -Name "ProjectName" -Description "What it is" -Goal "First design request"
```

Open it:

```powershell
.\tools\start-blender.cmd "Blender\ProjectName"
```

The launcher validates project containment, confirmation records, workflow/review selection, `.blend` paths,
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
    agent/
      blender-worker.md
      blender-grader.md
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
- [`.kilo/skills/`](.kilo/skills/): workspace skills for goals, subagents, grading, requirements, workflow, scaffolding, READMEs, assets, and MCP.
- [`.kilo/agent/blender-worker.md`](.kilo/agent/blender-worker.md): bounded worker definition.
- [`.kilo/agent/blender-grader.md`](.kilo/agent/blender-grader.md): independent read-only grader rubric.
- [`config.example.json`](config.example.json): worker and grader model and budget template; copy to gitignored `config.json`.
- [`Blender/README.md`](Blender/README.md): project collection and quick start.
- Each project has its own `README.md`, `Documents/`, and asset register.

Skill files must follow the [Agent Skills specification](https://agentskills.io/specification):
YAML frontmatter with directory-matching `name` and non-empty `description`, followed by Markdown.
Agent files use [Kilo's custom-agent format](https://kilo.ai/docs/customize/custom-subagents), with
`mode: subagent`, positive `steps`, and ordered permissions. [Permission rules](https://kilo.ai/docs/customize/agent-permissions)
use last-match-wins; broad defaults precede specific exceptions. Static checks do not prove runtime
registration or a configured model's availability.

## Workflow

Read `AGENTS.md` and the matching skill before work. Production work requires an active goal; workspace
maintenance and read-only questions are exempt. Save the authoritative `.blend` after every meaningful
scene change and before risky work or handoff. Review git changes at milestones and commit atomically:
one logical, verified change per commit. Commits are mandatory; never batch a session into one
end-of-task commit. Inspect every visual change with `look` before reporting done.

New projects start with a requirements discussion and explicit confirmation in ordinary chat. Then
choose Fully Autonomous or Partially Autonomous mode, choose a review mode (`Off`, `All`, `Single`),
and scaffold. Kilo disables `question` during an active goal, so initial clarification must happen
before the goal starts; later required questions need a paused goal. On a return to a paused project,
confirm whether to continue or switch workflow and review modes. Routine approval pauses within
the same active task do not restart mode selection.
Partially Autonomous asks for approval after every meaningful change: pause the goal, ask, then resume.

Use web search during requirements for ambiguous or open-ended questions; cite sources and confirm
findings with the user before they become requirements. If a Blender or library API is undocumented
or unclear, use Context7, official docs, and web search, then test against the live version.

## Subagents

The main session is the controller and owns all design decisions. Copy `config.example.json` to the
gitignored `config.json`, set the `blender_subagents` model, provider, variant, and limits, then load
`blender-subagents`. Spawn one `blender-worker` at a time with `task`; workers execute one specific
task, stop at their budget, and return `BLOCKED` instead of deciding scope or design.

## Reviews

Graders are independent, read-only subagents that check saved work against confirmed requirements.
Configure models and reasoning variants in `blender_graders.graders[]`; each project records `Off`,
`All`, or `Single` in `Documents/REVIEW.md`. Load `blender-project-grading` for evidence capture,
timestamped round folders under `Documents/Reviews/`, dispositions, re-review, and bounds. Review
reports and manifests are committed; only preview evidence and temp files are ignored. The controller
still inspects every change with `look` and owns the final verdict.

Round names must be generated at creation: `R<NN>-<yyyyMMddTHHmmssZ>`, using the next project-wide
sequence and current UTC time. Never copy an example timestamp or reuse a round folder. Missing or
disabled grader config blocks production when the project selected `All` or `Single`; `Off` remains
controller self-review. Model/provider/variant overrides still require an explicit user request.

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
