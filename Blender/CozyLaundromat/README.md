# CozyLaundromat

Status: In progress
Last updated: 2026-11-05

## Purpose

A realistic, cozy neighborhood laundromat interior at evening, delivered as a saved Blender scene and one sealed hero render.

## What this project is

A single-scene environment asset: a small working laundromat with front-loading machines, a folding counter, a waiting nook, a window, warm practical lights, and lived-in props. The audience is anyone reviewing environment art for realism, mood, and composition. The scene is not animated and contains no people.

## Requirements

Confirmed scope and acceptance criteria: [`Documents/REQUIREMENTS.md`](Documents/REQUIREMENTS.md). Highest priority:

- Wide eye-level interior shot of a roughly 6 x 5 m laundromat with at least six front-loaders, counter, seating, window, and warm tungsten lighting.
- Realistic scale, coherent materials, and a cozy evening palette.
- `cozylaundromat.blend` saved at the project root and a sealed 1920x1080 hero PNG in `renders/final/`.

## Visual direction

- Style: realistic / stylized-realistic environment art.
- Mood / references: quiet, lived-in, inviting evening laundromat; one generated reference image in `Documents/References/`.
- Colour and lighting: warm tungsten amber, cream walls, muted teal accents, soft shadows.
- Camera / framing: wide eye-level interior at about 1.62 m, 35 mm, full window and room readable.
- Scale and units: metres; room about 6.2 x 5.2 m, ceiling about 2.8 m, washers about 0.85 m tall, counter about 0.9 m.

## Deliverables

- Main Blender file: `cozylaundromat.blend` at the project root.
- Final renders: `renders/final/`.
- Exports: none planned.
- Documentation: `Documents/`.
- External assets: one generated reference image; no third-party assets.

## Project structure

```text
CozyLaundromat/
  README.md
  cozylaundromat.blend
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
- Main file: `cozylaundromat.blend` in the project root.
- Only one Blender project spawned by this workspace may be open at a time.

## Workflow

- Autonomy: Partially Autonomous; approval is required after each reviewable change before its commit.
- Review: All configured graders (visual, technical, spec) review every reviewable change.
- Rounds live in [`Documents/Reviews/`](Documents/Reviews/README.md).

## External assets

One generated reference image is registered under `Documents/References/`. No third-party assets are used. See [`Documents/ASSETS.md`](Documents/ASSETS.md).

## Goals

- [`01-project-brief.md`](Documents/Goals/01-project-brief.md)

## References

- [`Documents/References/README.md`](Documents/References/README.md)
- Generated reference: `Documents/References/img_20261105_195314_cozy-laundromat-reference_e1df3f-e1df3f0e.png`

## Open questions

- None. Render engine and lighting balance are production decisions recorded in [`Documents/DECISIONS.md`](Documents/DECISIONS.md).

## Next steps

- [x] Launch Blender, save the bootstrap scene, and checkpoint it.
- [x] Build the room shell and lighting; address the R01 review findings.
- [ ] Build the machine row and waiting area.
- [ ] Build the folding counter, props, and final lighting detail.
- [ ] Deliver the inspected hero render and complete the goal.
