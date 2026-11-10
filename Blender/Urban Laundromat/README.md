# Urban Laundromat

Status: In progress
Last updated: 2026-11-11

## Purpose

A gritty, realistic urban laundromat interior at dusk, built entirely from modeled geometry and flat-color materials.

## What this project is

A portfolio-style still visualization of a working neighborhood laundromat. The camera looks down the aisle toward a glass storefront, with front-load washers, dryers, folding tables, carts, baskets, signage, and worn interior surfaces in warm fluorescent light against cool street light.

## Requirements

Confirmed scope and acceptance criteria: [`Documents/REQUIREMENTS.md`](Documents/REQUIREMENTS.md).

- [ ] Interior ~8 m x 12 m x 3 m with aluminum-framed glass storefront and glass door.
- [ ] At least 8 washers, 6 dryers, 2 folding tables, cart, baskets, soap machine, signage, bench, and trash bin.
- [ ] Worn linoleum, aged walls, mixed fluorescent and dusk lighting, eye-level 16:9 hero camera.
- [ ] Hero and three detail PNG renders, saved .blend, and verified GLB export.
- [ ] No external images, HDRIs, textures, or scripts.

## Visual direction

- Style: gritty, grounded, realistic urban laundromat; worn but not abandoned.
- Mood / references: quiet evening neighborhood chore, warm interior glow spilling onto a cool sidewalk; no external references supplied.
- Colour and lighting: warm-white fluorescent tubes overhead, cool blue dusk and street light through the storefront, muted enamel and linoleum palette with occasional color accents.
- Camera / framing: eye level ~1.65 m, three-quarter aisle view, 24-28 mm equivalent, 16:9.
- Scale and units: metric, 1 Blender unit = 1 m; human-scale doors, counters, and machine heights.

## Deliverables

- Main Blender file: `urban-laundromat.blend` (planned at project root until first save)
- Final renders: `renders/final/` (1920x1080 hero plus 3 detail stills)
- Exports: `exports/urban-laundromat.glb`
- Documentation: `Documents/`
- External assets: none

## Project structure

```text
Urban Laundromat/
  README.md
  urban-laundromat.blend
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
- Each launch writes `logs/blender-<timestamp>.log`; `logs/` is ignored.
- Main file: save the first scene as `urban-laundromat.blend` in the project root. Before production edits, verify MCP scene settings report that exact path.
- Keep external paths relative (`//assets/...`); do not use absolute paths.
- Only one Blender project spawned by this workspace may be open at a time.

## Workflow

- Record the selected autonomy mode in [`Documents/WORKFLOW.md`](Documents/WORKFLOW.md): Fully Autonomous.
- Record review mode in [`Documents/REVIEW.md`](Documents/REVIEW.md): Single (visual).
- After registration, workflow and review modes are frozen. A requested mode change stops production for explicit re-registration.
- Commit through the harness after each reviewed change; checkpoint after each commit.
- Require the saved inspected review render, current documents, and final applicable `PASS` before completion.

## External assets

See [`Documents/ASSETS.md`](Documents/ASSETS.md) and [`assets/external/README.md`](assets/external/README.md).

- User files enter only through `blender_workflow {action:"intake"}`; originals are never moved.
- No external assets: the project uses no images, HDRIs, textures, models, or audio.

## Goals

Goal prompts live in [`Documents/Goals/`](Documents/Goals/). Multiple goals are allowed. Identify the active goal's actual path; use it for grading rather than assuming the first brief.

- [`01-project-brief.md`](Documents/Goals/01-project-brief.md)

## References

- [`Documents/References/README.md`](Documents/References/README.md)
- No reference images or links; the user selected None.

## Open questions

- None.

## Next steps

- [ ] Register the project and start the `/goal-blender` mission.
- [ ] Save and checkpoint the first scene.
- [ ] Build the room, storefront, machines, props, and lighting in bounded changes.
- [ ] Seal, inspect, review, and commit the final hero and detail renders; verify the GLB export.
