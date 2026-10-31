# Review Mode — RetroTerminalNook

Mode: All
Selected: 2026-10-31
Last changed: 2026-10-31
Single grader: —

## Modes

- `Off` — no grader subagents; the orchestrator self-reviews with `look`.
- `All` — every configured grader reviews each round in batches bounded by configured `max_parallel`.
- `Single` — only the grader named above reviews.

Grading is enabled in `config.json` with the `visual`, `technical`, and `spec` graders. `All` requires
each of them for every meaningful saved visual state.

On a genuine later return, ask workflow and review questions before resume. Routine approval,
clarification, and manual-edit pauses within the same active task retain selected modes without
reasking. Require a final applicable `PASS` and no genuine unresolved blocker or major finding before
completion; declining a genuine finding is not a waiver.

## Change log

| Date | Mode | Single grader | Source |
|---|---|---|---|
| 2026-10-31 | All | — | "All" |
