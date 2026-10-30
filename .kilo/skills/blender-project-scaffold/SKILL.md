---
name: blender-project-scaffold
description: Use when creating a new Blender project under the workspace Blender folder. Creates the standard README, Documents, Goals, asset folders, and .gitignore.
---

# Blender Project Scaffold

Create new projects from `templates/project` inside this skill. Do not invent a different folder
layout.

## Create

From the workspace root:

```powershell
.\new-blender-project.cmd -Name "ProjectName" -Description "What it is" -Goal "First design request" -GoalTitle "Initial Brief"
```

The script:

- validates the folder name and builds a slug;
- creates `Blender/<ProjectName>/`;
- copies `templates/project`;
- replaces `{{PROJECT_NAME}}`, `{{PROJECT_SLUG}}`, `{{DATE}}`, `{{DESCRIPTION}}`, `{{GOAL}}`,
  and `{{GOAL_TITLE}}`;
- leaves the main `.blend` for the first Blender session.

Use `-DryRun` to preview. `-Start` launches Blender after creation.

If the script cannot run, copy `templates/project` manually and replace the same tokens.

## After scaffold

1. Fill `README.md` with `blender-project-readme`.
2. Fill `Documents/Goals/01-project-brief.md` with `blender-project-goal`; add more goals as
   needed.
3. Register external assets with `blender-assets`.
4. Stay in the workspace-root Kilo session; project configs are not used.
5. From the workspace root run `.\start-blender.cmd "Blender\<ProjectName>"`.
6. Use the live log terminal; the launcher writes the same output to `logs/` (ignored).
7. Save the main scene as `<slug>.blend` at the project root.

## Rules

- The workspace owns one MCP port in the root `.kilo/kilo.jsonc`.
- Only one Blender project spawned by this workspace may be open at a time.
- Do not create a project-local `.kilo/kilo.jsonc`; the root config owns the MCP.
- Do not copy another project's `.blend`, assets, or Documents; start clean.
- Do not create `PLAN/`, `PLAN/product/`, or coding plan-check/verifier records. Goals replace
  planning for this workspace.
- Keep project documents under `Documents/`.
- Never edit the skill template directly for a specific project; create a named copy with the
  script.
