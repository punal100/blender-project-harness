---
name: blender-project-readme
description: Use when creating or updating a Blender project README. Enforces the required project sections and harness-owned document path.
---

# Blender Project README

Canonical template: `../../../.kilo/blender-project-harness/tools/harness/templates/project/README.md`. Write
the project copy at `Blender/<Project>/README.md` through `bootstrap-document` before registration or
`document` inside a declared bounded change. The harness validates `Status:` and `Last updated:`
fields. Replace instructional placeholders with project facts; link to registers instead of copying
them.

## Required sections

Keep this order. Each heading must appear exactly once.

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
10. External assets: summary plus links to `Documents/ASSETS.md` and `assets/external/README.md`.
    User files come through `intake`; never instruct the user to create folders or copy by hand.
11. Goals: index of `Documents/Goals/*.md`.
12. References: links to `Documents/References/`.
13. Open questions and next steps.

## Validation

- Every deliverable path must exist or be explicitly planned.
- Requirements must be confirmed and linked.
- Workflow and review records must contain selected modes and be linked.
- The authoritative `.blend` path must match the MCP settings after the first save.
- External assets must be registered and linked.
- The goal index must match `Documents/Goals/` and identify the active goal.
- Before completion, the README must reflect the delivered state, inspected review render, and final
  applicable review result.
