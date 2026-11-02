# CozyRoomDiorama

Status: Delivered
Last updated: 2026-11-03

## Purpose

Deliver a self-contained low-poly Blender diorama of a cozy computer room on a rainy evening, with a warm lived-in mood and the desk as the focal point.

## What this project is

A single-room diorama (floor plus two walls) for a general audience. The visual result is one readable hero image: a compact low-poly room with a computer desk, monitor, PC tower, chair, rainy window, filled bookshelf, rug, floor lamp, two potted plants, wall art, mug, and papers, lit by warm interior lamps against cool blue window light.

## Requirements

Confirmed scope and acceptance criteria: [`Documents/REQUIREMENTS.md`](Documents/REQUIREMENTS.md).

- REQ-01: Self-contained low-poly open-corner diorama, readable as one hero image.
- REQ-03: Rainy evening mood with cool window light and warm practical lighting.
- REQ-04: Desk and computer group; window and curtains; filled bookshelf; rug; floor lamp; two potted plants; wall art; mug and papers.
- REQ-05: Three-quarter 16:9 camera framing the full room with the desk as focal point.
- REQ-08/09: Save `cozyroomdiorama.blend`; render 1920x1080 EEVEE to `renders/final/`.

## Visual direction

- Style: Low-poly diorama with faceted, simplified geometry and deliberate silhouettes; no photoreal textures.
- Mood / references: Quiet rainy evening at home; calm, warm, lived-in, slightly nostalgic.
- Colour and lighting: Warm amber lamps and monitor glow inside, cool blue rain-lit window outside, muted wood and teal accents.
- Camera / framing: Three-quarter view from the open corner, 16:9, full room visible, desk as focal point.
- Scale and units: Believable room scale in metres; room 4.4 x 3.6 x 2.7 m; desk height 0.86 m.

## Deliverables

- Main Blender file: `cozyroomdiorama.blend` (delivered at project root).
- Final renders: `renders/final/` — sealed review renders R01-R05; R05 is the final full-spec render.
- Exports: none.
- Documentation: `Documents/`.
- External assets: none; primitive geometry and procedural materials only.

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
- Main file: `cozyroomdiorama.blend` at the project root; MCP scene settings match this path.
- External paths are relative; no external assets are used.
- Only one Blender project spawned by this workspace may be open at a time.

## Workflow

- Autonomy mode: Fully Autonomous, recorded in [`Documents/WORKFLOW.md`](Documents/WORKFLOW.md).
- Review mode: All, recorded in [`Documents/REVIEW.md`](Documents/REVIEW.md); rounds live in [`Documents/Reviews/`](Documents/Reviews/README.md).
- Review rounds R01-R05 cover the shell, revision, desk/lighting, rainy-window revision, and final content change. The final R05 verdict is recorded in `Documents/Reviews/`.
- Requirements, workflow, review, and the active goal are frozen after registration.
- Completion requires the saved inspected review render and a final applicable `PASS` with no genuine unresolved blocker or major finding.

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

- [x] Build the room shell, window, curtains, desk, computer, chair, lighting, bookshelf, plants, rug, wall art, and clutter.
- [x] Save `cozyroomdiorama.blend` and render 1920x1080 EEVEE hero images.
- [x] Seal and inspect the final R05 render.
- [x] Complete the final review round and record the verdict in `Documents/Reviews/`.
