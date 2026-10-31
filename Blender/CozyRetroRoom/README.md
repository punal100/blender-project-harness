# CozyRetroRoom

Status: In production — round 1 review BLOCKED, approval pending
Last updated: 2026-10-31

## Purpose

Build a cozy 1980s home-computer den as a single still hero shot: a beige CRT computer on an oak desk under a warm desk lamp, with teal monitor glow, wood paneling, and period props.

## What this project is

A nostalgic retro interior vignette for viewers who enjoy 1980s home computing and cozy room aesthetics. The result is one desk-corner hero image where the computer is the clear focal point and the room supports it with period texture, warm light, and quiet detail.

## Requirements

Confirmed scope and acceptance criteria: [`Documents/REQUIREMENTS.md`](Documents/REQUIREMENTS.md).

- 1980s beige-PC den with a beige CRT computer and keyboard on an oak desk.
- Close-medium 16:9 desk-corner hero composition; window edge visible.
- Warm amber desk lamp plus teal-green CRT glow; cohesive warm/teal palette.
- One 1920×1080 review render; scene opens without missing files.

## Visual direction

- Style: 1980s home-computer den, physical and lived-in, not stylised cartoon.
- Mood / references: quiet evening, nostalgic, warm, slightly cluttered but composed.
- Colour and lighting: amber lamp pool, teal CRT spill, oak browns, beige plastics, soft shadows.
- Camera / framing: close-medium 16:9 from the room side of the desk, computer near-centred, eye level or slightly low.
- Scale and units: real-world metric; desk ~0.75 m high, CRT monitor roughly 0.30–0.40 m wide.

## Deliverables

- Main Blender file: `cozyretroroom.blend` (saved at project root; path verified by MCP scene settings)
- Final renders: `renders/final/`
- Exports: `exports/`
- Documentation: `Documents/`
- External assets: `assets/external/`

## Project structure

```text
CozyRetroRoom/
  README.md
  cozyretroroom.blend
  .gitignore
  Documents/
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
- Launch from the workspace root with `.\tools\start-blender.cmd "Blender\CozyRetroRoom"`.
- Each launch opens a log terminal and writes to `logs/blender-<timestamp>.log`; `logs/` is ignored.
- Main file: `cozyretroroom.blend` is saved in the project root and verified with MCP scene settings.
- Keep external paths relative (`//assets/...`); do not use absolute paths.
- Only one Blender project spawned by this workspace may be open at a time.

## Workflow

- Autonomy: Partially Autonomous — [`Documents/WORKFLOW.md`](Documents/WORKFLOW.md).
- Review mode: All (visual, technical, spec) — [`Documents/REVIEW.md`](Documents/REVIEW.md).
- Review rounds: [`Documents/Reviews/README.md`](Documents/Reviews/README.md).
- Save, inspect with `look`, complete required grading, then obtain approval or revision direction before the next meaningful change.
- Pause before any necessary question during an active goal; resume only on an answer that permits continuation.

## External assets

See [`Documents/ASSETS.md`](Documents/ASSETS.md) and [`assets/external/README.md`](assets/external/README.md).

- No external assets yet. Procedural modeling and materials are preferred.

## Goals

Goal prompts live in [`Documents/Goals/`](Documents/Goals/). Active goal path: [`Documents/Goals/01-project-brief.md`](Documents/Goals/01-project-brief.md).

- [`01-project-brief.md`](Documents/Goals/01-project-brief.md)

## References

- [`Documents/References/README.md`](Documents/References/README.md)
- No external references collected yet; the confirmed brief defines the visual direction.

## Open questions

- None.

## Next steps

- [x] Launch Blender, save `cozyretroroom.blend`, and verify the path.
- [x] Build room shell, desk, CRT computer, props, materials, lighting, and camera.
- [x] Save and inspect the first review render; capture round `R01-20261031T095604Z`.
- [ ] Resolve open round 1 findings: lamp shadow speckling, flat shag rug, floppy stack, keyboard seat, chair seat gap.
- [ ] Re-capture evidence and complete round 2 review.
- [ ] Update docs and commit verified changes.
