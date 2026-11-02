# Review Mode — HarnessLiveTest

Mode: Single
Selected: 2026-11-02
Last changed: 2026-11-02
Single grader: visual

## Modes

- `Off` — no grader subagents; the orchestrator self-reviews with `look`.
- `All` — every configured grader reviews each round.
- `Single` — only the grader named above reviews.

This validation run uses `Single` with `visual` so the configured primary/backup model path and the grader report path are exercised. The final review must be `PASS` with no genuine unresolved blocker or major.

## Change log

| Date | Mode | Single grader | Source |
|---|---|---|---|
| 2026-11-02 | Single | visual | User-requested live harness validation run |
