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

- Main Blender file: `{{PROJECT_SLUG}}.blend` (project root)
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
  logs/
  backups/
```

## Blender

- MCP port: owned by the workspace root `.kilo/kilo.jsonc`.
- Workflow mode: [`Documents/WORKFLOW.md`](Documents/WORKFLOW.md), selected before launch and
  re-confirmed only when returning to a paused project.
- Launch from the workspace root with the validated launcher:
  `.\tools\start-blender.cmd "Blender\{{PROJECT_NAME}}"`
- The launcher requires confirmed requirements and selected workflow records, keeps the `.blend`
  inside this project, reads the workspace MCP port, and rejects conflicting workspace instances.
- Each launch opens a log terminal and writes to `logs/blender-<timestamp>.log`; `logs/` is ignored.
- Main file: save the first scene as `{{PROJECT_SLUG}}.blend` in the project root.
- Keep external paths relative (`//assets/...`); do not use absolute paths.
- Only one Blender project spawned by this workspace may be open at a time. Close the current one
  before opening another.

## External assets

See [`Documents/ASSETS.md`](Documents/ASSETS.md) and [`assets/external/README.md`](assets/external/README.md).

- No external assets yet. Replace this line with a summary when assets are added.

## Goals

Goal prompts live in [`Documents/Goals/`](Documents/Goals/). Multiple goals are allowed.

- [`01-project-brief.md`](Documents/Goals/01-project-brief.md)

## References

- [`Documents/References/README.md`](Documents/References/README.md)
- Add links, moodboards, and source references here.

## Open questions

- [ ] Replace with unknown requirements or decisions.

## Next steps

- [ ] Record confirmed requirements and select the workflow mode before launch.
- [ ] Fill this README and the project brief.
- [ ] Collect references and external assets.
- [ ] Build the scene and render a first review.
