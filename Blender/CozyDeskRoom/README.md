# CozyDeskRoom

Status: Complete
Last updated: 2026-11-03

## Purpose

A cozy evening study corner with a computer, built as a single hero render.

## What this project is

A warm, lived-in room corner for a quiet evening at the desk. The hero image frames a wooden desk with
a monitor, keyboard, tower, lamp, and small personal objects, backed by a twilight window, wall shelf,
rug, framed print, and potted plant. Geometry is primitive-built; the mood comes from proportion,
tone, and a four-light evening setup.

## Requirements

Confirmed scope and acceptance criteria: [`Documents/REQUIREMENTS.md`](Documents/REQUIREMENTS.md).

- [x] Warm evening lamp light with cool twilight window fill.
- [x] Fully dressed desk corner: desk, chair, computer, monitor, keyboard, mouse, lamp, window, shelf, rug, plant, and decor.
- [x] Three-quarter hero camera, 1920×1080.
- [x] Primitive geometry and simple Principled materials only; no external assets.
- [x] Believable human scale in a roughly 3.6 × 3.6 × 2.7 m room.

## Visual direction

- Style: Stylised-realistic interior, clean silhouette, cozy and lived-in.
- Mood / references: Golden lamp pool against blue-hour window light; warm wood, rust and cream textiles, dark metal, muted green foliage.
- Colour and lighting: Warm 2700–3200 K practicals, cool 7500 K window fill, soft shadows, readable midtones, restrained highlights.
- Camera / framing: Three-quarter view from the open room side at standing eye height, desk as subject, window and wall behind.
- Scale and units: Metric, room 4.0 × 4.0 × 2.7 m; 0.76 m desk height; human-scaled furniture.

## Deliverables

- Main Blender file: `cozydeskroom.blend` at the project root
- Final renders: `renders/final/`
- Exports: `exports/` (none)
- Documentation: `Documents/`
- External assets: `assets/external/` (none used)

## Project structure

```text
CozyDeskRoom/
  README.md
  cozydeskroom.blend
  .gitignore
  Documents/
    README.md
    REQUIREMENTS.md
    WORKFLOW.md
    REVIEW.md
    ASSETS.md
    DECISIONS.md
    TASKSTRACKER.md
    Tasks/
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
- Main file: `cozydeskroom.blend` in the project root.
- Scene engine: EEVEE, 1920 × 1080, 96 samples, Camera_Hero.
- No external paths or linked assets; nothing to relink.

## Workflow

- Autonomy: Fully Autonomous in [`Documents/WORKFLOW.md`](Documents/WORKFLOW.md).
- Review: `All` configured graders in [`Documents/REVIEW.md`](Documents/REVIEW.md); rounds live in [`Documents/Reviews/`](Documents/Reviews/README.md).
- Every reviewable change: apply tickets from `blender-worker`, WIP render and look, seal, look, grade, commit, checkpoint.
- Registration documents and the active goal are frozen after prepare.

## External assets

See [`Documents/ASSETS.md`](Documents/ASSETS.md) and [`assets/external/README.md`](assets/external/README.md).

- None. All geometry, materials, lights, and camera are authored in Blender.

## Goals

Goal prompts live in [`Documents/Goals/`](Documents/Goals/). The active goal path is used for grading.

- [`01-project-brief.md`](Documents/Goals/01-project-brief.md)

## References

- [`Documents/References/README.md`](Documents/References/README.md)
- No external references are used; the brief is the source of direction.

## Open questions

- None.

## Next steps

- [x] Persist the confirmed requirements and workflow/review answers.
- [x] Fill the README and active goal.
- [x] Commit the scaffold, register, and start the goal.
- [x] Save the bootstrap scene, then build the room, workstation, dressing, lighting, and camera.
- [x] Inspect the sealed render and complete final grading.
