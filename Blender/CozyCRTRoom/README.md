# CozyCRTRoom

Status: In production (scene planned, not yet saved)
Last updated: 2026-10-31

## Purpose

Build one polished stylized low-poly still of a cozy 1990s room centered on a glowing CRT computer, with a rainy night window and warm lamp light.

## What this project is

A single-room Blender scene for a portfolio-style still image. The audience is anyone who wants a nostalgic "late-night computer room" mood: warm wood, beige hardware, soft fabric, clutter on shelves, cool rain outside. The deliverable is one deliberate 1920x1080 render, not a game asset or animation.

## Requirements

Confirmed scope and acceptance criteria: [`Documents/REQUIREMENTS.md`](Documents/REQUIREMENTS.md).

- Stylized low-poly 90s interior; no photoreal finish.
- CRT computer, keyboard, and desk with chair as the focal point.
- Window with night rain and curtains; bed or couch corner; shelves, posters, rug, and plant.
- Warm practical lamp against cool window light; eye-level 3/4 corner camera.
- One 1920x1080 still render, saved `.blend`, and current documents.

## Visual direction

- Style: Stylized low-poly 90s interior; simplified deliberate forms with clean bevels and flat/stylized materials.
- Mood / references: Warm, nostalgic, lived-in late-night computer room; cozy clutter rather than cyberpunk neon.
- Colour and lighting: Warm amber desk lamp and screen glow against cool blue rainy window light; muted browns, beige hardware, deep green/teal accents.
- Camera / framing: Eye-level 3/4 view into the room corner, desk and screen prominent, window and soft seating readable behind.
- Scale and units: Metric; room roughly 4 x 4 x 2.7 m, furniture and props at real-world scale.

## Deliverables

- Main Blender file: `cozycrtroom.blend` (planned at project root until first save)
- Final renders: `renders/final/`
- Exports: none planned
- Documentation: `Documents/`
- External assets: none planned; see [`Documents/ASSETS.md`](Documents/ASSETS.md)

## Project structure

```text
CozyCRTRoom/
  README.md
  cozycrtroom.blend          # planned until first ticketed save
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
- Launch from the workspace root: `.\tools\start-blender.cmd "Blender\CozyCRTRoom"`
- Each launch opens a log terminal and writes to `logs/blender-<timestamp>.log`; `logs/` is ignored.
- Main file: `cozycrtroom.blend` in the project root. It is planned until the first ticketed save; after that, MCP scene settings must report that exact path.
- Keep external paths relative (`//assets/...`); do not use absolute paths.
- Only one Blender project spawned by this workspace may be open at a time.

## Workflow

- Autonomy: Fully Autonomous, recorded in [`Documents/WORKFLOW.md`](Documents/WORKFLOW.md).
- Review: All (visual, technical, spec graders), recorded in [`Documents/REVIEW.md`](Documents/REVIEW.md); rounds live in [`Documents/Reviews/`](Documents/Reviews/README.md).
- Each meaningful change is saved, sealed, inspected with `look`, graded, committed as one scoped change, and checkpointed before the next change.
- The final state requires an applicable `PASS` and no unresolved blocker or major finding.

## External assets

None. All geometry and materials are authored in-scene unless a later confirmed requirement adds assets. See [`Documents/ASSETS.md`](Documents/ASSETS.md) and [`assets/external/README.md`](assets/external/README.md).

## Goals

- [`01-project-brief.md`](Documents/Goals/01-project-brief.md) — active goal: build the cozy retro CRT room.

## References

- [`Documents/References/README.md`](Documents/References/README.md)
- No external references collected; visual direction comes from the confirmed requirements.

## Open questions

- None.

## Next steps

- [ ] Launch Blender and save the bootstrap scene as `cozycrtroom.blend`.
- [ ] Build room shell, furniture, CRT computer, decor, materials, lighting, and camera in bounded changes.
- [ ] Save and seal the review render, complete grader rounds, and resolve findings.
- [ ] Update documents and finish with a clean checkpoint and final `PASS`.
