# Cozy Retro Den

Status: Active — building
Last updated: 2026-11-01

## Purpose

Build one cozy, nostalgic interior still of an 1980s home computer den, authored procedurally in Blender and delivered as a wide three-quarter hero render.

## What this project is

A stylized-realism interior scene for viewers who want a warm, lived-in retro workspace. The computer desk is the focal point, supported by wood-panel walls, a night window, cluttered shelves, retro posters, a rug, and soft seating. The intended result is a single evening-lit image that feels inhabited rather than staged.

## Requirements

Confirmed scope and acceptance criteria: [`Documents/REQUIREMENTS.md`](Documents/REQUIREMENTS.md).

- 1980s home computer den with desk, CRT computer, wood-panel walls, night window, cluttered shelves, retro posters, rug, soft seating, and warm desk lamp.
- Stylized-realism materials and soft evening lighting; warm interior against cool window light.
- One wide three-quarter interior camera; consistent human scale and clean prop placement.
- Deliver one 1920x1080 PNG still; all geometry and materials procedural.

## Visual direction

- Style: stylized realism with clean, slightly idealized proportions and believable surface response.
- Mood / references: cozy 1980s home computer den; warm tungsten pool at the desk, cool blue window fill, lived-in clutter.
- Colour and lighting: walnut and beige base, orange/brown accents, warm lamp practicals, cool night rim from the window.
- Camera / framing: wide three-quarter interior view showing desk, wall, window, and seating context.
- Scale and units: metric, human-scale room and furniture; desk height about 0.75 m.

## Deliverables

- Main Blender file: `cozy-retro-den.blend` (saved at project root)
- Final renders: `renders/final/`
- Exports: `exports/` (none required)
- Documentation: `Documents/`
- External assets: none

## Project structure

```text
Cozy Retro Den/
  README.md
  cozy-retro-den.blend
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
- Main file: `cozy-retro-den.blend` at the project root, verified after the bootstrap save.
- Keep external paths relative (`//assets/...`); do not use absolute paths.
- Only one Blender project spawned by this workspace may be open at a time.

## Workflow

- Autonomy mode: Fully Autonomous — recorded in [`Documents/WORKFLOW.md`](Documents/WORKFLOW.md).
- Review mode: All — `visual`, `technical`, and `spec` graders; recorded in [`Documents/REVIEW.md`](Documents/REVIEW.md).
- Review rounds: [`Documents/Reviews/`](Documents/Reviews/README.md).
- Every meaningful saved change is committed as one scoped change and checkpointed before the next begins.

## External assets

See [`Documents/ASSETS.md`](Documents/ASSETS.md) and [`assets/external/README.md`](assets/external/README.md).

- None. The scene is built entirely from procedural geometry and generated materials.

## Goals

Goal prompts live in [`Documents/Goals/`](Documents/Goals/). Multiple goals are allowed.

- [`01-project-brief.md`](Documents/Goals/01-project-brief.md) — active.

## References

- [`Documents/References/README.md`](Documents/References/README.md)
- No external references collected yet.

## Open questions

- None.

## Next steps

- Launch Blender, bootstrap-save `cozy-retro-den.blend`, and verify the saved path.
- Block out the room shell, desk, and camera; inspect with `look`.
- Add the computer setup, props, materials, and evening lighting in bounded changes.
- Seal, grade, and commit each meaningful visual state; finish with the final render and `PASS`.
