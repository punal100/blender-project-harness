# AGENTS.md — Blender Project Collection

These rules are mandatory, not advisory. Every line is binding; treat `must`, `required`, and `stop` literally. Do not proceed, improvise, or substitute general knowledge when a gate is unmet.

## Workspace

- Projects live under `Blender/<ProjectName>/`. Scaffold with `.\tools\new-blender-project.cmd`; do not invent another layout.
- Keep shared tooling in `tools/`; do not add scripts or project files at the workspace root.
- `.kilo/kilo.jsonc` owns the single MCP port. Do not create per-project Kilo configs.
- Only one Blender instance spawned by this workspace may run at a time. One writer per instance; parallel read-only inspection is allowed.
- Never launch `blender.exe` directly. Use `.\tools\start-blender.cmd "Blender\<Project>"`; it opens a log terminal and writes to the project's ignored `logs/` folder.

## Session and goal

- On every new session or reset, call `goal(action="resume")` before any other work. If no goal is active, start one. Without an active goal, stop; do not read project files, plan, or touch Blender.
- Read `.kilo/skills/blender-project-goal/SKILL.md` before planning or changing any file/scene. Then write `Blender/<Project>/Documents/Goals/NN-<slug>.md` and call `goal(action="start", objective=<the full prompt text>)`.
- For a new project, start a requirements discovery goal first; write the project goal after requirements are confirmed and the project is scaffolded.
- If a goal is already active, a pure read-only question may be answered without a new goal. This is a design workspace: no `PLAN/`, plan-check, or verifier records.

## Requirements and workflow

- Before scaffolding or any Blender work on a new project, read `.kilo/skills/blender-project-requirements/SKILL.md`; discuss and confirm requirements with the user, then write `Documents/REQUIREMENTS.md`. Do not start until confirmed.
- Requirements may be added or changed at any time only after explicit user confirmation; update `Documents/REQUIREMENTS.md` and its change log, then update the goal and docs.
- On every new project and every resume, read `.kilo/skills/blender-project-workflow/SKILL.md` and ask the mode via `question`: Fully Autonomous or Partially Autonomous. Store it in `Documents/WORKFLOW.md`; the user may switch at any time.
- In Partially Autonomous mode, after every meaningful change or addition, save, inspect with `look`, summarize and recommend, then ask approval via `question` before continuing. If the user wants to modify manually, prepare the scene and wait for them to finish; inspect and confirm afterward.

## Working

- Save the `.blend` at least every few turns. Commit project files with git after a major step, multi-turn milestone, or before risky work.
- Visual verification is mandatory. After every scene, material, lighting, or camera change, inspect the result with `look`; code output alone is not proof. Do not report done until you have seen it.
- Keep `README.md`, `Documents/REQUIREMENTS.md`, `Documents/WORKFLOW.md`, `Documents/ASSETS.md`, and `Documents/DECISIONS.md` current.
- Use relative paths from the `.blend` (`//assets/...`).
- Keep logs, backups, caches, WIP renders, and non-redistributable assets out of commits.

## Launch

- Verify with `blender_get_addon_status` and `blender_get_scene_info(fields=["settings"])` before editing.
- Never use `--background` or `--factory-startup`. Close the current Blender before switching projects.

## Skills

Read the matching `.kilo/skills/<skill>/SKILL.md` before planning or touching any Blender file or scene. Do not skip this because the task looks simple. The `skill` tool may not list workspace-local skills; if it does not, read the file directly.

| Skill | Load it for |
|---|---|
| `blender-project-goal` | Mandatory first step for every session and work request; goal prompt and `/goal` start. |
| `blender-project-requirements` | New-project requirements discussion, confirmation, and requirement changes. |
| `blender-project-workflow` | Autonomy mode selection, resume checks, and partial-mode approval gates. |
| `blender-project-scaffold` | Project structure and creating a new project under `Blender/`. |
| `blender-project-readme` | Creating or updating a project README. |
| `blender-assets` | Adding, importing, linking, packing, licensing, or delivering assets. |
| `blender-mcp` | Operating Blender through MCP: scene inspection, modeling, materials, rendering. |

## Done

A goal is not complete until its acceptance checks pass, the scene is saved, a review render exists
and was inspected with `look`, requirements and workflow are current, docs are current, and the goal
prompt is recorded.
