# Laundromat

Status: Delivered
Last updated: 2026-11-10

## Purpose

A realistic American coin laundromat interior, delivered as one hero still.

## What this project is

An interior-only Blender scene of a small self-service coin laundromat, viewed from the entrance down the central aisle. Twelve front-loading washers and dryers in two facing sage/teal rows, folding tables, bench seating, vending, signage, wall clock, bins, and fluorescent ceiling lighting at real-world metric scale. The result reads as a believable neighborhood laundromat rather than a generic box of machines.

## Requirements

Confirmed scope and acceptance criteria: [`Documents/REQUIREMENTS.md`](Documents/REQUIREMENTS.md).

- REQ-01: Interior-only room about 8 x 12 m with a 2.9 m ceiling.
- REQ-02: Portfolio-quality laundromat environment, not a generic room.
- REQ-03: Two facing rows of 12 front-loading machines, each with body, coin panel, round glass door, and stainless drum rim.
- REQ-04: Folding tables, bench, soap/change vending, signage, clock, trash bins, tiled floor, drop ceiling with fluorescent panels.
- REQ-05: Simple physically plausible materials with no texture maps.
- REQ-06: Warm fluorescent ceiling light plus cool daylight from the entrance.
- REQ-07: Hero camera at eye height looking down the aisle, 1920x1080.
- REQ-08: Off-white walls, sage/teal machines, stainless trim, warm grey floor, no people.
- REQ-09: `laundromat.blend` plus hero PNG in `renders/final/`.
- REQ-10: README and supporting documents reflect the delivered state.

## Visual direction

- Style: photoreal small-business interior; modest wear, no stylization.
- Mood / references: quiet late-afternoon neighborhood laundromat; references `none`.
- Colour and lighting: off-white walls, sage/teal machine faces, stainless steel, warm grey tile; warm fluorescent ceiling panels with cool daylight behind the camera.
- Camera / framing: eye height 1.6 m at the entrance, 40 mm lens, one-point perspective down the aisle.
- Scale and units: metric; 1 unit = 1 m; room about 8 x 12 m; ceiling 2.9 m.

## Deliverables

- Main Blender file: `laundromat.blend`
- Final hero render: `renders/final/R07-20261110T074103Z.png` at 1920x1080
- Documentation: `Documents/`
- Exports: none
- External assets: none; all geometry and materials are authored in the scene

## Project structure

```text
Laundromat/
  README.md
  laundromat.blend
  .gitignore
  Documents/
  assets/
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
- Harness-selected Blender is 5.2 on this machine.
- Main file: `laundromat.blend` in the project root.
- One scene, simple materials, no external files; all paths relative.

## Workflow

- Autonomy: Fully Autonomous, recorded in [`Documents/WORKFLOW.md`](Documents/WORKFLOW.md).
- Review: `Single` with the `visual` grader, recorded in [`Documents/REVIEW.md`](Documents/REVIEW.md); rounds live in [`Documents/Reviews/`](Documents/Reviews/README.md).
- Every reviewable change ran begin, apply tickets, seal, `look`, review, commit, checkpoint. Final round R07 passed full-spec review.

## External assets

None. Every prop, surface, and light was authored through reviewed harness operations; no third-party assets or generated media are used.

## Goals

- [`01-project-brief.md`](Documents/Goals/01-project-brief.md)

## References

- [`Documents/References/README.md`](Documents/References/README.md)
- Reference answer: `none`; no reference files or links supplied.

## Open questions

- None.

## Next steps

- [x] Build the interior shell and lighting.
- [x] Build both machine rows.
- [x] Furnish the room and add signage.
- [x] Save, seal, inspect, review, and deliver the hero render.
