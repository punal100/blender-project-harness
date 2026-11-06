---
name: blender-project-requirements
description: Use before creating a Blender project and whenever requirements are added or changed. Runs a confirmation discussion and stores confirmed requirements.
---

# Blender Project Requirements

Requirements are agreed with the user, never inferred. Production must not start until requirements
are confirmed, workflow and review modes are selected, the scaffold is committed, and registration is
complete. Run this discussion in ordinary chat before any `/goal-blender` mission starts; `question`
remains available during the mission for necessary clarifications. Do not scaffold, launch Blender, or
create scene work during the discussion. For a necessary question during production, follow
`blender-project-goal`.

## Discussion

1. Read `AGENTS.md` and the existing project documents.
2. Use the user's request as the starting brief. Ask only for missing information.
3. Use `question` for concrete choices, ambiguities, visual direction, scope, constraints, external
   assets, and acceptance. Keep options to 2-4.
4. Challenge vague terms. Convert abstract ideas into observable outcomes. Put future work under
   `Deferred` and explicit exclusions under `Out of scope`.
5. Cover purpose, audience, visual outcome, deliverables, acceptance, constraints, external assets,
   and exclusions.
6. Call `blender_workflow {action:"reference"}` and ask its exact question and labels before any brief
   confirmation. Pass the returned question verbatim, including the `HARNESS REFERENCE <uuid>` suffix;
   do not strip or paraphrase it. The labels are `Use my references`, `Generate one`, `Use web
   references`, and `None`; collect exact paths or URLs for supplied references. Generation is deferred until after
   registration. Ask even when the user says "fully modeled, no external assets"; that answers
   sourcing, not visual reference. For `Use my references`, `intake {scan:true}` the exact supplied
   paths before `prepare`; `prepare` rejects without a scanned reference. For a URL, download it to
   staging first, then scan that staged path. Do not show `Confirm requirements` until the runtime
   answer exists; `prepare` rejects without it.
7. Reflect a concise draft back to the user. The draft MUST include
   `Reference images / links: <answer or none>`. Ask `Confirm requirements`, `Keep discussing`, or
   `Change something`.
8. Loop until the user explicitly confirms. Silence, a new topic, or an unrelated `ok` is not
   confirmation.
9. On confirmation, record the exact user words and scope. Create or update
   `Documents/REQUIREMENTS.md` with `Status: Confirmed`, `Confirmed: YYYY-MM-DD`,
   `Confirmation: <exact response and scope>`, and a change-log row. Record the reference answer under
   `Constraints` (`Reference images / links:`) and in `Documents/References/README.md` (paths, links,
   or `none`). Use `bootstrap-document` before registration. After registration, requirements are
   frozen; do not use `document` for them.
10. New project: collect workflow mode with `blender-project-workflow` and review mode with
    `blender-project-grading`, scaffold, fill all records, commit with `bootstrap-commit`, then
    `prepare` and start `/goal-blender`. After bootstrap, a `Use my references` answer becomes a
    pending reference intake; follow `status` and copy the scanned files with `intake {scan:false}`
    before any scene change.
11. Existing project: registration documents are frozen after registration. If the user requests a
    requirements change, stop and report the need for explicit re-registration. Do not edit
    `Documents/REQUIREMENTS.md`, `Documents/WORKFLOW.md`, `Documents/REVIEW.md`, or the active goal
    inside a bounded change.

## Capability check

Before confirming requirements, read `blender_workflow {action:"capabilities"}` and map each visual
requirement to a supported operation. Current limits: `material` supports base color, roughness,
metallic, emission, transmission, IOR, and alpha, but not bump/procedural noise; lights support
rotation and AREA size; `modifier` includes boolean; `create_mesh` accepts custom vertices/faces.
Displacement, geometry nodes, rigging, animation, and world volume remain unsupported. If a
requirement needs an unsupported operation, ask the user to drop it, approximate it with a supported
operation, or mark it `Deferred`. Never confirm a requirement the harness cannot express.

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
