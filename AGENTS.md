# AGENTS.md — Blender Project Collection

Binding rules for every session and subagent. Load the matching skill before doing the work it covers.

## Workspace

- Run every Kilo session from this workspace root. Do not open project folders as separate workspaces.
- Projects live under `Blender/<ProjectName>/`. Scaffold with `.\new-blender-project.cmd`; do not invent another layout.
- `.kilo/kilo.jsonc` owns the single MCP port. Do not create per-project Kilo configs.
- Only one Blender instance spawned by this workspace may run at a time. One writer per instance; parallel read-only inspection is allowed.
- Never launch `blender.exe` directly. Use `.\start-blender.cmd "Blender\<Project>"`; it opens a log terminal and writes to the project's ignored `logs/` folder.

## Goal

- Before planning, reading beyond this file and the matching skill, or changing any file/scene: load `blender-project-goal`, write `Blender/<Project>/Documents/Goals/NN-<slug>.md`, then call `goal(action="start", objective=<the full prompt text>)`.
- Resume existing work with `goal(action="resume")`.
- Pure read-only questions are exempt. This is a design workspace: no `PLAN/`, plan-check, or verifier records.

## Working

- Save the `.blend` at least every few turns. Commit project files with git after a major step, multi-turn milestone, or before risky work.
- Visual verification is mandatory. After every scene, material, lighting, or camera change, inspect the result with `look`; code output alone is not proof. Do not report done until you have seen it.
- Keep `README.md`, `Documents/ASSETS.md`, and `Documents/DECISIONS.md` current.
- Use relative paths from the `.blend` (`//assets/...`).
- Keep logs, backups, caches, WIP renders, and non-redistributable assets out of commits.

## Launch

- Verify with `blender_get_addon_status` and `blender_get_scene_info(fields=["settings"])` before editing.
- Never use `--background` or `--factory-startup`. Close the current Blender before switching projects.

## Skills

Detailed process lives in `.kilo/skills/`. Load only the skill needed for the task.

| Skill | Load it for |
|---|---|
| `blender-project-goal` | Mandatory first step for every work request; goal prompt and `/goal` start. |
| `blender-project-scaffold` | Project structure and creating a new project under `Blender/`. |
| `blender-project-readme` | Creating or updating a project README. |
| `blender-assets` | Adding, importing, linking, packing, licensing, or delivering assets. |
| `blender-mcp` | Operating Blender through MCP: scene inspection, modeling, materials, rendering. |

## Done

A goal is complete only when its acceptance checks pass, the scene is saved, a review render exists
and was inspected with `look`, docs are current, and the goal prompt is recorded.
