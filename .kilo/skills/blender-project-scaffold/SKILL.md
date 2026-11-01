---
name: blender-project-scaffold
description: Use when creating a new Blender project under the workspace Blender folder. Creates the standard project structure and harness bootstrap path.
---

# Blender Project Scaffold

Create projects only from `templates/project` through the scaffold command. Do not invent a layout.

Requirements MUST be confirmed and workflow and review modes MUST be selected before scaffolding.
Complete those in ordinary chat; no goal starts before the scaffold, records, commit, and
registration are complete.

## Create

```powershell
node tools/harness/cli.mjs scaffold --name "ProjectName" --description "What it is" --goal "First design request" --goal-title "Initial Brief"
```

The command validates the name, builds a slug, copies the template, and replaces project tokens.
Use `--dry-run` to preview. A fresh scaffold cannot start Blender.

If the command fails, stop and report the exact error. Do not copy the template manually.

## Project structure

```text
Blender/<Project>/
  README.md
  <slug>.blend
  .gitignore
  Documents/
    REQUIREMENTS.md
    WORKFLOW.md
    REVIEW.md
    ASSETS.md
    DECISIONS.md
    TASKS.md
    Goals/
    Reviews/
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
  logs/        # ignored
  backups/     # ignored
```

The template is authoritative. Do not add, rename, or omit top-level folders without updating it.

## Bootstrap through the harness

1. Create or update `README.md`, `Documents/REQUIREMENTS.md`, `Documents/WORKFLOW.md`,
   `Documents/REVIEW.md`, `Documents/ASSETS.md`, `Documents/DECISIONS.md`,
   `Documents/TASKS.md`, and the filled goal with `bootstrap-document` `{project,path,content}`. Use
   `capabilities.documentFormats`; malformed documents are rejected.
2. Commit the exact scaffold with `bootstrap-commit` `{project,message}`. It accepts only
   documentation and metadata, never `.blend`, renders, evidence, or asset binaries.
3. Call `prepare` `{project,goal,scene}`. Pass its exact question and labels to `question`; only the
   runtime answer registers.
4. Start or resume the goal with the entire filled prompt. End the turn.
5. Launch with `blender_workflow` `launch` `{}`; stop with `stop` `{}`. NEVER invoke Blender from
   the shell.
6. Save the first scene through one bounded `begin` and ticketed `save` to the declared project-root
   `.blend`. Verify the path, `commit`, and `checkpoint`. The bootstrap save is not reviewable: NEVER
   seal, render, or grade it.
7. Run every later change through `blender-workflow-harness`.

## Rules

- Do not scaffold before requirements are confirmed and both mode answers are collected.
- `.kilo/kilo.jsonc` owns the single MCP port.
- Do not create a project-local Kilo config.
- Do not copy another project's `.blend`, assets, or documents; start clean.
- Do not create `PLAN/`, plan-check, or verifier records. Goals replace planning.
- Keep project documents under `Documents/`.
- Keep logs, backups, caches, WIP renders, and non-redistributable assets out of commits.
- Never edit the skill template for a specific project; create a named copy with the command.
