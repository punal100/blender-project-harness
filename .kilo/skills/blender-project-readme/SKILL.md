---
name: blender-project-readme
description: Use when creating or updating a Blender project README. Enforces the required sections for purpose, requirements, visual direction, deliverables, external assets, and goals.
---

# Blender Project README

Canonical template: `blender-project-scaffold/templates/project/README.md`. Write the project copy
at `Blender/<Project>/README.md`.

## Required sections

- Purpose: one concrete paragraph.
- What this project is: subject, audience, visual result.
- Requirements: functional, visual, technical, and delivery checklists.
- Visual direction: style, references, colour, lighting, camera, scale.
- Deliverables: main `.blend`, final renders, exports, documents.
- Project structure: the actual folders and the authoritative `.blend`.
- Blender: workspace MCP port from the root config, launch command, live log terminal and ignored
  `logs/` folder, main file, relative-path rule, and the one-active-instance rule.
- External assets: summary plus links to `Documents/ASSETS.md` and
  `assets/external/README.md`. If there are none, say so explicitly.
- Goals: index of `Documents/Goals/*.md`.
- References: links to `Documents/References/`.
- Open questions and next steps.

Keep the section order. Remove instructional placeholders; replace them with project facts.

## Quality bar

- Write for a new collaborator who has not seen the project.
- Do not invent requirements, asset licences, or visual decisions. Mark unknowns as `TBD`.
- Keep asset details in `Documents/ASSETS.md`; the README links to it instead of duplicating the
  register.
- Use relative links and paths.
- Update `Last updated` and `Status` whenever scope, assets, or deliverables change.

## Validate

- Every deliverable path exists or is explicitly planned.
- The stated `.blend` path is the one the MCP `get_scene_info(fields=["settings"])` reports.
- External assets are registered and the README links to the register.
- The goal index matches the files in `Documents/Goals/`.
