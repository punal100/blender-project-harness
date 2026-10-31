---
name: blender-project-readme
description: Use when creating or updating a Blender project README. Enforces the required sections for purpose, requirements, visual direction, deliverables, external assets, and goals.
---

# Blender Project README

Canonical template: `../blender-project-scaffold/templates/project/README.md`. Write the project copy
at `Blender/<Project>/README.md`.

## Required sections

- Purpose: one concrete paragraph.
- What this project is: subject, audience, visual result.
- Requirements: link to confirmed `Documents/REQUIREMENTS.md` and summarize only the highest-priority
  points; do not duplicate the requirement register.
- Visual direction: style, references, colour, lighting, camera, scale.
- Deliverables: main `.blend`, final renders, exports, documents.
- Project structure: the actual folders and the authoritative `.blend`.
- Blender: workspace MCP port from the root config, harness launch/stop, run log and ignored
  `logs/` folder, main file, relative-path rule, and the one-active-instance rule.
- Workflow: link to `Documents/WORKFLOW.md` and `Documents/REVIEW.md`; state the selected autonomy
  and review modes and link to the review-round index.
- External assets: summary plus links to `Documents/ASSETS.md` and
  `assets/external/README.md`. If there are none, say so explicitly.
- Goals: index of `Documents/Goals/*.md`.
- References: links to `Documents/References/`.
- Open questions and next steps.

Keep the section order. Remove instructional placeholders; replace them with project facts.

## Quality bar

- Write for a new collaborator who has not seen the project.
- Derive requirements from the confirmed `Documents/REQUIREMENTS.md`; do not invent or silently
  extend them. Mark unknowns as `TBD`.
- Keep asset details in `Documents/ASSETS.md`; the README links to it instead of duplicating the
  register.
- Use relative links and paths.
- Update `Last updated` and `Status` whenever scope, assets, or deliverables change.

## Validate

- Verify every deliverable path exists or is explicitly planned.
- Verify `Documents/REQUIREMENTS.md` is confirmed and the README links to it.
- Verify `Documents/WORKFLOW.md` and `Documents/REVIEW.md` contain selected modes and README links.
- During prelaunch bootstrap, mark the authoritative `.blend` path planned and check its project
  location and slug without launching Blender. After the first save and before production acceptance,
  require that path to match MCP `get_scene_info(fields=["settings"])`; stop on mismatch.
- Verify external assets are registered and the README links to the register.
- Verify the goal index matches `Documents/Goals/`; identify the active goal's actual path.
- Before marking complete, require a saved inspected review render and the final applicable `PASS`
  when grading is enabled, with no genuine unresolved blocker or major finding. Keep `REVIEW.md`
  and review-round links current.
