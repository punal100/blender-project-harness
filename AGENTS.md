# AGENTS.md — Blender Project Collection

These rules are mandatory within their stated scope. Treat `must`, `required`, and `stop` literally. Do not bypass an unmet gate. Examples and reference values are not project requirements; confirmed user instructions control design and scope.

## Workspace

- Projects live under `Blender/<ProjectName>/`. Scaffold with `.\tools\new-blender-project.cmd`; do not invent another layout.
- Keep shared tooling in `tools/`; do not add scripts or project files at the workspace root.
- `.kilo/kilo.jsonc` owns the single MCP port. Do not create per-project Kilo configs.
- Only one Blender instance spawned by this workspace may run at a time. One writer per instance; parallel read-only inspection is allowed.
- Never launch `blender.exe` directly. Use `.\tools\start-blender.cmd "Blender\<Project>"`; it opens a log terminal and writes to the project's ignored `logs/` folder.

## Session and goal

- For Blender project work, read `.kilo/skills/blender-project-goal/SKILL.md` and resume the existing goal before production work. If none exists, start the requirements discovery or project goal as appropriate. Goal tools end the current turn: after a successful start or resume, give a short response and continue when the goal resumes.
- Reading the goal skill and project context, confirming requirements, selecting workflow, scaffolding after confirmation, and recording the goal are bootstrap steps. They must precede scene work; do not require an already-recorded project goal for these steps.
- Before production changes, write `Blender/<Project>/Documents/Goals/NN-<slug>.md` and call `goal(action="start", objective=<the full prompt text>)`. Resume an existing goal instead of duplicating it.
- For a new project, start a requirements discovery goal first; write the project goal after requirements are confirmed and the project is scaffolded.
- Pure read-only questions and workspace maintenance (rules, skills, agents, config, templates, tooling, and their tests) do not require a Blender goal, project requirements, workflow selection, or a review render. Do not launch or modify Blender during maintenance unless separately requested.
- This is a design workspace: do not create `PLAN/`, plan-check, or verifier records. Tooling tests are allowed under `tools/`.

## Requirements and workflow

- Before scaffolding or any Blender work on a new project, read `.kilo/skills/blender-project-requirements/SKILL.md` and obtain explicit requirements confirmation. Then scaffold and write `Documents/REQUIREMENTS.md` with confirmation evidence. Do not launch Blender before this record and the workflow mode are complete.
- During requirements, use web search when the domain, a term, a standard, a reference, or the user's request is ambiguous or open-ended. Combine research with user feedback, cite sources, and get explicit confirmation before turning findings into requirements.
- Requirements may be added or changed at any time only after explicit user confirmation; update `Documents/REQUIREMENTS.md` and its change log, then update the goal and docs.
- On every new project and every return to a paused Blender project, read `.kilo/skills/blender-project-workflow/SKILL.md` and confirm the mode via `question`: Fully Autonomous or Partially Autonomous. Store it in `Documents/WORKFLOW.md`; the user may switch at any time. Do not repeat this gate on automatic goal turns or after compaction within the same active task.
- In Partially Autonomous mode, after every meaningful change or addition, save, inspect with `look`, summarize and recommend, then ask approval via `question` before continuing. If the user wants to modify manually, prepare the scene and wait for them to finish; inspect and confirm afterward.

## Subagents

- The current session is the controller. It owns requirements, design, scope, acceptance, user communication, and commits. Read `.kilo/skills/blender-subagents/SKILL.md` before delegating.
- Read and validate the gitignored `config.json` for the worker provider, model, variant, and budgets. If missing, copy `config.example.json` without overwriting local settings and stop delegation until the user confirms it. Never guess or substitute a model; runtime tool restrictions still apply.
- Spawn `blender-worker` with `task`; do not create Agent Manager sessions. Allow one Blender writer at a time.
- Each task is one specific outcome with allowed objects/paths, acceptance checks, budget, stop conditions, and output contract. The worker never makes design decisions; it returns `BLOCKED` with options when one is needed.
- A worker must stop before starting more work at the configured time/step budget, configured failure limit (at most two), repeated API error, or scope/design/asset ambiguity. `steps` caps tool-call rounds; it does not interrupt running calls or enforce a wall-clock timeout. The controller independently inspects with `look`, decides, and obtains workflow approval when required.

## Working

- Save the authoritative `.blend` after every meaningful scene change and before risky work or handoff. Review git changes at each major milestone. Commit atomically and continuously: one logical, verified change per commit, staging only intended files after inspecting status, diff, and recent history. Commits are mandatory; never defer completed work into an end-of-task mega-commit.
- Visual verification is mandatory. After every scene, material, lighting, or camera change, inspect the result with `look`; code output alone is not proof. Do not report done until you have seen it.
- Keep `README.md`, `Documents/REQUIREMENTS.md`, `Documents/WORKFLOW.md`, `Documents/ASSETS.md`, and `Documents/DECISIONS.md` current.
- For Blender or library APIs, check Context7 and official docs first. If docs are missing, version-mismatched, or unclear, web-search official docs, source, and community reports; verify against the live Blender version with a minimal test. Never invent API behavior.
- Use relative paths from the `.blend` (`//assets/...`). Before committing or delivering a `.blend`, check embedded and packed third-party data too; ignored source binaries do not prevent them from being embedded in a tracked scene.
- Keep logs, backups, caches, WIP renders, and non-redistributable assets out of commits.

## Launch

- Verify with `blender_get_addon_status` and `blender_get_scene_info(fields=["settings"])` before editing. Stop on a connection, addon, or file mismatch. For a new unsaved scene, save it to the declared project `.blend` first, then verify that path before production edits.
- Never use `--background` or `--factory-startup`. Close the current Blender before switching projects.

## Skills

Read the matching `.kilo/skills/<skill>/SKILL.md` before planning or touching any Blender file or scene. Do not skip this because the task looks simple. The `skill` tool may not list workspace-local skills; if it does not, read the file directly.

| Skill | Load it for |
|---|---|
| `blender-project-goal` | Blender project goals, bootstrap order, start/resume lifecycle; excludes maintenance and read-only questions. |
| `blender-subagents` | Controller delegation to bounded Blender workers, model config, time limits, and stop conditions. |
| `blender-project-requirements` | New-project requirements discussion, confirmation, and requirement changes. |
| `blender-project-workflow` | Autonomy mode selection, resume checks, and partial-mode approval gates. |
| `blender-project-scaffold` | Project structure and creating a new project under `Blender/`. |
| `blender-project-readme` | Creating or updating a project README. |
| `blender-assets` | Adding, importing, linking, packing, licensing, or delivering assets. |
| `blender-mcp` | Operating Blender through MCP: scene inspection, modeling, materials, rendering. |

## Done

For Blender production work, a goal is not complete until its acceptance checks pass, the scene is saved, a review render exists
and was inspected with `look`, requirements and workflow are current, docs are current, and the goal
prompt is recorded.

For workspace maintenance, run the relevant format, tooling, and diff checks. Report runtime checks
that could not run; do not invent scene verification or require a Blender project to review tooling.
