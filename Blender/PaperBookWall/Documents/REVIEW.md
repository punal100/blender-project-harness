# Review Mode — PaperBookWall

Mode: All
Selected: 2026-11-01
Last changed: 2026-11-01
Single grader: —

Selection: user answered "All" on 2026-11-01. All three configured graders (visual, technical,
spec) review each round in batches bounded by `max_parallel`.

## Modes

- `Off` — no grader subagents; the orchestrator self-reviews with `look`.
- `All` — every configured grader reviews each round in batches bounded by configured `max_parallel`.
- `Single` — only the grader named above reviews.

`Unset` is invalid once production starts. The user may switch modes at any pause.

On a genuine later return, ask workflow and review questions before resume and record the answers.
Routine approval, clarification, and manual-edit pauses within the same active task retain selected
modes without reasking. In `All` or `Single`, stop production on missing or disabled required grader
configuration. Complete required grading before every Partially Autonomous approval or
revision-direction question. Require a final applicable `PASS` and no genuine unresolved blocker or
major finding before completion; declining a genuine finding is not a waiver.

## Change log

| Date | Mode | Single grader | Source |
|---|---|---|---|
| 2026-11-01 | All | — | "All" |
