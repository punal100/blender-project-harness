# CozyStudyRoom

Status: Revision in progress — final review pending
Last updated: 2026-11-03

## Purpose

A cozy, lived-in evening study room built in Blender, centered on a desktop computer workstation and delivered as a hero still render.

## What this project is

A single interior scene for portfolio-style presentation: warm lamp-lit study corner with a wooden desk, desktop PC and monitor, chair, mug, notebook, rug, shelf, plant, framed wall art, two books, and a folded blanket. Textured wood, fabric, floor, and plaster surfaces make the room read as occupied and comfortable, with the computer setup clearly the focal point.

## Requirements

Confirmed scope and acceptance criteria: [`Documents/REQUIREMENTS.md`](Documents/REQUIREMENTS.md).

- [x] Warm evening lamp-lit interior with a desktop PC as the focal point.
- [x] Three-quarter desk-corner hero camera at 16:9.
- [x] Real-world metric scale and physically plausible materials.
- [x] Saved `.blend` with packed/verified assets and a 1920x1080 PNG review render.
- [x] CC0 Poly Haven assets permitted with source and licence recorded.

## Visual direction

- Style: Realistic stylized interior, readable and clean, not photoreal clutter.
- Mood / references: Late-evening study, lamp glow, quiet and warm; lived-in but tidy.
- Colour and lighting: Warm amber key from desk lamp, cool low-level fill from window/ambient, wood brown, muted ochre, cream, deep shadow corners.
- Camera / framing: Three-quarter view from the room corner, desk and monitor centered, chair and lamp included, 16:9.
- Scale and units: Metric; room about 4 m x 4 m, desk 0.75 m tall, monitor 0.55 m wide.

## Deliverables

- Main Blender file: `cozystudyroom.blend` (saved at project root)
- Final review render: sealed 1920x1080 PNG evidence in `Documents/Reviews/`
- Exports: `exports/`
- Documentation: `Documents/`
- External assets: `assets/external/`

## Project structure

```text
CozyStudyRoom/
  README.md
  cozystudyroom.blend
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
- Before launch, require confirmed requirements, selected workflow and review records, and an active
  filled goal. The harness validates project records, keeps the `.blend` inside this project, reads
  the workspace MCP port, records the instance outside the repository, and rejects conflicting
  workspace instances.
- Each launch writes `logs/blender-<timestamp>.log`; `logs/` is ignored.
- Main file: save the first scene as `cozystudyroom.blend` in the project root. Before production
  edits, verify MCP scene settings report that exact path.
- Keep external paths relative (`//assets/...`); do not use absolute paths.
- Only one Blender project spawned by this workspace may be open at a time. Close the current one
  before opening another.

## Workflow

- Record the selected autonomy mode in [`Documents/WORKFLOW.md`](Documents/WORKFLOW.md).
- Record review mode `Off`, `All`, or `Single` in [`Documents/REVIEW.md`](Documents/REVIEW.md);
  rounds live in [`Documents/Reviews/`](Documents/Reviews/README.md).
- After registration, workflow and review modes are frozen. A requested mode change stops production
  for explicit re-registration.
- In Partially Autonomous mode, the agent seals, inspects, completes required grading, and obtains
  approval or revision direction before the next reviewable change commits.
- Require the saved inspected review render, current documents, and final applicable `PASS` when
  grading is enabled before completion; no genuine unresolved blocker or major finding permits it.

## External assets

See [`Documents/ASSETS.md`](Documents/ASSETS.md) and [`assets/external/README.md`](assets/external/README.md).

- User files are brought in through `blender_workflow {action:"intake"}`; originals are never moved.
- No external assets are used. All materials are procedural, so the scene has no missing-file dependencies and no third-party data to pack or license.

## Goals

Goal prompts live in [`Documents/Goals/`](Documents/Goals/). Multiple goals are allowed.
Identify the active goal's actual path; use it for grading rather than assuming the first brief.

- [`01-project-brief.md`](Documents/Goals/01-project-brief.md)

## References

- [`Documents/References/README.md`](Documents/References/README.md)
- Add links, moodboards, and source references here.

## Open questions

- None; requirements confirmed before scaffolding.

## Next steps

- [x] Persist the exact confirmed requirements and workflow/review answers collected before scaffold.
- [x] Fill the active goal, register, launch, and build the scene.
- [x] Confirm no external assets are required; all materials are procedural.
- [x] Build the scene, save and inspect a review render, and complete grading and commits.
