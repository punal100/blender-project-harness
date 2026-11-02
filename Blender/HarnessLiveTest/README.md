# HarnessLiveTest

Status: Confirmed
Last updated: 2026-11-02

## Purpose

Validate the harness on a small, deterministic Blender scene.

## What this project is

A single-cube validation scene for the workspace harness, with one camera, one light, and one sealed review render. It is intentionally simple so lifecycle, task, shell-approval, model, and review behavior can be checked without a large art scope.

## Requirements

Confirmed scope and acceptance criteria: [`Documents/REQUIREMENTS.md`](Documents/REQUIREMENTS.md).

- [x] One neutral cube on a plane.
- [x] Three-quarter camera framing and a warm key light.
- [x] Saved scene and inspected final render.
- [x] Single visual grader review.

## Visual direction

- Style: clean neutral studio validation.
- Mood / references: calm, simple, readable silhouette.
- Colour and lighting: soft warm key, neutral grey cube, dark neutral background.
- Camera / framing: three-quarter view, cube centered with clear margins.
- Scale and units: 1 m cube, 1 m plane, metric.

## Deliverables

- Main Blender file: `harnesslivetest.blend` (project root).
- Final renders: `renders/final/`.
- Exports: none required.
- Documentation: `Documents/`.
- External assets: none.

## Project structure

```text
HarnessLiveTest/
  README.md
  harnesslivetest.blend
  Documents/
  assets/
  renders/
  exports/
  scenes/
  scripts/
  backups/
```

## Blender

- MCP port: owned by the workspace root `.kilo/kilo.jsonc`.
- Launch and stop with `blender_workflow` `launch`/`stop`; never invoke Blender from the shell.
- Save as `harnesslivetest.blend` in the project root and keep all paths relative.
- Only one Blender project spawned by this workspace may be open at a time.

## Workflow

- Autonomy: Fully Autonomous (`Documents/WORKFLOW.md`).
- Review: Single, grader `visual` (`Documents/REVIEW.md`).
- The goal and records are frozen after registration; changes require re-registration.
- Complete required review before the final commit and completion.

## External assets

None. See [`Documents/ASSETS.md`](Documents/ASSETS.md).

## Goals

- [`01-project-brief.md`](Documents/Goals/01-project-brief.md)

## References

- [`Documents/References/README.md`](Documents/References/README.md)

## Open questions

- None.

## Next steps

- [x] Confirm requirements and modes.
- [ ] Scaffold, register, and start the goal.
- [ ] Save the scene, seal and inspect the render, review, commit, and checkpoint.
