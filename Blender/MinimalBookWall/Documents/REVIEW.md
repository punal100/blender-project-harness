# Review Mode — MinimalBookWall

Mode: All
Selected: 2026-10-31
Last changed: 2026-10-31
Single grader: —

## Selection evidence

Question: "How should the scene be reviewed?"
Answer: "All (Recommended)"

Configured graders (validated from `config.json`): `visual`, `technical`, `spec`.
Configured `max_parallel`: 3. Configured `max_rounds`: 2.

## Modes

- `Off` — no grader subagents; the orchestrator self-reviews with `look`.
- `All` — every configured grader reviews each round in batches bounded by configured `max_parallel`.
- `Single` — only the grader named above reviews.

`Unset` is invalid once production starts. On a genuine later return, ask workflow and review questions
before resume and record the answers. Routine approval, clarification, and manual-edit pauses within
the same active task retain selected modes without reasking. In `All` or `Single`, stop production on
missing or disabled required grader configuration. Complete required grading before every Partially
Autonomous approval or revision-direction question. Require a final applicable `PASS` and no genuine
unresolved blocker or major finding before completion; declining a genuine finding is not a waiver.

## Change log

| Date | Mode | Single grader | Source |
|---|---|---|---|
| 2026-10-31 | Unset | — | Project scaffolded. |
| 2026-10-31 | All | — | User: "All (Recommended)" |
