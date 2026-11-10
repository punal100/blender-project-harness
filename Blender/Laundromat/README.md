# Laundromat

Status: Bootstrap
Last updated: 2026-11-10

## Purpose

Realistic lived-in laundromat interior at evening.

## What this project is

An interior-only, fully modeled laundromat scene for a 1920x1080 photorealistic hero render and a verified GLB export. A neighborhood laundromat at evening: warm fluorescent light, both machine rows, folding and seating areas, signage, and believable use and wear. All geometry and materials are built in-scene without external assets, image textures, or HDRIs.

## Requirements

Confirmed scope and acceptance criteria: [`Documents/REQUIREMENTS.md`](Documents/REQUIREMENTS.md).

- Single interior room about 10 x 7 x 3.2 m at 1 unit = 1 m, with front glazing onto a dark evening street.
- At least 10 front-load washers in one row and 6 dryers in stacked pairs opposite.
- Folding tables, seating, carts, bins, detergent vending, and change machine.
- Readable "LAUNDROMAT" signage, hours, machine labels, and notices.
- Lived-in evening realism with warm interior light, cool dusk spill, and emissive accents.
- 1920x1080 PNG hero render and verified GLB export.

## Visual direction

- Style: photorealistic interior, lived-in and slightly worn, not showroom-clean.
- Mood / references: quiet neighborhood laundromat at evening; no external references.
- Colour and lighting: warm fluorescent whites and yellows, cool dusk spill, muted teal and green machine accents, aged neutrals.
- Camera / framing: eye-level three-quarter view from near the entrance, 16:9, showing both machine rows and room depth.
- Scale and units: meters; 1 Blender unit = 1 m.

## Deliverables

- Main Blender file: `laundromat.blend` (planned at project root until first save)
- Final render: `renders/final/laundromat-hero-1920x1080.png`
- Export: `exports/laundromat.glb`
- Documentation: `Documents/`
- External assets: none; all geometry and materials are built in-scene.

## Project structure

```text
Laundromat/
  README.md
  laundromat.blend
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
- Before launch, require confirmed requirements, selected workflow and review records, and an active filled goal. The harness validates project records, keeps the `.blend` inside this project, reads the workspace MCP port, records the instance outside the repository, and rejects conflicting workspace instances.
- Each launch writes `logs/blender-<timestamp>.log`; `logs/` is ignored.
- Main file: save the first scene as `laundromat.blend` in the project root. Before production edits, verify MCP scene settings report that exact path; then replace the planned status above.
- Keep external paths relative (`//assets/...`); do not use absolute paths. This project has no external assets.
- Only one Blender project spawned by this workspace may be open at a time. Close the current one before opening another.

## Workflow

- Autonomy: Fully Autonomous, recorded in [`Documents/WORKFLOW.md`](Documents/WORKFLOW.md).
- Review: Single grader `visual`, recorded in [`Documents/REVIEW.md`](Documents/REVIEW.md); rounds live in [`Documents/Reviews/`](Documents/Reviews/README.md).
- Every reviewable change: apply, WIP check, seal, inspect, review, commit, checkpoint.
- After registration, workflow and review modes are frozen. A requested mode change stops production for explicit re-registration.

## External assets

See [`Documents/ASSETS.md`](Documents/ASSETS.md) and [`assets/external/README.md`](assets/external/README.md).

- No external assets, image textures, HDRIs, or downloaded content are used.
- Scripts are source-only under `scripts/`; the harness never executes project Python.

## Goals

Goal prompts live in [`Documents/Goals/`](Documents/Goals/).

- [`01-project-brief.md`](Documents/Goals/01-project-brief.md) — active brief: make realistic laundromat.

## References

- [`Documents/References/README.md`](Documents/References/README.md)
- Runtime reference answer: `None`; no references are used.

## Open questions

- None; requirements are confirmed.

## Next steps

- [ ] Commit the exact bootstrap records and register the project.
- [ ] Start the mission, launch Blender, and save the initial scene.
- [ ] Build the room, equipment, props, materials, lighting, and camera in bounded changes.
- [ ] Render and inspect the hero image, complete review, export GLB, and finish documentation.
