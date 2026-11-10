# Review Mode — Laundromat

Mode: Single
Selected: 2026-11-10
Last changed: 2026-11-10
Single grader: visual

## Modes

- `Off` — no grader subagents; the orchestrator self-reviews with `look`.
- `All` — every configured grader reviews each round in batches bounded by configured `max_parallel`.
- `Single` — only the grader named above reviews.

Configured graders in `.kilo/blender-project-harness/config.json`: `visual`, `technical`, `spec`. This project uses the `visual` grader for every reviewable change, with its configured backup model. If the grader is missing, disabled, or unavailable, production stops instead of downgrading to self-review.

## Change log

| Date | Mode | Single grader | Source |
|---|---|---|---|
| 2026-11-10 | Single | visual | Runtime answers: "Single", "visual" |
