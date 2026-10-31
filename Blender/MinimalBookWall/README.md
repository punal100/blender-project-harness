# MinimalBookWall

Status: In production
Last updated: 2026-10-31

## Purpose

A focused minimal modern interior scene showing a wall shelf of books, built as a single
well-composed still render.

## What this project is

A shelf-wall corner for portfolio or product presentation: neutral wall, light wood shelving, rows of
muted-colour books, one small plant, and soft warm interior light. The audience is a viewer evaluating
clean interior visualization and deliberate set dressing.

## Requirements

Confirmed scope and acceptance criteria: [`Documents/REQUIREMENTS.md`](Documents/REQUIREMENTS.md).

- Minimal modern corner with a wall-mounted bookshelf and several rows of books.
- Books vary in height, width, and muted colour; one small plant adds depth.
- Single three-quarter camera; one 16:9 still render, 1920x1080 minimum.
- No external assets, no animation, no additional large furniture.

## Visual direction

- Style: minimal modern, clean geometry, restrained detail.
- Mood / references: quiet, calm, architectural; natural daylight interior photography.
- Colour and lighting: warm neutral walls, light wood, muted book spines, soft shadows.
- Camera / framing: three-quarter corner view, shelf and books clearly readable, breathing room.
- Scale and units: metric, real-world shelf and book dimensions.

## Deliverables

- Main Blender file: `minimalbookwall.blend` (planned at project root until first save)
- Final renders: `renders/final/`
- Exports: `exports/`
- Documentation: `Documents/`
- External assets: `assets/external/`

## Project structure

```text
MinimalBookWall/
  README.md
  minimalbookwall.blend
  .gitignore
  Documents/
    README.md
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
  logs/
  backups/
```

## Blender

- MCP port: owned by the workspace root `.kilo/kilo.jsonc`.
- Launch and stop with `blender_workflow` `launch`/`stop`; never invoke Blender from the shell.
- Each launch writes `logs/blender-<timestamp>.log`; `logs/` is ignored.
- Main file: `minimalbookwall.blend` in the project root. Verify MCP scene settings report that exact
  path before production edits; replace the planned status after verification.
- Keep external paths relative (`//assets/...`); do not use absolute paths.
- Only one Blender project spawned by this workspace may be open at a time.

## Workflow

- Autonomy mode: Fully Autonomous, recorded in [`Documents/WORKFLOW.md`](Documents/WORKFLOW.md).
- Review mode: All, recorded in [`Documents/REVIEW.md`](Documents/REVIEW.md); rounds live in
  [`Documents/Reviews/`](Documents/Reviews/README.md).
- Work proceeds in bounded harness changes: save, seal, inspect the returned render with `look`,
  grade, commit, checkpoint.

## External assets

See [`Documents/ASSETS.md`](Documents/ASSETS.md) and [`assets/external/README.md`](assets/external/README.md).

- No external assets. All geometry and materials are authored in Blender.

## Goals

Goal prompts live in [`Documents/Goals/`](Documents/Goals/). Multiple goals are allowed.

- [`01-project-brief.md`](Documents/Goals/01-project-brief.md)

## References

- [`Documents/References/README.md`](Documents/References/README.md)
- No external references collected; direction comes from the confirmed requirements.

## Open questions

- None.

## Next steps

- Launch Blender, save the bootstrap scene, then build the room shell, shelf, books, plant, lighting,
  and camera in bounded changes.
- Render, seal, inspect, grade, and update documents to the delivered state.
