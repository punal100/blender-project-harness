---
name: blender-project-requirements
description: Use before creating a Blender project and whenever requirements are added or changed. Runs a confirmation discussion and stores confirmed requirements.
---

# Blender Project Requirements

Requirements are agreed with the user, never inferred. Production must not start until requirements
are confirmed, workflow and review modes are selected, the scaffold is committed, and registration is
complete. Run this discussion in ordinary chat before any goal starts; Kilo removes `question` during
an active goal. Do not scaffold, launch Blender, or create scene work during the discussion. For a
necessary question during production, follow `blender-project-goal` for the required-input handoff.

## Discussion

1. Read `AGENTS.md` and the existing project documents.
2. Use the user's request as the starting brief. Ask only for missing information.
3. Use `question` for concrete choices, ambiguities, visual direction, scope, constraints, external
   assets, and acceptance. Keep options to 2-4.
4. Challenge vague terms. Convert abstract ideas into observable outcomes. Put future work under
   `Deferred` and explicit exclusions under `Out of scope`.
5. Cover purpose, audience, visual outcome, deliverables, acceptance, constraints, external assets,
   and exclusions. Do not walk a generic checklist.
6. Reflect a concise draft back to the user. Ask `Confirm requirements`, `Keep discussing`, or
   `Change something`.
7. Loop until the user explicitly confirms. Silence, a new topic, or an unrelated `ok` is not
   confirmation.
8. On confirmation, record the exact user words and scope. Create or update
   `Documents/REQUIREMENTS.md` with `Status: Confirmed`, `Confirmed: YYYY-MM-DD`,
   `Confirmation: <exact response and scope>`, and a change-log row. Use `bootstrap-document` before
   registration. After registration, requirements are frozen; do not use `document` for them.
9. New project: collect workflow mode with `blender-project-workflow` and review mode with
   `blender-project-grading`, scaffold, fill all records, commit with `bootstrap-commit`, then
   `prepare` and start the goal.
10. Existing project: registration documents are frozen after registration. If the user requests a
    requirements change, stop and report the need for explicit re-registration. Do not edit
    `Documents/REQUIREMENTS.md`, `Documents/WORKFLOW.md`, `Documents/REVIEW.md`, or the active goal
    inside a bounded change.

## Research

- Use `websearch` for ambiguous terms, current standards, references, feasibility, or best practice.
- Use Context7 for library, framework, and Blender API docs. Follow `blender-mcp` for Blender API
  gaps.
- Research factual gaps before asking; ask the user for preference, intent, priority, or scope.
- Use official or primary sources first. State date, version, and conflicts.
- Report a short `found / means / options` summary with titles and URLs. Separate facts from
  assumptions.
- Record research that supports or changes a requirement under `Research notes`; put long material in
  `Documents/References/`. Never turn a finding into a requirement without explicit confirmation.
- Do not generate paid media during requirements discovery. Use text, links, or a user-supplied
  reference path while confirming requirements. If a generated reference later changes requirements,
  stop and request explicit re-registration.
- If research is unavailable or inconclusive, mark an open question. Do not guess. Search public
  information only; never send private project data, credentials, or user identity.

## Format and record

- Use stable IDs grouped by category: `REQ-01`, `REQ-02`, and so on.
- Make each requirement testable and user-visible where possible.
- Keep unresolved items under `Open questions`, acknowledged future work under `Deferred`, and
  explicit exclusions under `Out of scope` with a reason.
- Store the confirmed source in `Documents/REQUIREMENTS.md`; do not duplicate it across documents.
- The harness validates the record through `capabilities.documentFormats`. It must contain exactly the
  required fields and sections, including `Status: Confirmed`, a valid `Confirmed:` date, a
  non-placeholder `Confirmation:` reply, `Core value`, `Confirmed requirements`, `Constraints`,
  `Deferred`, `Out of scope`, `Open questions`, `Research notes`, and `Change log`.
- A malformed or unconfirmed record blocks `prepare`. Fix it through `bootstrap-document` before
  registration; never edit around the harness. After registration, stop and report the malformed
  record instead of writing the frozen document.
