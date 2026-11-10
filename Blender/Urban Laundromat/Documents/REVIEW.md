# Review Mode — Urban Laundromat

Mode: Single
Selected: 2026-11-11
Last changed: 2026-11-11
Single grader: visual

Use a configured grader name from the project config, not the `blender-grader` agent name.

## Modes

- `Off` — no grader subagents; the orchestrator self-reviews with `look`.
- `All` — every configured grader reviews each round in batches bounded by configured `max_parallel`.
- `Single` — only the grader named above reviews.

`Unset` is invalid once production starts. Review mode is frozen after registration; a change requires explicit re-registration.

## Change log

| Date | Mode | Single grader | Source |
|---|---|---|---|
| 2026-11-11 | Single | visual | User selected Single (visual) for this project. |
