# CozyRetroRoom

Status: In production (prelaunch)
Last updated: 2026-10-31

## Purpose

A cozy 1970s wood-panelled room with a bulky CRT computer as its focal point, built as one polished hero still for a general viewer.

## What this project is

A single still scene of a warmly lit 1970s corner study: wood panelling, warm orange and brown furnishings, a chunky beige CRT monitor with a separate desktop tower, period desk accessories, a lamp, a window, and a chair. Intended audience: general viewers who should read "cozy retro computer room" at a glance. The deliverable is the scene plus one 1920x1080 hero render.

## Requirements

Confirmed scope and acceptance criteria: [`Documents/REQUIREMENTS.md`](Documents/REQUIREMENTS.md).

- Hero still of a 1970s room; the computer setup is the clear focal subject.
- Eye-level 3/4 corner desk vignette with CRT, tower, keyboard, lamp, window, chair.
- Warm soft interior lighting and deliberate materials; no default gray surfaces.
- Saved scene `cozyretroroom.blend` plus one 1920x1080 render in `renders/final/`.
- No floating/clipping props, no missing files, clean legible render.

## Visual direction

- Style: stylized period-realistic interior; chunky 1970s hardware, not product-accurate.
- Mood / references: cozy, lived-in, warm evening study.
- Colour and lighting: burnt orange, brown, beige, avocado accents; warm lamp key plus soft window fill.
- Camera / framing: eye-level 3/4 view into a desk corner, computer off-center but dominant.
- Scale and units: metric, real-world desk scale (~0.75 m desk height, ~0.4 m CRT depth).

## Deliverables

- Main Blender file: `cozyretroroom.blend` (planned at project root until first save)
- Final renders: `renders/final/`
- Exports: `exports/` (none planned)
- Documentation: `Documents/`
- External assets: `assets/external/`

## Project structure

```text
CozyRetroRoom/
  README.md
  cozyretroroom.blend
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
- Launch from the workspace root with the validated launcher:
  `.\tools\start-blender.cmd "Blender\CozyRetroRoom"`
- Before launch, require confirmed requirements, selected workflow and review records, and an active
  filled goal. The launcher validates project records, keeps the `.blend`
  inside this project, reads the workspace MCP port, and rejects conflicting workspace instances.
- Each launch opens a log terminal and writes to `logs/blender-<timestamp>.log`; `logs/` is ignored.
- Main file: save the first scene as `cozyretroroom.blend` in the project root. Before production
  edits, verify MCP scene settings report that exact path.
- Keep external paths relative (`//assets/...`); do not use absolute paths.
- Only one Blender project spawned by this workspace may be open at a time. Close the current one
  before opening another.

## Workflow

- Autonomy mode: Fully Autonomous — [`Documents/WORKFLOW.md`](Documents/WORKFLOW.md).
- Review mode: All (`visual`, `technical`, `spec` graders) — [`Documents/REVIEW.md`](Documents/REVIEW.md);
  rounds live in [`Documents/Reviews/`](Documents/Reviews/README.md).
- Every meaningful saved change is sealed, inspected, graded, committed, and checkpointed before the
  next bounded change. Failed rounds commit before fixes.
- Completion requires the saved inspected review render, current documents, and a final applicable
  `PASS` with no genuine unresolved blocker or major finding.

## External assets

See [`Documents/ASSETS.md`](Documents/ASSETS.md) and [`assets/external/README.md`](assets/external/README.md).

- No external assets: the scene is built from primitive-level geometry and procedural materials.

## Goals

Goal prompts live in [`Documents/Goals/`](Documents/Goals/). Multiple goals are allowed.

- [`01-project-brief.md`](Documents/Goals/01-project-brief.md) — active goal.

## References

- [`Documents/References/README.md`](Documents/References/README.md)
- No external references collected; direction comes from confirmed requirements.

## Open questions

- None.

## Next steps

- [ ] Register the goal and launch Blender.
- [ ] Save the scene, build the room, desk, computer, decor, lighting, and camera in bounded changes.
- [ ] Seal, inspect, grade, commit, and checkpoint each change.
- [ ] Produce and inspect the final 1920x1080 hero render; finish the final `PASS` round.
