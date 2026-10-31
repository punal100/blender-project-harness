---
name: blender-project-requirements
description: Use before creating a Blender project and whenever requirements are added or changed. Runs a user discussion with targeted web research and a confirmation gate; stores confirmed requirements in Documents/REQUIREMENTS.md.
---

# Blender Project Requirements

Requirements are agreed with the user, not inferred. Do not scaffold, launch Blender, or start
production work until the user explicitly confirms them.

## Session gate

Requirements are settled in ordinary chat before any goal starts. Kilo removes `question` during an
active goal, so do not use a discovery goal for this discussion. Read the relevant context, confirm
requirements, collect workflow and review answers, scaffold, and persist the exact requirements,
workflow, and review records. Then fill and start the production goal before launching Blender.
Do not repeat confirmation after compaction or routine approval pauses within the same active task.
For a necessary question during production in either autonomy mode, follow
`blender-project-goal` for the controller-owned input handoff, questions, and continuation. Do not let
an unconfirmed requirement become scene work. Workspace maintenance is exempt from this project gate.

## Discussion

1. Read `AGENTS.md` and the existing project docs.
2. If the project exists, read `Documents/REQUIREMENTS.md`, `Documents/WORKFLOW.md`,
   `Documents/REVIEW.md`, `README.md`, `Documents/DECISIONS.md`, and the goals.
3. Use the user's existing request as the starting brief. Ask "What do you want to build?" or
   "What should change?" only when that information is missing; never make the user repeat it.
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
8. Loop until the user explicitly confirms the presented requirements. Silence or a new topic is
   not confirmation. An affirmative answer to an explicit confirmation question is confirmation;
   record its exact wording and context rather than inferring approval from an unrelated "ok".
9. On confirmation:
   - New project: retain the exact confirmation and its scope in the conversation. Load
     `blender-project-workflow` and collect the mode answer, then load `blender-project-grading` and
     collect the review answer. Scaffold only after all three answers exist. Write
     `Documents/REQUIREMENTS.md` with `Status: Confirmed`, `Confirmed: YYYY-MM-DD`,
     `Confirmation: <exact response and scope>`, and a change-log row; persist the exact mode answers
     in `Documents/WORKFLOW.md` and `Documents/REVIEW.md`. Do not reask answers already supplied.
     Record only words the user actually wrote; never cite a self-generated approval. Fill and start
     the goal only after all three records are complete.
   - Existing project: update `Documents/REQUIREMENTS.md` and its change log, then update the
     README, `DECISIONS.md`, and the goal before continuing.
10. Requirements may be added or changed at any time, but only after explicit user confirmation
    and a change-log row.

## Research

Research is part of the back-and-forth, not a one-time phase.

- Use `websearch` when the user asks an open-ended question, uses an ambiguous term, or when the
  domain, current standard, reference, feasibility, cost, or best practice is unclear.
- Use `context7` for library, framework, and Blender API docs. If Context7 lacks the answer, say so
  and use web search. For Blender API gaps, load `blender-mcp`.
- Search before the next question when the gap is factual; ask the user when the gap is preference,
  intent, priority, or scope.
- When user feedback introduces an unfamiliar term or claim, research it and reflect the finding
  back instead of silently accepting or rejecting it.
- Prefer official or primary sources. Check date and version, and state conflicting or uncertain
  findings.
- Report research as a short "found / means / options" summary with titles and URLs. Separate
  sourced facts from assumptions.
- User feedback and confirmed intent outrank web findings. Present researched options and ask the
  user to choose or confirm.
- Never turn a web finding into a requirement without explicit user confirmation.
- Record research that supports or changes a requirement in `REQUIREMENTS.md` under
  `Research notes`; put long material in `Documents/References/`.
- If research is unavailable or inconclusive, mark it as an open question; do not guess.
- Search public information only. Never send private project data, credentials, or user identity to
  a search.

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
- If a requirement change affects the current goal, the controller updates its actual goal file and
  replaces the saved objective through supported registration and `blender-project-goal` before
  continuing. An unsupported registration change is a tooling blocker; never hand goal commands to
  the user or resume an outdated objective. Do not keep grading against the initial brief when a
  later goal is active.
- This is a design workspace: do not create `PLAN/` or verifier records.
