# CozyRoom

Status: Active
Last updated: 2026-11-01

## Purpose

Build a warm, stylized evening room whose computer desk is the clear focal point, and deliver it as a polished single hero render from a saved Blender scene.

## What this project is

A self-contained 3D interior scene for portfolio and mood presentation: a lived-in room with a desk, glowing monitor, books, plants, and soft furnishings, framed from seated monitor height. The result is one calm, inviting 1920×1080 EEVEE still.

## Requirements

Confirmed scope and acceptance criteria: [`Documents/REQUIREMENTS.md`](Documents/REQUIREMENTS.md).

- Enclosed room shell with desk, chair, monitor, keyboard, mouse, and desk props; computer is the focal point.
- Warm practical and monitor light plus cool dusk window fill; stylized warm-cool palette.
- One 16:9 hero camera at about 1.25 m and one 1920×1080 EEVEE review render.
- All geometry built in-scene from harness primitives; no external models.
- Every reviewable change graded by visual, technical, and spec graders.

## Visual direction

- Style: warm stylized game-art interior with handcrafted-looking, simple geometry.
- Mood / references: calm, lived-in, inviting; evening lamp light with a cool dusk window.
- Colour and lighting: amber and terracotta against teal-blue dusk; warm practicals, monitor glow, soft shadows.
- Camera / framing: single hero shot from seated monitor height (about 1.25 m), 3/4 angle toward the desk, computer centered, 16:9.
- Scale and units: real-world metres; room about 4.0 × 3.5 m with 2.7 m ceiling; 27-inch monitor, 1.4 m desk.

## Deliverables

- Main Blender file: `cozyroom.blend` (planned at project root until first save)
- Final renders: `renders/final/` (sealed review render)
- Exports: none; `exports/` stays empty for this goal
- Documentation: `Documents/`
- External assets: none planned; any CC0 texture or HDRI must be registered in `Documents/ASSETS.md` before use

## Project structure

```text
CozyRoom/
  README.md
  cozyroom.blend
  .gitignore
  Documents/
    README.md
    REQUIREMENTS.md
    WORKFLOW.md
    REVIEW.md
    ASSETS.md
    DECISIONS.md
    TASKS.md
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
- Main file: save the first scene as `cozyroom.blend` in the project root and verify the MCP settings report that exact path before production edits.
- Keep external paths relative (`//assets/...`); do not use absolute paths.
- Only one Blender project spawned by this workspace may be open at a time.

## Workflow

- Autonomy mode: Fully Autonomous, recorded in [`Documents/WORKFLOW.md`](Documents/WORKFLOW.md).
- Review mode: All; visual, technical, and spec graders review every reviewable change, recorded in [`Documents/REVIEW.md`](Documents/REVIEW.md); rounds live in [`Documents/Reviews/`](Documents/Reviews/README.md).
- Changes follow `begin` → apply tickets → `save`/`seal` → `look` → grading → `review` → `checkpoint`; review auto-commits in Fully Autonomous mode.
- Completion requires the saved inspected review render, current documents, and a final applicable `PASS` with no unresolved blocker or major.

## External assets

See [`Documents/ASSETS.md`](Documents/ASSETS.md) and [`assets/external/README.md`](assets/external/README.md).

- No external assets planned; the scene is built from harness primitives. Any addition must be registered first.

## Goals

Goal prompts live in [`Documents/Goals/`](Documents/Goals/). The active goal is:

- [`01-project-brief.md`](Documents/Goals/01-project-brief.md) — initial room brief.

## References

- [`Documents/References/README.md`](Documents/References/README.md)
- No external references recorded; the confirmed brief and visual direction above are authoritative.

## Open questions

- None; requirements are confirmed and frozen after registration.

## Next steps

- [ ] Launch through the harness and save the first scene as `cozyroom.blend`.
- [ ] Build the room shell, workstation, set dressing, materials, lighting, and hero camera through bounded changes.
- [ ] Seal, inspect, grade, review, commit, and checkpoint each reviewable change.
- [ ] Complete final grading and update this README to the delivered state.
