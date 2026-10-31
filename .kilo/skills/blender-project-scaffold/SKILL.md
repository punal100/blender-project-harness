---
name: blender-project-scaffold
description: Use when creating a new Blender project under the workspace Blender folder. Creates the standard README, requirements, workflow, review, Documents, Goals, asset folders, and .gitignore.
---

# Blender Project Scaffold

Create new projects from `templates/project` inside this skill. Do not invent a different folder
layout.

Requirements must be confirmed, the workflow mode selected, and the review mode chosen before you run
this. If they are not, read `blender-project-requirements`, `blender-project-workflow`, and
`blender-project-grading` and finish them in ordinary chat first; Kilo removes `question` during an
active goal, so no goal may start yet. Collect exact answers before scaffolding, then persist all
three records in the draft documents before filling and starting the goal or launching. Do not reask
the modes after scaffolding. Maintenance tests may scaffold isolated fixtures without confirmation,
but must never launch Blender.

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
scaffold cannot contain completed confirmation records. Launch separately after completing them,
committing scaffold documents and the filled goal, and finishing runtime harness registration.

If the script cannot run, stop scaffolding and report the exact error. Fix the tooling before retrying;
do not bypass its validation by copying the template manually.

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
  logs/        # ignored runtime logs
  backups/     # ignored snapshots
```

The template is authoritative. Do not add, rename, or omit top-level folders without updating it.

## After scaffold

Steps 1-5 run inside the bootstrap write window: the scaffold documents below are the only
`Blender/<Name>/` writes allowed before registration. Scene, asset, render, and evidence paths stay
blocked. A denial means a lifecycle step is missing; never work around it with shell redirection or
temp-file copies.

1. Write the confirmed requirements to `Documents/REQUIREMENTS.md`; set `Status: Confirmed` and
   record `Confirmed: YYYY-MM-DD` and `Confirmation: <exact response and scope>`.
2. Persist the already collected exact workflow answer in `Documents/WORKFLOW.md` and its change log.
3. Persist the already collected exact review answer in `Documents/REVIEW.md` and its change log.
   `Off`, `All`, and `Single` are valid; `Unset` blocks production. Do not invent confirmation text.
4. Fill `README.md` with `blender-project-readme`; mark the main `.blend` path explicitly planned
   until the first save. Do not require a live Blender connection during bootstrap.
5. Fill `Documents/Goals/01-project-brief.md` with `blender-project-goal`. Inspect `git status`,
   `git diff`, and `git log --oneline -10`; stage only exact scaffold paths and commit completed
   documents and the filled goal before launch. Do not include unrelated files.
6. Call `blender_workflow` `prepare` with only
   `{project:"Blender/Name",goal:"Documents/Goals/NN-slug.md",scene:"name.blend"}` as its JSON-string
   payload. Pass its exact registration question and labels to `question` as one single-select
   question; omit `custom`/`multiple` or set them false where the tool exposes them. Only genuine
   runtime answers grant registration. Never create approved JSON. Then start the goal with the entire filled prompt; a successful goal call ends the
   turn. Continue on the next goal turn and inspect harness `status` before launch. Register confirmed
   asset metadata with `blender-assets`; imports/generation stay blocked until reviewed tooling
   supports them, even when launch preflight passes.
7. From the workspace root run `.\tools\start-blender.cmd "Blender\<ProjectName>"`.
8. Use the live log terminal; the launcher writes the same output to `logs/` (ignored).
9. Verify addon and scene settings. For a new unsaved scene, open a bounded harness `begin` and use
   ticketed `save` as `<slug>.blend` at the project root before production edits, then verify that exact
   path and update README from planned to saved. Stop on connection, addon, or file mismatch. Follow
   `AGENTS.md`: each change seals immutable evidence, inspects its returned final PNG, completes
   review/approval, and commits exact scoped paths before `checkpoint` and the next `begin`. Failed
   rounds commit before fixes; no late mega-commit.

## Rules

- Do not scaffold before requirements are confirmed and workflow and review answers are collected.
- The workspace owns one MCP port in the root `.kilo/kilo.jsonc`.
- Only one Blender project spawned by this workspace may be open at a time.
- Do not create a project-local `.kilo/kilo.jsonc`; the root config owns the MCP.
- Do not copy another project's `.blend`, assets, or Documents; start clean.
- Do not create `PLAN/`, `PLAN/product/`, or coding plan-check/verifier records. Goals replace
  planning for this workspace.
- Keep project documents under `Documents/`.
- Never edit the skill template directly for a specific project; create a named copy with the
  script.
