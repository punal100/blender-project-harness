# Cozy Computer Room

Status: In progress
Last updated: 2026-11-02

## Purpose

A single hero still of a stylized low-poly, cozy computer room at night, used to demonstrate a warm, lived-in interior diorama.

## What this project is

A self-contained Blender scene: a cutaway corner room with a desk workstation, window, rug, plants, wall art, and shelf decor. The intended result is one polished, readable three-quarter camera image with warm lamp and monitor light against a cool teal night.

## Requirements

Confirmed scope and acceptance criteria: [`Documents/REQUIREMENTS.md`](Documents/REQUIREMENTS.md).

- Stylized low-poly cutaway diorama; no photorealism and no imported scans.
- Desk with single monitor, tower, keyboard, mouse, mug, headphones, and chair; window and curtains, rug, plants, wall art, and wall shelf decor.
- Warm amber interior against a teal-blue night; desk lamp, monitor glow, and subtle shelf lights.
- One hero still plus WIP renders; all geometry and materials procedural.

## Visual direction

- Style: Stylized low-poly with chunky forms, clean facets, and simple PBR materials.
- Mood / references: Quiet, lived-in late evening; no external visual references required.
- Colour and lighting: Warm wood, amber lamps, and cream fabrics; cool teal-blue window light; low ambient fill; monitor emits a warm code-editor glow.
- Camera / framing: Three-quarter view into the cutaway corner at roughly seated eye height; desk is the focal point, window balances the frame, no clipping.
- Scale and units: Metric; room corner about 4.2 m by 3.6 m, wall height 2.6 m, desk 1.4 m wide.

## Deliverables

- Main Blender file: `cozy-computer-room.blend` (project root; planned until the first save).
- Final render: `renders/final/cozy-computer-room-hero.png` (planned).
- WIP renders: `renders/wip/`.
- Exports: none planned.
- Documentation: `Documents/`.
- External assets: `assets/external/` (none used).

## Project structure

```text
Cozy Computer Room/
  README.md
  cozy-computer-room.blend
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
- Main file: save the first scene as `cozy-computer-room.blend` in the project root and verify MCP scene settings report that exact path.
- Keep any asset paths relative (`//assets/...`); no external assets are planned.
- Only one Blender instance spawned by this workspace may run at a time.

## Workflow

- Autonomy: Fully Autonomous, recorded in [`Documents/WORKFLOW.md`](Documents/WORKFLOW.md).
- Review: `All` with visual, technical, and spec graders, recorded in [`Documents/REVIEW.md`](Documents/REVIEW.md).
- Rounds live in [`Documents/Reviews/`](Documents/Reviews/README.md).
- After registration, workflow and review modes are frozen. A requested change stops production for explicit re-registration.
- Completion requires the saved inspected review render, current documents, and a final applicable `PASS` with no unresolved blocker or major finding.

## External assets

See [`Documents/ASSETS.md`](Documents/ASSETS.md) and [`assets/external/README.md`](assets/external/README.md).

- No external assets. All geometry is built from harness-supported primitives with procedural materials.

## Goals

Goal prompts live in [`Documents/Goals/`](Documents/Goals/). The active goal is [`01-project-brief.md`](Documents/Goals/01-project-brief.md).

## References

- [`Documents/References/README.md`](Documents/References/README.md)
- No reference files are required for the confirmed stylized direction.

## Open questions

- None. Requirements were confirmed on 2026-11-02.

## Next steps

- Commit the scaffold and register the project.
- Launch Blender, save the bootstrap scene, and commit it.
- Build the room in bounded changes with WIP checks.
- Seal, inspect, grade, commit, and checkpoint the final change before delivery.
