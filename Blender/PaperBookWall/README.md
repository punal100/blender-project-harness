# PaperBookWall

Status: In production
Last updated: 2026-11-01

## Purpose

A minimal, bright reading room with a pale-oak book wall as the single hero subject, shown straight-on
with calm symmetry.

## What this project is

A still-image interiors study for a calm, editorial look. The viewer sees a modern reading room wall
filled with paper-neutral books on pale-oak shelving, framed frontally with white wall margin around
it. The image is built procedurally in Blender, with no imported assets.

## Requirements

Confirmed scope and acceptance criteria: [`Documents/REQUIREMENTS.md`](Documents/REQUIREMENTS.md).

- Pale-oak bookshelf wall centered with white margin above and at both sides; white walls, pale floor.
- Curated mixed book arrangement in paper-neutral spines, not fully packed.
- Bright airy daylight with soft shadows.
- One small potted plant and one horizontal book stack; no other furniture.
- One 1920x1080 EEVEE hero render.

## Visual direction

- Style: minimal modern interior, clean geometry, editorial still.
- Mood / references: calm, airy, quiet reading room.
- Colour and lighting: pale oak, white walls, pale floor; cream, kraft, off-white spines with faint muted accents; bright soft daylight.
- Camera / framing: frontal symmetrical, eye level with slight low angle, shelf wall centered with breathing room.
- Scale and units: metric, real-world room and shelf dimensions.

## Deliverables

- Main Blender file: `paperbookwall.blend` (saved at project root)
- Final renders: `renders/final/`
- Exports: `exports/`
- Documentation: `Documents/`
- External assets: `assets/external/`

## Project structure

```text
PaperBookWall/
  README.md
  paperbookwall.blend
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
- Before launch, require confirmed requirements, selected workflow and review records, and an active
  filled goal. The harness validates project records, keeps the `.blend` inside this project, reads
  the workspace MCP port, records the instance outside the repository, and rejects conflicting
  workspace instances.
- Each launch writes `logs/blender-<timestamp>.log`; `logs/` is ignored.
- Main file: `paperbookwall.blend` in the project root; MCP scene settings report that exact path.
- Keep external paths relative (`//assets/...`); do not use absolute paths.
- Only one Blender project spawned by this workspace may be open at a time. Close the current one
  before opening another.

## Workflow

- Autonomy: Fully Autonomous, recorded in [`Documents/WORKFLOW.md`](Documents/WORKFLOW.md).
- Review: All configured graders each round, recorded in [`Documents/REVIEW.md`](Documents/REVIEW.md);
  rounds live in [`Documents/Reviews/`](Documents/Reviews/README.md).
- In Fully Autonomous mode the agent works within confirmed requirements, saves and inspects every
  meaningful change, completes required grading, and commits each scoped change before continuing.
- Require the saved inspected review render, current documents, and final applicable `PASS` before
  completion; no genuine unresolved blocker or major finding permits it.

## External assets

See [`Documents/ASSETS.md`](Documents/ASSETS.md) and [`assets/external/README.md`](assets/external/README.md).

- No external assets. All geometry and materials are procedural.

## Goals

Goal prompts live in [`Documents/Goals/`](Documents/Goals/). Multiple goals are allowed.
Identify the active goal's actual path; use it for grading rather than assuming the first brief.

- [`01-project-brief.md`](Documents/Goals/01-project-brief.md)

## References

- [`Documents/References/README.md`](Documents/References/README.md)
- No external references yet.

## Open questions

- None.

## Next steps

- [ ] Register the project and start the filled goal.
- [ ] Launch Blender, verify the addon and settings, and save the scene as `paperbookwall.blend`.
- [ ] Build the shelf wall, books, props, camera, and lighting in bounded changes.
- [ ] Seal, inspect the final render, complete grading, and deliver.
