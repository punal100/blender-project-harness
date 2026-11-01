# {{PROJECT_NAME}}

Status: Draft
Last updated: {{DATE}}

## Purpose

{{DESCRIPTION}}

## What this project is

Describe the subject, the intended audience, and the visual result this project must deliver. Keep
this section short and concrete.

## Requirements

Confirmed scope and acceptance criteria: [`Documents/REQUIREMENTS.md`](Documents/REQUIREMENTS.md).

- [ ] Summarize the highest-priority confirmed requirements.

## Visual direction

- Style:
- Mood / references:
- Colour and lighting:
- Camera / framing:
- Scale and units:

## Deliverables

- Main Blender file: `{{PROJECT_SLUG}}.blend` (planned at project root until first save)
- Final renders: `renders/final/`
- Exports: `exports/`
- Documentation: `Documents/`
- External assets: `assets/external/`

## Project structure

```text
{{PROJECT_NAME}}/
  README.md
  {{PROJECT_SLUG}}.blend
  .gitignore
  Documents/
    README.md
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
  logs/
  backups/
```

## Blender

- MCP port: owned by the workspace root `.kilo/kilo.jsonc`.
- Launch and stop with `blender_workflow` `launch`/`stop`; never invoke Blender from the shell.
- Before launch, require confirmed requirements, selected workflow and review records, and an active
  filled goal. The harness validates project records, keeps the `.blend` inside this project, reads
  the workspace MCP port, records the instance outside the repository, and rejects conflicting
  workspace instances.
- Each launch writes `logs/blender-<timestamp>.log`; `logs/` is ignored.
- Main file: save the first scene as `{{PROJECT_SLUG}}.blend` in the project root. Before production
  edits, verify MCP scene settings report that exact path; then replace the planned status above.
- Keep external paths relative (`//assets/...`); do not use absolute paths.
- Only one Blender project spawned by this workspace may be open at a time. Close the current one
  before opening another.

## Workflow

- Record the selected autonomy mode in [`Documents/WORKFLOW.md`](Documents/WORKFLOW.md).
- Record review mode `Off`, `All`, or `Single` in [`Documents/REVIEW.md`](Documents/REVIEW.md);
  rounds live in [`Documents/Reviews/`](Documents/Reviews/README.md).
- Collect both answers after requirements confirmation and before scaffolding; persist their exact
  records after scaffolding and before filling and starting the goal. Launch only after that.
- After registration, workflow and review modes are frozen. A requested mode change stops production
  for explicit re-registration; routine approval, clarification, or manual-edit pauses retain them.
- In Partially Autonomous mode, the agent seals, inspects, completes required grading, and obtains
  approval or revision direction before the next reviewable change commits. In either mode, the agent
  manages goal handoffs and continuation; users provide inputs and decisions.
- Require the saved inspected review render, current documents, and final applicable `PASS` when
  grading is enabled before completion; no genuine unresolved blocker or major finding permits it.

## External assets

See [`Documents/ASSETS.md`](Documents/ASSETS.md) and [`assets/external/README.md`](assets/external/README.md).

- No external assets yet. Replace this line with a summary when assets are added.

## Goals

Goal prompts live in [`Documents/Goals/`](Documents/Goals/). Multiple goals are allowed.
Identify the active goal's actual path; use it for grading rather than assuming the first brief.

- [`01-project-brief.md`](Documents/Goals/01-project-brief.md)

## References

- [`Documents/References/README.md`](Documents/References/README.md)
- Add links, moodboards, and source references here.

## Open questions

- [ ] Replace with unknown requirements or decisions.

## Next steps

- [ ] Persist the exact confirmed requirements and workflow/review answers collected before scaffold.
- [ ] Fill this README and the active goal, then start the goal before launch.
- [ ] Collect references and external assets.
- [ ] Build the scene, save and inspect a review render, and complete applicable grading and approvals.
