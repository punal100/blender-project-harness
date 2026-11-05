# Review Mode — CozyLaundromat

Mode: All
Selected: 2026-11-05
Last changed: 2026-11-05
Single grader: —

## Modes

- `Off` — no grader subagents; the orchestrator self-reviews with `look`.
- `All` — every configured grader reviews each round in batches bounded by configured `max_parallel`.
- `Single` — only the grader named above reviews.

`All` is selected. Configured graders are `visual`, `technical`, and `spec`. Every reviewable change is graded before approval and commit. Missing or disabled required grader configuration stops production; it never downgrades to self-review.

## Change log

| Date | Mode | Single grader | Source |
|---|---|---|---|
| 2026-11-05 | All | — | User selected review mode before scaffolding. |
