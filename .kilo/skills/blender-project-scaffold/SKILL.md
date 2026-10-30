---
name: blender-project-scaffold
description: Use when creating a new Blender project under the workspace Blender folder. Creates the standard README, requirements, workflow, Documents, Goals, asset folders, and .gitignore.
---

# Blender Project Scaffold

Create new projects from `templates/project` inside this skill. Do not invent a different folder
layout.

Requirements must be confirmed before you run this. If they are not, read
`blender-project-requirements` and complete confirmation first. Scaffolding leaves draft documents;
record confirmation and workflow before launching. Maintenance tests may scaffold isolated fixtures
without project confirmation, but must never launch Blender.

## Create

From the workspace root:

```powershell
.\tools\new-blender-project.cmd -Name "ProjectName" -Description "What it is" -Goal "First design request" -GoalTitle "Initial Brief"
```

The script:

- validates the folder name and builds a slug;
- creates `Blender/<ProjectName>/`;
- copies `templates/project`;
- replaces `{{PROJECT_NAME}}`, `{{PROJECT_SLUG}}`, `{{DATE}}`, `{{DESCRIPTION}}`, `{{GOAL}}`,
  and `{{GOAL_TITLE}}`;
- leaves the main `.blend` for the first Blender session.

Use `-DryRun` to preview without writing. `-Start` must be rejected before creating files: a fresh
scaffold cannot contain completed confirmation records. Launch separately after completing them.

If the script cannot run, copy `templates/project` manually and replace the same tokens.

## Project structure

```text
Blender/<Project>/
  README.md
  <slug>.blend
  .gitignore
  Documents/
    REQUIREMENTS.md
    WORKFLOW.md
    ASSETS.md
    DECISIONS.md
    Goals/
    References/
  assets/
    external/
    textures/
    hdri/
    models/
    audio/
  renders/
    final/
    wip/
  exports/
  scenes/
  scripts/
  logs/        # ignored runtime logs
  backups/     # ignored snapshots
```

The template is authoritative. Do not add, rename, or omit top-level folders without updating it.

## After scaffold

1. Write the confirmed requirements to `Documents/REQUIREMENTS.md`; set `Status: Confirmed` and
   record `Confirmed: YYYY-MM-DD` and `Confirmation: <exact response and scope>`.
2. Ask the workflow mode with `blender-project-workflow`; write `Documents/WORKFLOW.md`.
3. Fill `README.md` with `blender-project-readme`.
4. Fill `Documents/Goals/01-project-brief.md` with `blender-project-goal` and start it. A successful
   goal call ends the turn; continue the remaining steps on the next goal turn.
5. Register external assets with `blender-assets`.
6. From the workspace root run `.\tools\start-blender.cmd "Blender\<ProjectName>"`.
7. Use the live log terminal; the launcher writes the same output to `logs/` (ignored).
8. Save the main scene as `<slug>.blend` at the project root.

## Rules

- Do not scaffold before requirements are confirmed.
- The workspace owns one MCP port in the root `.kilo/kilo.jsonc`.
- Only one Blender project spawned by this workspace may be open at a time.
- Do not create a project-local `.kilo/kilo.jsonc`; the root config owns the MCP.
- Do not copy another project's `.blend`, assets, or Documents; start clean.
- Do not create `PLAN/`, `PLAN/product/`, or coding plan-check/verifier records. Goals replace
  planning for this workspace.
- Keep project documents under `Documents/`.
- Never edit the skill template directly for a specific project; create a named copy with the
  script.
