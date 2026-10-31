# RetroTerminalNook

Status: Ready to build
Last updated: 2026-10-31

## Purpose

Build a cozy late-70s/early-80s desk corner for a general viewer: a wood-panelled nook with a
glowing green-phosphor CRT computer, warm lamp light, and period props that reads as lived-in and
inviting at first glance.

## What this project is

A single stylized-realistic interior vignette. The intended audience is anyone who enjoys retro
computing and cozy room scenes. The visual result is a warm, dark, wood-and-beige desk corner with
the CRT as focal point and green light spilling over the keyboard and desktop clutter.

## Requirements

Confirmed scope and acceptance criteria: [`Documents/REQUIREMENTS.md`](Documents/REQUIREMENTS.md).

- Desk-corner vignette, late 70s/early 80s, wooden desk, beige CRT with legible green screen.
- Props: cassette deck + tapes, floppies + manuals, mug + plant, posters + corkboard.
- Late-night lighting: warm desk lamp key, green CRT fill, no daylight.
- One 16:9 hero render at 1600x900 or larger. No external assets, people, or animation.

## Visual direction

- Style: stylized realistic; believable proportions, simplified detail, clean primitive-based forms.
- Mood / references: cozy late-night den; early-80s woodgrain CRT ([CRT Database](https://crtdatabase.com/crts/sony/sony-kv-1961)); 70s shag and wood panelling ([Flooring America](https://www.flooringamerica.com/blog/70s-inspired-interior-design-ideas-trends)).
- Colour and lighting: dark warm browns, mustard/avocado/burnt-orange accents, beige plastics; warm lamp pool, green screen spill, dim ambient.
- Camera / framing: 16:9, roughly seated eye level, three-quarter toward desk; CRT, keyboard, and props readable.
- Scale and units: metric real-world scale. Desk about 1.4 x 0.7 x 0.75 m; CRT about 0.42 m wide.

## Deliverables

- Main Blender file: `retroterminalnook.blend` (planned at project root until first save)
- Final renders: `renders/final/` — one hero PNG, 16:9, at least 1600x900
- Exports: `exports/` — none planned
- Documentation: `Documents/`
- External assets: none

## Project structure

```text
RetroTerminalNook/
  README.md
  retroterminalnook.blend
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
- Launch from the workspace root: `.\tools\start-blender.cmd "Blender\RetroTerminalNook"`
- Each launch opens a log terminal and writes to `logs/blender-<timestamp>.log`; `logs/` is ignored.
- Main file: save the first scene as `retroterminalnook.blend` in the project root. Before production
  edits, verify MCP scene settings report that exact path; then replace the planned status above.
- Keep external paths relative (`//assets/...`); no external assets are planned.
- Only one Blender project spawned by this workspace may be open at a time.

## Workflow

- Autonomy mode: Fully Autonomous — recorded in [`Documents/WORKFLOW.md`](Documents/WORKFLOW.md).
- Review mode: All — recorded in [`Documents/REVIEW.md`](Documents/REVIEW.md); rounds live in
  [`Documents/Reviews/`](Documents/Reviews/README.md).
- Each meaningful change is saved, inspected with `look`, sealed, reviewed by the configured
  graders, committed atomically, and checkpointed before the next change.
- Require the saved inspected review render and final applicable `PASS` before completion.

## External assets

None. The scene is built from supported primitive operations and procedural materials only. See
[`Documents/ASSETS.md`](Documents/ASSETS.md).

## Goals

- [`01-project-brief.md`](Documents/Goals/01-project-brief.md) — active production goal.

## References

- [`Documents/References/README.md`](Documents/References/README.md)
- [CRT Database — Sony KV-1961](https://crtdatabase.com/crts/sony/sony-kv-1961)
- [Flooring America — 1970s interior design](https://www.flooringamerica.com/blog/70s-inspired-interior-design-ideas-trends)

## Open questions

- None.

## Next steps

- Start the recorded goal and complete harness registration.
- Launch Blender, save the declared `.blend`, and build the scene in bounded changes.
- Seal, inspect, grade, and checkpoint each change; finish with the hero render and `PASS`.
