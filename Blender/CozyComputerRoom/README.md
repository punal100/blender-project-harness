# CozyComputerRoom

Status: Draft
Last updated: 2026-11-05

## Purpose

Semi-realistic stylized cozy computer room at warm sunset with a cool dusk window.

## What this project is

An enclosed 3.6 x 3.2 m room with a 2.6 m ceiling, built as a complete lived-in evening interior around a desktop computer. The hero view is a wide three-quarter corner shot that shows the desk and computer, the cool dusk window, the bed, bookshelf, rug, plant, and warm lamp light. Everything is modeled and shaded procedurally in Blender.

## Requirements

Confirmed scope and acceptance criteria: [`Documents/REQUIREMENTS.md`](Documents/REQUIREMENTS.md).

- [x] Enclosed 3.6 x 3.2 x 2.6 m room with floor, walls, ceiling, window, and door.
- [x] Desk workstation with monitor, tower, keyboard, mouse, chair, and warm desk lamp.
- [x] Bed, bookshelf with books, rug, plant, wall art, curtains, and cozy props.
- [x] Warm evening lamps against a cool dusk window.
- [x] Output `cozycomputerroom.blend` plus one 1920x1080 hero PNG.
- [x] Procedural only, no external assets, no project scripts.

## Visual direction

- Style: Semi-realistic stylized interior with clean readable forms and believable proportions.
- Mood / references: Calm, lived-in, intimate evening study; no external references.
- Colour and lighting: Warm amber lamps and desk glow against cool blue dusk from the window; soft shadows.
- Camera / framing: Eye level near 1.5 m, wide three-quarter view of the desk corner and window, 16:9.
- Scale and units: Metric; room 3.6 x 3.2 m, ceiling 2.6 m; furniture at real-world scale.

## Deliverables

- Main Blender file: `cozycomputerroom.blend` (planned at project root until first save)
- Final renders: `renders/final/`
- Exports: `exports/` (none planned)
- Documentation: `Documents/`
- External assets: none

## Project structure

```text
CozyComputerRoom/
  README.md
  cozycomputerroom.blend
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
- Before launch, require confirmed requirements, selected workflow and review records, and an active filled goal.
- Each launch writes `logs/blender-<timestamp>.log`; `logs/` is ignored.
- Main file: save the first scene as `cozycomputerroom.blend` in the project root, then replace the planned status above.
- Only one Blender project spawned by this workspace may be open at a time.

## Workflow

- Autonomy mode: Fully Autonomous ([`Documents/WORKFLOW.md`](Documents/WORKFLOW.md)).
- Review mode: All — visual, technical, and spec graders ([`Documents/REVIEW.md`](Documents/REVIEW.md)).
- Every reviewable change: apply, WIP check, seal, inspect, grade, commit, checkpoint.
- Both modes are frozen after registration; a requested change stops production for explicit re-registration.

## External assets

See [`Documents/ASSETS.md`](Documents/ASSETS.md).

- No external assets. All geometry, materials, and lighting are authored procedurally in Blender.
- No user-provided files, reference images, or generated media.

## Goals

- [`01-project-brief.md`](Documents/Goals/01-project-brief.md)

## References

- [`Documents/References/README.md`](Documents/References/README.md)
- None; the brief is the sole reference.

## Open questions

- None. Requirements, workflow, and review mode are confirmed.

## Next steps

- [ ] Commit the scaffold records and register the project.
- [ ] Build the room shell, furniture, computer workstation, and props.
- [ ] Light, frame, render, and complete All-grader review.
- [ ] Finalize the documented delivered state.
