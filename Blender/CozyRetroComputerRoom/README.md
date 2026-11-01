# CozyRetroComputerRoom

Status: Confirmed
Last updated: 2026-11-01

## Purpose

Late-80s/90s cozy computer corner with beige CRT desktop, delivered as one hero still.

## What this project is

A single-scene Blender study of a lived-in retro computer corner: a yellowed beige CRT monitor and PC
tower on a wood-veneer desk, keyboard and mouse in the foreground, warm lamp light mixed with CRT
glow, and cozy clutter around it. Built for a general portfolio audience as one polished close-up
render.

## Requirements

Confirmed scope and acceptance criteria: [`Documents/REQUIREMENTS.md`](Documents/REQUIREMENTS.md).

- [x] Cozy late-80s/90s computer corner with readable retro hardware identity.
- [x] Beige CRT monitor with deep housing, keyboard, mouse, PC tower, desk clutter.
- [x] Tight 3/4 desk-corner close-up hero still, 16:9, 1920x1080.
- [x] Procedural geometry and materials only; no external assets.

## Visual direction

- Style: stylized realistic props, clean silhouettes, believable lived-in wear.
- Mood / references: warm nostalgic evening, focused desk lamp, calm glow from the CRT.
- Colour and lighting: beige/cream plastic, warm wood, tungsten lamp key, teal-orange CRT accent, soft shadows.
- Camera / framing: tight 3/4 desk-corner close-up, monitor as focal point, shallow depth of field.
- Scale and units: metric; desk 0.75 m high, CRT about 0.4 m wide and 0.4 m deep.

## Deliverables

- Main Blender file: `cozyretrocomputerroom.blend` (planned at project root until first save)
- Final renders: `renders/final/`
- Exports: `exports/`
- Documentation: `Documents/`
- External assets: `assets/external/` (none used)

## Project structure

```text
CozyRetroComputerRoom/
  README.md
  cozyretrocomputerroom.blend
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
- Main file: `cozyretrocomputerroom.blend` in the project root; external paths stay relative (`//assets/...`).
- Only one Blender project spawned by this workspace may be open at a time.

## Workflow

- Autonomy mode: Fully Autonomous (see [`Documents/WORKFLOW.md`](Documents/WORKFLOW.md)).
- Review mode: All graders (see [`Documents/REVIEW.md`](Documents/REVIEW.md)).
- Rounds live in [`Documents/Reviews/`](Documents/Reviews/README.md).
- Every reviewable change runs through the harness: begin, apply, seal, look, review, commit, checkpoint.
- Completion requires the saved inspected render, current documents, and a final applicable `PASS`.

## External assets

See [`Documents/ASSETS.md`](Documents/ASSETS.md). No external assets are used in this project.

## Goals

Goal prompts live in [`Documents/Goals/`](Documents/Goals/).

- [`01-project-brief.md`](Documents/Goals/01-project-brief.md)

## References

- [`Documents/References/README.md`](Documents/References/README.md)
- No external references yet; the visual direction comes from the confirmed brief.

## Open questions

- None.

## Next steps

- [x] Persist the exact confirmed requirements and workflow/review answers collected before scaffold.
- [ ] Save the first scene through a bounded bootstrap save, then commit and checkpoint it.
- [ ] Build the room geometry, props, materials, and lighting in bounded changes.
- [ ] Seal, inspect, and grade the hero render; deliver after a final `PASS`.
