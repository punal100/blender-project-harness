# Review Mode — CozyRetroDen

Mode: All
Selected: 2026-10-31
Last changed: 2026-10-31
Single grader: —

Exact selection: "All (Recommended)" — every configured grader reviews each round.

## Modes

- `Off` — no grader subagents; the orchestrator self-reviews with `look`.
- `All` — every configured grader reviews each round in batches bounded by configured `max_parallel`.
- `Single` — only the grader named above reviews.

`Unset` is invalid once production starts. Collect the mode answer after requirements confirmation
and before scaffolding; persist the exact user answer and date here afterward and before filling and
starting the goal. Do not invent confirmation text. The user may switch modes at any pause.

On a genuine later return, ask workflow and review questions before resume and record the answers.
Routine approval, clarification, and manual-edit pauses within the same active task retain selected
modes without reasking. In `All` or `Single`, stop production on missing or disabled required grader
configuration. Complete required grading before every Partially Autonomous approval or
revision-direction question. Require a final applicable `PASS` and no genuine unresolved blocker or
major finding before completion; declining a genuine finding is not a waiver.

## Configured roster

`config.json` at the workspace root supplies three enabled graders under
`blender_subagents.graders` (`max_parallel` 3, `max_rounds` 2):

| Name | Focus |
|---|---|
| `visual` | composition, camera, lighting, colour, materials, mood, detail and storytelling |
| `technical` | scale, geometry, topology, render settings, missing files, scene health |
| `spec` | requirement and acceptance fidelity, scope, deliverable completeness |

## Change log

| Date | Mode | Single grader | Source |
|---|---|---|---|
| 2026-10-31 | All | — | User: "All (Recommended)" |
