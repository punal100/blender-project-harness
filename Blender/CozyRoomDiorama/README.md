# CozyRoomDiorama

Status: Active
Last updated: 2026-11-03

## Purpose

Build a self-contained low-poly Blender diorama of a cozy computer room on a rainy evening, with a warm, lived-in mood and the desk as the focal point.

## What this project is

A single-room diorama (floor plus two walls) aimed at a general audience. The visual result is one readable hero image: a compact low-poly room with a computer desk, rainy window, bookshelf, rug, floor lamp, plants, wall art, and everyday clutter, lit by warm interior lamps against cool blue window light.

## Requirements

Confirmed scope and acceptance criteria: [`Documents/REQUIREMENTS.md`](Documents/REQUIREMENTS.md).

- REQ-01: Self-contained low-poly open-corner diorama, readable as one hero image.
- REQ-04: Desk with monitor, keyboard, mouse, PC tower, and chair; window and curtains; filled bookshelf; rug; floor lamp; at least two plants; wall art; clutter.
- REQ-03: Rainy evening mood with cool window light and warm practical lighting.
- REQ-05: Three-quarter 16:9 camera framing the full room with the desk as focal point.
- REQ-08/09: Save `cozyroomdiorama.blend`; render 1920x1080 EEVEE to `renders/final/`.

## Visual direction

- Style: Low-poly diorama with faceted, simplified geometry and deliberate silhouettes; no photoreal textures.
- Mood / references: Quiet rainy evening at home; calm, warm, lived-in, slightly nostalgic.
- Colour and lighting: Warm amber lamps and monitor glow inside, cool blue rain-lit window outside, muted wood and teal accents.
- Camera / framing: Three-quarter view from the open corner, 16:9, full room visible, desk as focal point.
- Scale and units: Believable room scale in metres; character-scale desk and chair.

## Deliverables

- Main Blender file: `cozyroomdiorama.blend` (planned at project root until first save)
- Final renders: `renders/final/` (planned 1920x1080 EEVEE hero render)
- Exports: none planned
- Documentation: `Documents/`
- External assets: none; primitive geometry and procedural materials only

## Project structure

```text
CozyRoomDiorama/
  README.md
  cozyroomdiorama.blend
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
- Main file: save the first scene as `cozyroomdiorama.blend` in the project root. Before production edits, verify MCP scene settings report that exact path.
- Keep external paths relative (`//assets/...`); no absolute paths. No external assets are planned.
- Only one Blender project spawned by this workspace may be open at a time.

## Workflow

- Autonomy mode: Fully Autonomous, recorded in [`Documents/WORKFLOW.md`](Documents/WORKFLOW.md).
- Review mode: All, recorded in [`Documents/REVIEW.md`](Documents/REVIEW.md); rounds live in [`Documents/Reviews/`](Documents/Reviews/README.md).
- Requirements, workflow, review, and the active goal are frozen after registration. A requested change stops production for explicit re-registration.
- Reviewable changes follow `begin`, apply tickets, WIP render, `seal`, `look`, grader review, `commit`, and `checkpoint`.
- Completion requires the saved inspected review render, current documents, and a final applicable `PASS` with no genuine unresolved blocker or major finding.

## External assets

See [`Documents/ASSETS.md`](Documents/ASSETS.md) and [`assets/external/README.md`](assets/external/README.md).

- None. This project is built entirely from Blender primitives and procedural materials.

## Goals

Goal prompts live in [`Documents/Goals/`](Documents/Goals/).

- [`01-project-brief.md`](Documents/Goals/01-project-brief.md) — active goal.

## References

- [`Documents/References/README.md`](Documents/References/README.md)

## Open questions

- None; requirements are confirmed and frozen.

## Next steps

- [ ] Launch Blender through the harness and verify the addon and scene settings.
- [ ] Save the bootstrap scene as `cozyroomdiorama.blend`.
- [ ] Build the room, lighting, materials, and hero camera in bounded changes.
- [ ] Seal, inspect, and grade the final change; commit and checkpoint.
