# CozyComputerRoom

Status: Complete
Last updated: 2026-11-05

## Purpose

A semi-realistic stylized cozy small room built as a finished Blender still, centered on a desktop computer workstation with warm evening lamp lighting.

## What this project is

A complete compact interior scene for a single hero render. The room is fully enclosed and furnished: a desk with monitor, tower, keyboard, and mouse; a chair; a bed; a bookshelf; a rug; a window; a door; and small cozy props. The artwork aims for a calm, lived-in evening atmosphere with believable scale and clean simplified geometry.

## Requirements

Confirmed scope and acceptance: [`Documents/REQUIREMENTS.md`](Documents/REQUIREMENTS.md).

- [x] REQ-01 / REQ-02: Finished semi-realistic stylized still of a cozy small room with a desktop computer.
- [x] REQ-03: Enclosed compact room with floor, walls, ceiling, door, and window.
- [x] REQ-04: Desk workstation with monitor, tower, keyboard, mouse, and chair.
- [x] REQ-05: Bed, bookshelf with books, rug, potted plant, mug, lamps, wall art, and blanket.
- [x] REQ-06: Warm evening lamps with a cool dusk-blue window and soft shadows.
- [x] REQ-07: Procedural wood, fabric, plastic, metal, paper, ceramic, and plant materials.
- [x] REQ-08: One eye-level three-quarter hero camera with the computer clearly readable.
- [x] REQ-09: Metric scale at believable human proportions.
- [x] REQ-10: One 1920x1080 PNG hero render plus the saved `.blend`.
- [x] REQ-11 / REQ-12: Procedural assets only; no external media and no scripts.
- [x] REQ-13: Scene opens cleanly, is fully shaded and lit, and the sealed render shows the delivered state.

## Visual direction

- Style: Semi-realistic stylized; clean forms, believable materials, no photoreal texture dependency.
- Mood / references: Calm, warm, lived-in evening; soft shadows and a quiet domestic atmosphere.
- Colour and lighting: Amber and warm wood tones from the desk, floor, and pendant lamps; deep blue dusk from the window; soft contrast.
- Camera / framing: One eye-level hero camera near 1.5 m, 16:9, three-quarter view with the desk and computer as the focal point.
- Scale and units: Metric; room approximately 3.6 x 3.2 m with a 2.6 m ceiling.

## Deliverables

- Main Blender file: `cozycomputerroom.blend` (project root)
- Final render: latest sealed 1920x1080 PNG in `renders/final/`
- Documentation: `Documents/`
- External assets: none; procedural only

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
  backups/
```

## Blender

- MCP port: owned by the workspace root `.kilo/kilo.jsonc`.
- Launch and stop with `blender_workflow` `launch`/`stop`; never invoke Blender from the shell.
- Main file: `cozycomputerroom.blend` in the project root.
- Keep external paths relative (`//assets/...`); do not use absolute paths.
- Only one Blender project spawned by this workspace may be open at a time.

## Workflow

- Autonomy: Fully Autonomous, recorded in [`Documents/WORKFLOW.md`](Documents/WORKFLOW.md).
- Review: All graders (visual, technical, spec), recorded in [`Documents/REVIEW.md`](Documents/REVIEW.md); rounds live in [`Documents/Reviews/`](Documents/Reviews/README.md).
- After registration, workflow, review, requirements, and the active goal are frozen. A requested change stops production for explicit re-registration.
- Every reviewable change follows begin, apply tickets, seal, inspected render, grading, commit, and checkpoint. The bootstrap save is not reviewable.
- Require the saved inspected review render, current documents, and a final applicable `PASS` before completion; no genuine unresolved blocker or major finding permits it.

## External assets

See [`Documents/ASSETS.md`](Documents/ASSETS.md) and [`assets/external/README.md`](assets/external/README.md).

No third-party assets. All geometry and materials are authored procedurally in Blender. No intake, downloads, generated media, or project scripts are used.

## Goals

Goal prompts live in [`Documents/Goals/`](Documents/Goals/).

- [`01-project-brief.md`](Documents/Goals/01-project-brief.md)

## References

- [`Documents/References/README.md`](Documents/References/README.md)
- No external visual references were supplied; the brief is the source of truth.

## Open questions

- None.

## Next steps

- [x] Register the project and start the goal.
- [x] Launch Blender and save the bootstrap scene.
- [x] Build the room shell, furniture, computer, materials, and lighting in bounded changes.
- [x] Render, inspect, review, and checkpoint the final result.
