# Laundromat

Status: Active
Last updated: 2026-11-10

## Purpose

A realistic American coin laundromat interior, delivered as one hero still.

## What this project is

An interior-only Blender scene of a small self-service coin laundromat, viewed from the entrance down the central aisle. Two facing rows of front-loading washers and dryers, folding tables, seating, vending, signage, and fluorescent ceiling lighting at real-world metric scale. The audience is a portfolio or cinematic environment study; the result must read as a believable neighborhood laundromat rather than a generic box of machines.

## Requirements

Confirmed scope and acceptance criteria: [`Documents/REQUIREMENTS.md`](Documents/REQUIREMENTS.md).

- REQ-01: Realistic American coin laundromat interior, interior only, about 8 x 12 m with a 2.9 m ceiling.
- REQ-02: Two facing rows with at least 10 front-loading machines, each with body, coin panel, round glass door, and drum rim.
- REQ-03: Folding tables, bench or plastic seating, soap/change vending, wall signage, clock, trash bins, tiled floor, drop ceiling with fluorescent panels.
- REQ-04: Simple physically plausible materials: painted metal, stainless steel, glass, glazed tile, matte paint, vinyl floor.
- REQ-05: Warm-white fluorescent ceiling light plus cool daylight spill from the storefront entrance.
- REQ-06: Hero camera at eye height (~1.6 m) at the entrance, 35-50 mm equivalent, straight down the aisle.
- REQ-07: Off-white walls, teal/sage machine faces, stainless trim, warm grey floor, no people.
- REQ-08: Save `laundromat.blend` and one 1920x1080 hero PNG render in `renders/final/`.
- REQ-09: README and supporting documents reflect the delivered state.

## Visual direction

- Style: photoreal small-business interior; modest wear, no stylization.
- Mood / references: quiet late-afternoon neighborhood laundromat; references `none`.
- Colour and lighting: off-white walls, teal/sage machine faces, stainless steel, warm grey floor; warm fluorescent ceiling light with cool daylight from behind the camera.
- Camera / framing: eye height 1.6 m at the entrance, 40 mm equivalent, one-point perspective down the aisle.
- Scale and units: metric; 1 unit = 1 m; room about 8 x 12 m; ceiling 2.9 m.

## Deliverables

- Main Blender file: `laundromat.blend` (planned at project root until first save)
- Final render: `renders/final/laundromat-hero.png` at 1920x1080
- Documentation: `Documents/`
- Exports: none planned
- External assets: none; all geometry and materials authored in the scene

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
- Harness-selected Blender is 5.2 on this machine; verify the live version at launch.
- Each launch writes `logs/blender-<timestamp>.log`; `logs/` is ignored.
- Main file: save the first scene as `laundromat.blend` in the project root.
- One scene, simple materials, no external files; keep paths relative.

## Workflow

- Autonomy: Fully Autonomous, recorded in [`Documents/WORKFLOW.md`](Documents/WORKFLOW.md).
- Review: `Single` with the `visual` grader, recorded in [`Documents/REVIEW.md`](Documents/REVIEW.md); rounds live in [`Documents/Reviews/`](Documents/Reviews/README.md).
- Every reviewable change runs begin, apply tickets, seal, `look`, review, commit, checkpoint.

## External assets

None. Every prop, surface, and light is authored through reviewed harness operations; no third-party assets are used.

## Goals

- [`01-project-brief.md`](Documents/Goals/01-project-brief.md)

## References

- [`Documents/References/README.md`](Documents/References/README.md)
- Reference answer: `none`; no reference files or links supplied.

## Open questions

- None.

## Next steps

- [ ] Commit bootstrap records and register the project.
- [ ] Launch Blender and save the initial scene.
- [ ] Build the laundromat structure, machines, props, and lighting.
- [ ] Save, seal, inspect, review, and deliver the hero render.
