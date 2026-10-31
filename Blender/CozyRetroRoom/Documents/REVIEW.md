# Review Mode — CozyRetroRoom

Mode: All
Selected: 2026-10-31
Last changed: 2026-10-31
Single grader: —

Selection evidence: user chose "All (Recommended)" in answer to the review-mode question on 2026-10-31.

## Modes

- `Off` — no grader subagents; the controller self-reviews with `look`.
- `All` — every configured grader reviews each round in batches bounded by configured `max_parallel`.
- `Single` — only the grader named above reviews.

`Unset` is invalid once production starts. The user may switch modes at any pause.

Configured roster from `config.json`: `visual`, `technical`, `spec` (three graders, `max_parallel` 3,
`max_rounds` 2, grading enabled).

In `All` or `Single`, production stops on missing or disabled required grader configuration. Complete
required grading before every Partially Autonomous approval or revision-direction question. Require a
final applicable `PASS` and no genuine unresolved blocker or major finding before completion; declining
a genuine finding is not a waiver.

## Change log

| Date | Mode | Single grader | Source |
|---|---|---|---|
| 2026-10-31 | All | — | User: "All (Recommended)" |
