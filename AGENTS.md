# AGENTS.md — Blender Project Collection

Binding rules for every session and subagent. They take precedence over convenience, prior habit, and
conflicting skill guidance. Load the matching skill before doing the work it covers.

## 1. Workspace model

- Every Kilo session runs from this workspace root. Do not open individual project folders as
  separate workspaces.
- Blender projects live under `Blender/<ProjectName>/`. The root stays uncluttered.
- The workspace owns one MCP port in `.kilo/kilo.jsonc` as
  `mcp.blender.environment.BLENDER_PORT`.
- Only one Blender instance spawned by this workspace may be open at a time. Close the current
  project before starting another.
- Do not create per-project `.kilo/kilo.jsonc` files. The root config owns the MCP.
- One writer per Blender instance. Parallel read-only inspection is allowed.
- The global `blender` MCP is disabled. Enable it only through this workspace's local config.

## 2. Mandatory goal prompt

Every work request starts a session goal before planning, reading beyond this file and the matching
skill, or changing any file or scene.

1. Load `blender-project-goal`.
2. Write or update the goal prompt in `Blender/<Project>/Documents/Goals/NN-<slug>.md`.
3. Call `goal(action="start", objective=<the full prompt text>)` immediately.
4. If resuming existing work, call `goal(action="resume")`.

The only exception is a pure read-only question or explanation that produces no plan, no file, and no
scene change.

This is a design workspace. Do not create `PLAN/`, `PLAN/product/`, plan-check, or verifier records.
Multiple goals per project are allowed; one file per goal.

## 3. Mandatory project structure

```text
Blender/
  README.md                  # collection guide, not a Blender project
  ProjectName/
    README.md                # requirements, purpose, assets, deliverables
    ProjectName.blend        # authoritative scene
    .gitignore
    Documents/
      README.md
      ASSETS.md              # external asset register
      DECISIONS.md
      Goals/                 # one /goal prompt per goal
      References/
    assets/
      external/              # third-party assets + SOURCE.md
      textures/
      hdri/
      models/
      audio/
    renders/
      final/                 # tracked review renders
      wip/                   # ignored work in progress
    exports/                 # final interchange files
    scenes/                  # extra scenes/variants
    scripts/                 # project-specific Blender scripts
    logs/                    # runtime logs, ignored
    backups/                 # local snapshots, ignored
```

- New project: load `blender-project-scaffold` and run `.\new-blender-project.cmd` from the
  workspace root. It creates `Blender/<ProjectName>/`; do not hand-create a different layout.
- README: load `blender-project-readme`. It must state the purpose, requirements, visual direction,
  deliverables, structure, workspace port, external assets, and goals.
- External assets: load `blender-assets`. Register every third-party asset in
  `Documents/ASSETS.md`; store it at `assets/external/<source>/<asset>/` with `SOURCE.md` and the
  licence. If a project has no external assets, say so in the README and asset register.
- Use relative paths from the `.blend` file (`//assets/...`). Do not leave absolute paths.
- Keep documents under `Documents/`; do not scatter notes across the project.

## 4. Launch and ports

- Use `start-blender.cmd` or `start-blender.ps1` from the workspace root. Never launch `blender.exe`
  directly.
- `start-blender.cmd --batch Blender\<Project>` forces the pure batch launcher when PowerShell is
  unavailable.
- Each launch opens a live log terminal and writes the same output to
  `Blender/<Project>/logs/blender-<timestamp>.log`. The `logs/` folder is ignored; never commit it.
- The launcher discovers Blender without a hardcoded path, reads the workspace port, sets
  `Scene.blendermcp_port`, starts the addon server, and refuses a second instance or a busy port.
- It writes `.kilo/blender.lock.json` at the workspace root. This file is runtime state; never edit
  or commit it.
- The batch fallback relies on the port guard instead of the lock file.
- After connecting, call `blender_get_addon_status` and verify the open file with
  `blender_get_scene_info(fields=["settings"])` before editing.
- Never use `--background` or `--factory-startup`. When switching projects, stop Blender first and
  launch the next one through the root launcher.

## 5. Design delivery

- Work in small steps and verify every visual change with `look`.
- Save the scene and produce a review render in `renders/final/` before calling a goal complete.
- Update `README.md`, `Documents/ASSETS.md`, and `Documents/DECISIONS.md` when scope, assets, or
  visual direction changes.
- Use Context7 or web search when Blender version-specific behavior matters; record the finding in
  `Documents/DECISIONS.md` or the goal.
- Do not commit backups, caches, work-in-progress renders, external binaries that cannot be
  redistributed, or runtime locks.

## 6. Skills

Detailed process lives in `.kilo/skills/`. Load only the skill needed for the task.

| Skill | Load it for |
|---|---|
| `blender-project-goal` | Mandatory first step for every work request; goal prompt and `/goal` start. |
| `blender-project-scaffold` | Creating a new project under `Blender/` and its structure. |
| `blender-project-readme` | Creating or updating a project README. |
| `blender-assets` | Adding, importing, linking, packing, licensing, or delivering assets. |
| `blender-mcp` | Operating Blender through MCP: scene inspection, modeling, materials, rendering. |

## 7. Definition of Done

A goal is complete only when its acceptance checks pass, the scene is saved, a review render exists
and has been inspected, the README and asset register are current, no external file is missing, and
the goal prompt is recorded in `Blender/<Project>/Documents/Goals/`.
