# CozyRetroDen

Status: In progress
Last updated: 2026-10-31

## Purpose

Cozy 1980s home computer den interior in stylized realism, delivered as one hero Cycles still.

## What this project is

A single-room Blender scene of a warmly lit 1980s home-computer den. The intended audience is anyone
who wants a nostalgic, cozy period interior image. The visual result is a wide three-quarter interior
view in which a beige CRT computer on a wooden desk is the focal point, surrounded by wood panelling,
a shag rug, shelves of period clutter, posters, curtains, and warm practical lamps with a cool CRT
glow as accent.

## Requirements

Confirmed scope and acceptance criteria: [`Documents/REQUIREMENTS.md`](Documents/REQUIREMENTS.md).

- One recognisable 1980s home-computer den interior, one hero still, no animation or characters.
- Stylized realism, PBR procedural materials, warm incandescent practicals plus CRT glow.
- Computer is the focal point in a wide three-quarter view.
- All geometry and materials procedural; no external assets.
- Cycles render, final PNG in `renders/final/`.

## Visual direction

- Style: stylized realism; believable scale, slightly idealized shapes, clean but lived-in.
- Mood / references: nostalgic 1980s home den; golden, cozy, gently cluttered.
- Colour and lighting: warm browns and oranges, beige computer plastics, small saturated poster/clutter accents; tungsten practicals with cool CRT screen glow.
- Camera / framing: wide three-quarter interior view at roughly standing/seated eye level; desk and CRT computer as focal point.
- Scale and units: metric, real-world room scale (room roughly 4 x 4 x 2.7 m); desk and chair at believable human scale.

## Deliverables

- Main Blender file: `cozyretroden.blend` (planned at project root until first save)
- Final renders: `renders/final/`
- Exports: `exports/` (none required)
- Documentation: `Documents/`
- External assets: none; procedural only

## Project structure

```text
CozyRetroDen/
  README.md
  cozyretroden.blend
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
  `.\tools\start-blender.cmd "Blender\CozyRetroDen"`
- Before launch, require confirmed requirements, selected workflow and review records, and an active
  filled goal. The launcher validates project records, keeps the `.blend` inside this project, reads
  the workspace MCP port, and rejects conflicting workspace instances.
- Each launch opens a log terminal and writes to `logs/blender-<timestamp>.log`; `logs/` is ignored.
- Main file: save the first scene as `cozyretroden.blend` in the project root. Before production
  edits, verify MCP scene settings report that exact path; then replace the planned status above.
- Keep external paths relative (`//assets/...`); do not use absolute paths.
- Only one Blender project spawned by this workspace may be open at a time. Close the current one
  before opening another.

## Workflow

- Autonomy mode: **Fully Autonomous** — see [`Documents/WORKFLOW.md`](Documents/WORKFLOW.md).
- Review mode: **All** — see [`Documents/REVIEW.md`](Documents/REVIEW.md); rounds live in
  [`Documents/Reviews/`](Documents/Reviews/README.md).
- Production proceeds within confirmed requirements without approval pauses, saves and inspects every
  meaningful change, completes all three configured graders each round, and checkpoints before the
  next bounded change. Stop only for blockers, scope changes, or irreversible choices.
- Require the saved inspected review render, current documents, and final applicable `PASS` before completion.

## External assets

See [`Documents/ASSETS.md`](Documents/ASSETS.md) and [`assets/external/README.md`](assets/external/README.md).

- No external assets. All geometry and materials are procedural, per confirmed requirements.

## Goals

Goal prompts live in [`Documents/Goals/`](Documents/Goals/). Multiple goals are allowed.

- [`01-project-brief.md`](Documents/Goals/01-project-brief.md) — active

## References

- [`Documents/References/README.md`](Documents/References/README.md)
- No external references collected; visual direction is defined by the confirmed requirements.

## Open questions

- None blocking. Cycles samples, panelling style, poster subjects, and clutter details are
  implementation choices within the confirmed direction.

## Next steps

- [ ] Launch Blender, save the declared main scene, and verify its exact path.
- [ ] Build the room shell, desk, CRT computer, chair, shelves, and clutter.
- [ ] Add procedural materials, practical lighting, and camera framing.
- [ ] Save, seal, inspect the final render, complete the review round, commit, and checkpoint.
