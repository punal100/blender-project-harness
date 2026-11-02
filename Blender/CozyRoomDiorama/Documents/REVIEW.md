# Review Mode — CozyRoomDiorama

Mode: All
Selected: 2026-11-03
Last changed: 2026-11-03
Single grader: —

## Modes

- `Off` — no grader subagents; the orchestrator self-reviews with `look`.
- `All` — every configured grader reviews each round in batches bounded by configured `max_parallel`.
- `Single` — only the grader named above reviews.

`All` is selected: the configured visual, technical, and spec graders review every sealed round.
Missing or disabled required grading stops production; never downgrade silently to self-review.
Complete required grading before every approval or revision-direction question. Require a final
applicable `PASS` and no genuine unresolved blocker or major finding before completion; declining a
genuine finding is not a waiver.

## Change log

| Date | Mode | Single grader | Source |
|---|---|---|---|
| 2026-11-03 | All | — | User selected all configured graders (visual, technical, spec) before scaffolding. |
