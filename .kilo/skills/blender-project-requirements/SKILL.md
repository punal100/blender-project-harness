---
name: blender-project-requirements
description: Use before creating a Blender project and whenever requirements are added or changed. Runs a user discussion and confirmation gate; stores confirmed requirements in Documents/REQUIREMENTS.md.
---

# Blender Project Requirements

Requirements are agreed with the user, not inferred. Do not scaffold, launch Blender, or start
production work until the user explicitly confirms them.

## Session gate

At session start or reset, resume or start a goal before this discussion. For a new project, start
a discovery goal before questioning; after the project is scaffolded, write the project goal file
and continue. Do not let an unconfirmed requirement become scene work.

## Discussion

1. Read `AGENTS.md` and the existing project docs.
2. If the project exists, read `Documents/REQUIREMENTS.md`, `WORKFLOW.md`, `README.md`,
   `DECISIONS.md`, and the goals.
3. Ask an open question in plain text: "What do you want to build?" for a new project, or "What
   should change?" for a revision.
4. Follow the thread. Use `question` for concrete choices, ambiguities, visual direction, scope,
   and acceptance. Keep options to 2-4. If the user asks to explain freely, stop using `question`
   and wait for their text.
5. Cover only relevant areas: purpose/problem, audience, visual outcome, deliverables, acceptance,
   constraints, external assets, and out of scope. Do not walk a checklist.
6. Challenge vague terms, make abstract ideas concrete, surface assumptions, and redirect scope
   creep into Deferred or Out of scope.
7. Reflect a concise draft back to the user. Ask with `question`:
   - "Confirm requirements" (recommended)
   - "Keep discussing"
   - "Change something"
8. Loop until the user explicitly confirms. Silence, a new topic, or "ok" is not confirmation.
9. On confirmation:
   - New project: scaffold, write `Documents/REQUIREMENTS.md` with `Status: Confirmed`, and add a
     change-log row. Then load `blender-project-workflow` and ask the mode.
   - Existing project: update `Documents/REQUIREMENTS.md` and its change log, then update the
     README, `DECISIONS.md`, and the goal before continuing.
10. Requirements may be added or changed at any time, but only after explicit user confirmation
    and a change-log row.

## Requirement format

- Use stable IDs: `REQ-01`, `REQ-02`, grouped by category.
- Make each requirement testable and user-visible where possible.
- Keep unresolved items under `Open questions`; keep acknowledged future work under `Deferred`.
- Keep explicit exclusions under `Out of scope` with a reason.

## Rules

- Do not invent requirements or fill gaps with defaults.
- Do not implement Blender changes during requirements discussion.
- Do not duplicate confirmed requirements in multiple documents; link to
  `Documents/REQUIREMENTS.md`.
- If a requirement change affects the current goal, update the goal or create a new goal before
  continuing.
- This is a design workspace: do not create `PLAN/` or verifier records.
