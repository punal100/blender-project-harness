# CozyRetroRoom

Status: In production
Last updated: 2026-10-31

## Purpose

A cozy late-90s bedroom computer corner, rendered as a photoreal 16:9 hero still. The image should
feel nostalgic, warm, and lived-in, with a beige CRT setup as the focal point.

## What this project is

A single-scene Blender visualization for the project owner: a small bedroom corner with a period
desktop computer, woodgrain paneling, media clutter, posters, a plant, and warm practical lighting.
The result is one polished still, not a game-ready environment or animation.

## Requirements

Confirmed scope and acceptance criteria: [`Documents/REQUIREMENTS.md`](Documents/REQUIREMENTS.md).

- Late-90s beige CRT monitor, desktop tower, and chunky keyboard as the focal point.
- Cozy evening lighting from a tungsten desk lamp, CRT glow, and soft window ambience.
- Lived-in dressing: posters, wall notes, media shelves, plant, textiles, cables, and knick-knacks.
- Photoreal PBR materials, real-world scale, three-quarter 16:9 hero camera at 1920x1080.

## Visual direction

- Style: photoreal PBR interior still, physically plausible wear and age.
- Mood / references: nostalgic 1990s bedroom PC corner; warm, safe, slightly cluttered; evening.
- Colour and lighting: amber/brown wood and fabric palette, warm tungsten pools, cool CRT screen
  highlight, soft window fill, gentle shadows.
- Camera / framing: three-quarter view into the corner at seated/standing eye height, desk and CRT
  clearly readable, enough room context to sell the space.
- Scale and units: metres; desk about 1.2-1.5 m wide, CRT about 0.35-0.45 m wide, walls about
  2.4-2.8 m high.

## Deliverables

- Main Blender file: `cozyretroroom.blend` (project root)
- Final render: `renders/final/cozyretroroom-hero.png` (planned, 1920x1080)
- Review renders: `renders/wip/`
- Exports: none planned
- Documentation: `Documents/`
- External assets: `assets/external/`

## Project structure

```text
CozyRetroRoom/
  README.md
  cozyretroroom.blend
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
- Workflow mode: [`Documents/WORKFLOW.md`](Documents/WORKFLOW.md) — Partially Autonomous.
- Launch from the workspace root with the validated launcher:
  `.\tools\start-blender.cmd "Blender\CozyRetroRoom"`
- The launcher requires confirmed requirements and selected workflow records, keeps the `.blend`
  inside this project, reads the workspace MCP port, and rejects conflicting workspace instances.
- Each launch opens a log terminal and writes to `logs/blender-<timestamp>.log`; `logs/` is ignored.
- Main file: `cozyretroroom.blend` in the project root.
- Keep external paths relative (`//assets/...`); do not use absolute paths.
- Only one Blender project spawned by this workspace may be open at a time. Close the current one
  before opening another.

## External assets

See [`Documents/ASSETS.md`](Documents/ASSETS.md) and [`assets/external/README.md`](assets/external/README.md).

- No external assets. All scene content is built procedurally or modeled in the file.

## Goals

Goal prompts live in [`Documents/Goals/`](Documents/Goals/). Multiple goals are allowed.

- [`01-project-brief.md`](Documents/Goals/01-project-brief.md) — initial scene and hero render.

## References

- [`Documents/References/README.md`](Documents/References/README.md)
- VOGONS, "What did your home PC space/room look like in the mid 90s?":
  https://www.vogons.org/viewtopic.php?t=101256
- Francesco Milanese, "How I Recreated My First 1990s PC Corner with Blender and Substance Painter":
  https://www.francescomilanese.com/tutorials-en-all/tut-204-en-b3d-sp-386-pc-corner.html

## Open questions

- None blocking. Exact Blender version, render device, and sample count to be recorded during
  production.

## Next steps

- [ ] Launch Blender, verify the add-on and scene settings, save `cozyretroroom.blend`.
- [ ] Block out the corner, desk, CRT, and camera.
- [ ] Add period props, materials, and lighting in reviewed increments.
- [ ] Render, inspect, and deliver the 1920x1080 hero still.
