# AGENTS.md — Blender Project Collection

These rules are mandatory within their stated scope. Treat `must`, `required`, and `stop` literally.
Do not bypass an unmet gate. Examples and reference values are not project requirements; confirmed
user instructions control design and scope.

## Workspace

- Projects live under `Blender/<ProjectName>/`. Scaffold with
  `node tools/harness/cli.mjs scaffold --name "ProjectName"`; do not invent another layout.
- Keep shared tooling in `tools/`; do not add scripts or project files at the workspace root.
- `.kilo/kilo.jsonc` owns the single MCP port. Do not create per-project Kilo configs.
- Only one Blender instance spawned by this workspace may run at a time. One writer per instance;
  parallel read-only inspection is allowed.
- Launch and stop Blender only through `blender_workflow` `launch`/`stop`. Never invoke `blender.exe`
  or a legacy launch script from the shell.
- Workflow state lives outside the repository at
  `~/.local/state/blender-workflow-harness/<workspace-hash>` and is not editable through an agent.
  The harness is a same-user guard, not an OS sandbox; manual Blender or external-shell edits
  invalidate captured evidence.
- This is a design workspace: do not create `PLAN/`, plan-check, or verifier records. Tooling tests
  are allowed under `tools/`.

## Production gates

- Read `.kilo/skills/blender-project-goal/SKILL.md` for Blender project work. Resume an existing goal
  before production. New projects must complete requirements, workflow selection, review-mode
  selection, and scaffolding in ordinary chat before the goal starts.
- Requirements confirmation, mode selection, and scaffolding are ordinary-chat steps. Kilo removes
  `question` while a goal is active, so never start a goal to ask questions or run discovery.
- Requirements may change only after explicit user confirmation; update `Documents/REQUIREMENTS.md`
  and its change log, then the goal and docs.
- On every new project and return to a paused project, confirm autonomy mode via
  `.kilo/skills/blender-project-workflow/SKILL.md` and review mode via
  `.kilo/skills/blender-project-grading/SKILL.md`. Store both records before start/resume. Routine
  approval pauses within the same task do not require mode reselection.
- In Partially Autonomous mode, inspect every meaningful change and obtain approval before
  continuing. Never record a confirmation, directive, or approval the user did not give. If a
  question cannot be asked, pause or stop instead of self-authorizing.
- Pure read-only questions and workspace maintenance do not require a goal, project records, or a
  review render. Do not launch or modify Blender for maintenance unless separately requested.

## Workflow harness

Read `.kilo/skills/blender-workflow-harness/SKILL.md` before any production `blender_workflow`
action. It owns registration, the bootstrap write window, launch/stop, bounded changes, operation
tickets, seal, review handoff, approval, checkpoint, escalation, and status recovery.

- Production uses orchestrator-only `blender_workflow` operations. Raw `execute_blender_code`,
  `import_asset`, `generate_3d`, and arbitrary Python are blocked; unsupported operations stop until
  tooling is reviewed and extended.
- Registration requires the exact runtime question and answer. Never create approved JSON,
  self-confirm registration, or answer a challenge for the user.
- Keep one bounded logical change open per project, at most 20 apply operations before checkpoint
  (hard cap 40) and 15 minutes. Recovery `save` and `seal` remain allowed after the apply budget.
- Seal only meaningful saved scene changes. The bootstrap save is not a reviewable visual state:
  commit it and close it with `checkpoint`; never seal, render, or grade the initial empty scene.
- The orchestrator's `look` inspection is mandatory. After every scene, material, lighting, or
  camera change, inspect the result with `look`; code output alone is not proof.
- `revision:true` stays within the configured `max_rounds` cap. Exhausting the cap needs explicit
  user escalation and re-registration handling; never silently override it.
- `status` is the recovery entry point after compaction or restart. Goal completion requires a clean
  checkpoint, final applicable `PASS` with inspected render, and current records.

## Reviews and subagents

- Run graders only when review mode is `All` or `Single` and the grader config is enabled. If a
  required grader is missing or disabled, stop production; never silently downgrade to self-review.
- Grade every meaningful saved visual state. Read reports and record every finding's disposition in
  `Documents/Reviews/<round>/REVIEW.md`. Graders are read-only; each writes only its assigned
  `REPORT.md` and never reads peer reports.
- Commit each review round's `REVIEW.md`, `manifest.json`, reports, and index entry atomically before
  ending the turn, including failed rounds and blocked goals. Never leave a completed round
  uncommitted.
- Read `.kilo/skills/blender-subagents/SKILL.md` before delegating. Validate `config.json` before
  production delegation; never guess or substitute a model. Spawn `blender-worker` with `task`;
  do not create Agent Manager sessions.
- Workers are inspection-only unless a reviewed assignment grants writes. Graders are read-only and
  may run in parallel when configured. Allow one Blender writer at a time.

## Working

- Save the authoritative `.blend` through ticketed `save` after every meaningful scene change and
  before risky work or handoff. Seal and review each bounded change, obtain required approval, then
  inspect status, diff, and recent history. Commit atomically: one exact scoped change per commit,
  then `checkpoint` before the next `begin`. Never defer work into an end-of-task mega-commit.
- Keep `README.md`, `Documents/REQUIREMENTS.md`, `Documents/WORKFLOW.md`, `Documents/REVIEW.md`,
  `Documents/ASSETS.md`, and `Documents/DECISIONS.md` current.
- For Blender or library APIs, check Context7 and official docs first. If docs are missing,
  version-mismatched, or unclear, web-search official docs, source, and community reports; verify
  against the live Blender version with a minimal test. Never invent API behavior.
- Use relative paths from the `.blend` (`//assets/...`). Before committing or delivering a `.blend`,
  check embedded and packed third-party data too; ignored source binaries do not prevent them from
  being embedded in a tracked scene.
- Keep logs, backups, caches, WIP renders, and non-redistributable assets out of commits.

## Skills

Read the matching `.kilo/skills/<skill>/SKILL.md` before planning or touching any Blender file or
scene. Do not skip this because the task looks simple. The `skill` tool may not list workspace-local
skills; if it does not, read the file directly.

| Skill | Load it for |
|---|---|
| `blender-project-goal` | Blender project goals, bootstrap order, start/resume lifecycle; excludes maintenance and read-only questions. |
| `blender-workflow-harness` | Registration, bootstrap write window, launch/stop, bounded changes, tickets, seal, checkpoint, escalation, status recovery. |
| `blender-subagents` | Orchestrator delegation to bounded Blender workers and graders, model config, time limits, and stop conditions. |
| `blender-project-grading` | Review modes, grader config, evidence capture, round folders, aggregation, and re-review. |
| `blender-project-requirements` | New-project requirements discussion, confirmation, and requirement changes. |
| `blender-project-workflow` | Autonomy mode selection, resume checks, and partial-mode approval gates. |
| `blender-project-scaffold` | Project structure and creating a new project under `Blender/`. |
| `blender-project-readme` | Creating or updating a project README. |
| `blender-assets` | Adding, importing, linking, packing, licensing, or delivering assets. |
| `blender-mcp` | Operating Blender through MCP: scene inspection, modeling, materials, rendering. |

## Done

For Blender production work, a goal is not complete until its acceptance checks pass, the scene is
saved, a review render exists and was inspected with `look`, requirements, workflow, and review mode
are current, all required grading has a final applicable `PASS` (or orchestrator self-review is
recorded when mode is `Off`), no genuine blocker or major remains unresolved, docs are current, and
the goal prompt is recorded. The completion hook also requires a clean `checkpoint`, final
applicable `PASS`, and the sealed render's successful `blender_look` receipt.

For workspace maintenance, run the relevant format, tooling, and diff checks. Report runtime checks
that could not run; do not invent scene verification or require a Blender project to review tooling.
