# Workflow — Cozy Computer Room

Mode: Fully Autonomous
Selected: 2026-11-02
Last changed: 2026-11-02

## Current mode

Fully Autonomous. Proceed within the confirmed requirements without approval pauses; complete review and checkpoint every reviewable change. Stop for requirements conflicts, destructive or irreversible choices, missing assets or licences, missing required graders, or technical blockers.

## Rules

- Requirements were confirmed before scaffolding and are frozen after registration.
- Every reviewable change follows `begin` → apply tickets from `blender-worker` → WIP look every three applies and before seal → `seal` → `blender_look` → review → `commit` → `checkpoint`.
- Review mode `All` requires the visual, technical, and spec graders on every round; a missing or disabled required grader stops production.
- Project documents and project commits use harness actions only. Manual project Git commits are blocked.
- Completion requires the final applicable `PASS`, an inspected sealed render, current documents, and no genuine unresolved blocker or major finding.

## Change log

| Date | Mode | Reason | Confirmed by |
|---|---|---|---|
| 2026-11-02 | Fully Autonomous | Selected before scaffolding for this project. | User answer "Fully Autonomous" |
