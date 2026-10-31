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
- Node.js 22 or newer and npm for `tools/harness/` and the auto-loaded
  `.kilo/plugins/blender-workflow.js` plugin.
- `uvx` on `PATH` for the configured `mcp-for-blender` server, plus the matching Blender addon.

The enabled-only `mediamcp` entry inherits its full server definition from user-level Kilo config;
this repository does not contain its command or credentials. Configure that optional integration
globally before using it, or disable its workspace entry when unavailable. Never copy credentials
into tracked config. The disabled Playwright entry overrides any inherited server.

## Quick start

Install harness dependencies from the workspace root, then reload Kilo to load the plugin, custom
`blender_workflow` tool, and `blender_harness_execute` MCP bridge:

```powershell
npm ci --prefix tools/harness
npm run doctor --prefix tools/harness
```

Setup instructions do not prove installation or runtime validation. Verify tool availability after
reload; stop production if the plugin or bridge is unavailable.

`npm run doctor --prefix tools/harness` checks Node, locked harness dependencies, workspace routing,
Git, `uvx`, and the pinned `mcp-for-blender==2.2.6` command. It does not start Blender or prove that
the live addon is listening; perform that check only through the validated launcher after registration.

Confirm project requirements with the agent first, then select workflow and review modes. Keep the
exact answers until scaffolding exists. After creating the project, persist all three records before
opening Blender: requirements need `Status: Confirmed`, `Confirmed: YYYY-MM-DD`, and the exact
`Confirmation:` response; mode records need their selected mode and date.

Create a project:

```powershell
.\tools\new-blender-project.cmd -Name "ProjectName" -Description "What it is" -Goal "First design request"
```

Fill the goal and project documents. Inspect `git status`, `git diff`, and `git log --oneline -10`,
then commit exact scaffold paths before launch. Call `blender_workflow` `prepare` with only
`{project:"Blender/ProjectName",goal:"Documents/Goals/NN-slug.md",scene:"name.blend"}` as its JSON-string
payload. Use the actual goal and scene paths. Pass its exact registration question and labels to
`question` (`custom:false,multiple:false`). Only genuine runtime answers register the project, never
approved JSON. Start/resume the registered goal, end that turn, then inspect harness `status` before
opening Blender:

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
    plugins/
      blender-workflow.js
  Blender/
    README.md
    <Project>/
  tools/
    harness/
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

Read `AGENTS.md` and the matching skill before work. Production requires runtime registration and an
active goal; workspace maintenance and read-only questions are exempt. Maintenance needs no project,
goal, or review render and must not launch or modify Blender unless separately requested.

`AGENTS.md` defines the canonical harness contract. `blender_workflow` takes
`{action: string, payload: JSON string}`. Each production change follows these checkpoints:

1. Inspect `status`; `begin` declares one outcome, exact object names, and exact project-relative
   files. One open change is bounded by 40 operations and 15 minutes.
2. Request `ticket` for `apply`, `save`, or `seal`; next call `blender_harness_execute` with the token,
   matching operation/payload, and verbatim user goal. Save after meaningful changes and before
   handoff; recovery save/seal remain available after the apply budget.
3. `seal` saves the scene and captures immutable evidence, final PNG, and manifest. Call mandatory
   `blender_look(image=<returned absolute render path>)`; the hook records successful inspection.
4. `Off`: `self-review` with notes. `All`/`Single`: `grader-ticket` per grader, normal grader task with
   `HARNESS_GRADER:<token>` and exact report path, aggregate findings, then `review` with notes.
   Report receipts, aggregate hash, verdict, and finding dispositions must match.
5. Partially Autonomous: pause the goal, call `approval`, then pass its exact question and labels
   `Approve change`, `Request revision`, `Pause` to `question`. Only runtime answers count.
6. Inspect status/diff/log, stage only scoped paths, commit atomically, then `checkpoint`. Exactly one
   scoped commit, clean project, and matching hashes are required before next `begin`. Failed rounds
    commit before fixes; corrections use `revision:true` within the round cap. After the cap, call
    `escalate` with a bounded reason and complete the exact registration question before continuing.
    No late mega-commit.

Supported mutations are schema-validated `create_mesh` (`cube`, `uv_sphere`, `plane`, `cylinder`),
`transform`, `material`, `create_light`, `create_camera`, `set_camera`, `render_settings`, and
`delete_object`. Raw `execute_blender_code`, `import_asset`, and `generate_3d` are blocked. Unsupported
work stops until reviewed tooling supports it; arbitrary Python is not a fallback.

After compaction/restart, recover through `status`. Completion requires a clean checkpoint and final
applicable `PASS` with inspected sealed render. Runtime uses a conservative two-round cap; a third
needs explicit user escalation and re-registration handling, never a silent override.

State lives outside Git at `~/.local/state/blender-workflow-harness/<workspace-hash>`; agents must not
edit it. This is a same-user guard, not an OS sandbox. Manual Blender or external-shell edits invalidate
evidence; unrestricted same-user execution can bypass controls.

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

The main session is the orchestrator and owns all design decisions. Copy `config.example.json` to the
gitignored `config.json`, set the `blender_subagents.workers` model, provider, variant, and limits, then load
`blender-subagents`. Current workers perform bounded read-only inspection through `task`; orchestrator
owns harness operations. Raw execution and harness mutation tools remain denied until explicit
delegated-write assignment and reviewed tooling support exist. Workers stop at their budget and
return `BLOCKED` instead of deciding scope or design. Graders need no `blender_workflow` permission;
the plugin binds actual children by parent/task token and runtime model metadata.

## Reviews

Graders are independent, read-only subagents that check saved work against confirmed requirements.
Configure models and reasoning variants in `blender_subagents.graders.graders[]`; each project records `Off`,
`All`, or `Single` in `Documents/REVIEW.md`. Load `blender-project-grading` for evidence capture,
timestamped round folders under `Documents/Reviews/`, dispositions, re-review, and bounds. Review
reports and manifests are committed; only preview evidence and temp files are ignored. The orchestrator
still inspects every change with `look` and owns the final verdict.

Round names must be generated at creation: `R<NN>-<yyyyMMddTHHmmssZ>`, using the next project-wide
sequence and current UTC time. Never copy an example timestamp or reuse a round folder. Missing or
disabled grader config blocks production when the project selected `All` or `Single`; `Off` remains
orchestrator self-review. Model/provider/variant overrides still require an explicit user request.

Both roles belong under `blender_subagents`: `workers` holds the writer configuration and `graders`
holds the review switch, limits, and roster. For older local configs, move the worker fields into
`blender_subagents.workers` and the former top-level grader section into `blender_subagents.graders`.
Preserve all existing values; leave an absent role unconfigured. Mixed legacy and nested layouts are
invalid and must be resolved before delegation.

## Tooling checks

Run the maintenance regression suite from the workspace root:

```powershell
python -B -m unittest discover -s tools -p "test_*.py" -v
npm test --prefix tools/harness
```

Launcher and scaffold checks use isolated temporary workspaces and PowerShell. Bootstrap checks mock
`bpy`; no test launches Blender. Frontmatter and worker-config checks require PyYAML and report a skip
when it is unavailable. Live addon behavior, Kilo registration, and actual Blender startup need a
separate runtime check after Kilo reload. Passing static or mocked tests does not establish installed
runtime validation.

## Licence

MIT. See [`LICENSE`](LICENSE). The Blender MCP workflow guides under
`.kilo/skills/blender-mcp/references/` are adapted from `ahujasid/mcp-for-blender`; attribution and
the upstream MIT notice are in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
