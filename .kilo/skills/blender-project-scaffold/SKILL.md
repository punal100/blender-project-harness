---
name: blender-project-scaffold
description: Use when creating a new Blender project under the workspace Blender folder. Runs the harness-owned scaffold command and bootstrap sequence.
---

# Blender Project Scaffold

The harness scaffold command is the only project creator. Do not invent, copy, or reconstruct a
layout. Requirements must be confirmed and workflow and review modes selected before scaffolding.
Complete those in ordinary chat; no `/goal-blender` mission starts before scaffold, records, commit,
and registration.

## Create

```powershell
node .kilo/blender-project-harness/tools/harness/cli.mjs scaffold --name "ProjectName" --description "What it is" --goal "First design request" --goal-title "Initial Brief"
```

The command validates the name, builds a slug, copies the template, and replaces project tokens. Use
`--dry-run` to preview. A fresh scaffold cannot start Blender. If the command fails, stop and report
the exact error; do not copy the template manually.

## Template ownership

`.kilo/blender-project-harness/tools/harness/templates/project` is authoritative. `scaffold.mjs`
copies it and renders project tokens. Do not duplicate the tree in documentation; use the command,
`--dry-run`, or the template itself when exact contents matter.

## Bootstrap

1. Create or update `README.md`, `Documents/REQUIREMENTS.md`, `Documents/WORKFLOW.md`,
   `Documents/REVIEW.md`, `Documents/ASSETS.md`, `Documents/DECISIONS.md`,
   `Documents/TASKSTRACKER.md`, the `Documents/Tasks/` index, and the filled goal with
   `bootstrap-document`. Use `capabilities.documentFormats`; malformed documents are rejected.
2. Commit the exact scaffold with `bootstrap-commit`. It accepts only documentation and metadata,
   never `.blend`, renders, evidence, or asset binaries.
3. Call `prepare {project,goal,scene}`; pass its exact question and labels to `question`. Only the
   runtime answer registers.
4. Start or resume the mission with `goal_blender {action:"start"}` or `/goal-blender start`. End the
   turn.
5. Launch with `blender_workflow` `launch`; stop with `stop`. Never invoke Blender from the shell.
6. Save the first scene through one bounded `begin` and ticketed `save` to the declared project-root
   `.blend`. Verify the path, `commit`, and `checkpoint`. The bootstrap save is not reviewable: never
   seal, render, or grade it.
7. Run every later change through `blender-workflow-harness`.

## Rules

- Do not scaffold before requirements are confirmed and both mode answers are collected.
- `.kilo/kilo.jsonc` owns the single MCP port. Do not create a project-local Kilo config.
- Do not copy another project's `.blend`, assets, or documents; start clean.
- Do not create `PLAN/`, plan-check, or verifier records. Goals replace planning.
- Keep project documents under `Documents/`.
- Keep logs, backups, caches, WIP renders, and non-redistributable assets out of commits.
- Never edit the harness template for a specific project; create a named copy with the command.
