---
name: blender-project-readme
description: Use when creating or updating a Blender project README. Enforces the required project sections and harness-owned document path.
---

# Blender Project README

Canonical template: `../../../tools/harness/templates/project/README.md`. Write the project copy
at `Blender/<Project>/README.md` through `bootstrap-document` before registration or `document`
inside a declared bounded change.

## Required sections

Keep this order. Each heading MUST appear exactly once.

1. Project title.
2. Purpose: one concrete paragraph.
3. What this project is: subject, audience, visual result.
4. Requirements: link to confirmed `Documents/REQUIREMENTS.md`; summarize only the highest-priority
   points. Do not duplicate the requirement register.
5. Visual direction: style, references, colour, lighting, camera, scale.
6. Deliverables: main `.blend`, final renders, exports, documents.
7. Project structure: actual folders and authoritative `.blend`.
8. Blender: workspace MCP port, harness launch/stop, run log, main file, relative paths, one-instance
   rule.
9. Workflow: links to `Documents/WORKFLOW.md` and `Documents/REVIEW.md`; selected modes; review index.
10. External assets: summary plus links to `Documents/ASSETS.md` and
    `assets/external/README.md`.
11. Goals: index of `Documents/Goals/*.md`.
12. References: links to `Documents/References/`.
13. Open questions and next steps.

The harness validates `Status:` and `Last updated:` fields. Replace instructional placeholders with
project facts. Do not invent requirements or asset details; link to their registers.

## Validation

- Every deliverable path MUST exist or be explicitly planned.
- Requirements MUST be confirmed and linked.
- Workflow and review records MUST contain selected modes and be linked.
- The authoritative `.blend` path MUST match the MCP settings after the first save.
- External assets MUST be registered and linked.
- The goal index MUST match `Documents/Goals/` and identify the active goal.
- Before completion, the README MUST reflect the delivered state, inspected review render, and final
  applicable review result.
