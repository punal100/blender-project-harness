# Review Mode — Cozy Computer Room

Mode: All
Selected: 2026-11-02
Last changed: 2026-11-02
Single grader: —

## Modes

- `Off` — no grader subagents; the orchestrator self-reviews with `look`.
- `All` — every configured grader reviews each round in batches bounded by configured `max_parallel`.
- `Single` — only the grader named above reviews.

Selected mode: `All`. Every reviewable change is graded by the configured `visual`, `technical`, and `spec` graders before its verdict. Missing or disabled required grader configuration stops production.

## Change log

| Date | Mode | Single grader | Source |
|---|---|---|---|
| 2026-11-02 | All | — | User answer "All three graders" |
