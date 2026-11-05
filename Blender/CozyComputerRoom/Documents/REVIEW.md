# Review Mode — CozyComputerRoom

Mode: All
Selected: 2026-11-05
Last changed: 2026-11-05
Single grader: —

## Modes

- `Off` — no grader subagents; the orchestrator self-reviews with `look`.
- `All` — every configured grader reviews each round in batches bounded by configured `max_parallel`.
- `Single` — only the grader named above reviews.

All configured graders (visual, technical, spec) review every reviewable change. The mode was selected before scaffolding and is frozen after registration. Stop production on missing or disabled required grader configuration. Complete required grading before every change review. Require a final applicable `PASS` and no genuine unresolved blocker or major finding before completion; declining a genuine finding is not a waiver.

## Change log

| Date | Mode | Single grader | Source |
|---|---|---|---|
| 2026-11-05 | All | — | User direction: "Review mode: All with visual, technical, and spec graders." |
