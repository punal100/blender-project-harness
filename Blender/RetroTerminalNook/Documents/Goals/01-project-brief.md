# Goal: Initial Brief (2026-10-31)

Read `../../../../AGENTS.md` first and obey it. Read `blender-project-goal`,
`blender-project-requirements`, `blender-project-workflow`, `blender-project-readme`, and
`blender-assets` when relevant. This is a design goal, not a coding plan: do not create a `PLAN/`
folder and do not use coding plan/check/verifier gates.

## Mission

The user's exact request: "make cozy retro room with computer".

Confirmed brief: build a cozy late-70s/early-80s desk-corner vignette around a beige CRT computer
with a green phosphor screen, warm practical lamp light, wood panelling, shag rug, and lived-in retro
props. The user answered "Confirm requirements" to that presented scope and selected fully autonomous
work with `All` review.

## Project

RetroTerminalNook — Cozy late-70s/early-80s desk corner with CRT computer, green phosphor glow, and retro props.

- Project README: `../../README.md`
- Confirmed requirements: `../REQUIREMENTS.md`
- Workflow mode: `../WORKFLOW.md` (Fully Autonomous)
- Review mode: `../REVIEW.md` (`All`: visual, technical, spec)
- Asset register: `../ASSETS.md` (none)
- Decisions: `../DECISIONS.md`
- References: `../References/README.md`

## Visual outcome

A single 16:9 interior shot: a wood-panelled corner with a wooden desk, chair, wall shelf, and a
window showing night. A beige CRT computer sits at the focal point with legible green terminal text
and a visible cursor; its green spill falls across a chunky keyboard. The desk carries a cassette
deck with tapes, floppy disks and manuals, a mug by a potted plant, and the walls carry posters and a
corkboard. Warm desk-lamp light pools on wood; the rest of the room falls into dark brown and
avocado shadow. Palette: warm browns, mustard, avocado, burnt orange, beige plastics; the green
screen is the strongest accent. Stylized-realistic, believable metric scale, simplified detail, no
people. Review image: the sealed camera PNG in `renders/final/`, inspected with `look`.

## Scope

- In scope: desk-corner set (back and side walls, floor, window, desk, chair, shelf); beige CRT
  monitor, keyboard, computer unit; all four prop groups; wood panelling, shag rug; warm lamp + green
  CRT lighting; one hero render; documentation and review rounds.
- Out of scope: full room, bed, couch, doorway, people or animals, animation, rigging, simulation,
  game export, photoreal replica of a specific machine, external assets.
- External dependencies: none. Only supported harness primitive operations and procedural materials.

## Deliverables

- [ ] `retroterminalnook.blend` saved at project root and verified as the open scene.
- [ ] One hero render, 16:9, at least 1600x900, under `renders/final/`, inspected with `look`.
- [ ] README, `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`, `DECISIONS.md`, and `ASSETS.md` current.
- [ ] Review rounds under `Documents/Reviews/` with manifests, reports, dispositions, and index rows.
- [ ] Final applicable grader round `PASS` with no genuine unresolved blocker or major finding.

## Acceptance

- [ ] Scene opens without missing external files and reports the declared `.blend` path.
- [ ] Camera is roughly seated eye level, three-quarter to the desk, 16:9; CRT, keyboard, and props
  are readable and no key object is cropped.
- [ ] CRT shows legible green terminal text and cursor; green spill is visible on nearby surfaces.
- [ ] Cassette deck + tapes, floppies + manuals, mug + plant, and posters + corkboard are identifiable.
- [ ] Late-night lighting reads intentionally: warm lamp key, dark room, no daylight; proportions and
  scale are believable; no floating, clipping, or intersecting objects.
- [ ] Palette and materials match the confirmed stylized-realistic retro direction.
- [ ] Hero render exists, was inspected with `look`, and matches the delivered scene.
- [ ] README reflects the delivered state; all documents and review records are current.
- [ ] Final applicable grader round is `PASS`; no genuine unresolved blocker or major finding remains.

## Workflow

1. Read the README, requirements, workflow, review mode, asset register, decisions, and references.
   Stop if requirements are unconfirmed, a mode is `Unset`, or required grader configuration is
   missing or disabled.
2. Inspect harness `status`. From the workspace root, launch with
   `.\tools\start-blender.cmd "Blender\RetroTerminalNook"`. Never launch `blender.exe` directly.
   Call `blender_get_addon_status` and `blender_get_scene_info(fields=["settings"])`; stop on a
   connection, addon, or file mismatch.
3. For the new unsaved scene, open one bounded `begin` and use a ticketed `save` to
   `retroterminalnook.blend` at the project root. Verify that exact path before production edits,
   then update README's planned status.
4. Use `blender_workflow` with `{action,payload:JSON-string}`. `begin` declares one outcome, exact
   object names, and exact project-relative paths, bounded to 40 operations and 15 minutes. Request
   `ticket` for `apply`/`save`/`seal`; execute through `blender_harness_execute` with the matching
   token, operation, payload, and `user_prompt` set to the user's exact words, "make cozy retro room
   with computer". Supported operations only; raw Python, imports, and generation are blocked.
   Unsupported operations stop work for reviewed tooling extension.
5. Save through ticketed `save` after every meaningful change and before risky work. Inspect every
   visual change with `look`; code output alone is not proof.
6. `seal` saves the authoritative scene and captures immutable evidence, the final PNG, and manifest.
   Immediately call `blender_look(image=<returned absolute render path>)`; the hook records
   inspection. For review mode `All`, request `grader-ticket` `{name}` for visual, technical, and
   spec; dispatch each normal `blender-grader` task with its unique token, exact report path, and
   `HARNESS_GRADER:<token>` marker, respecting `max_parallel` 3 and configured budgets.
7. Read all reports, merge duplicate findings, record every finding as open, fixed, deferred, or
   declined with reasons, and write `Documents/Reviews/<round>/REVIEW.md` with the exact scene hash,
   per-grader verdicts, and final verdict. Call `review` with `{notes}` to validate receipts,
   reports, aggregate hash, verdict, and dispositions. In `Off`, call `self-review` instead.
8. After each review, inspect status, `git diff`, and recent log. Stage only exact scoped paths,
   commit one logical change plus its review artifacts, then run `checkpoint` before the next
   `begin`. Failed rounds commit before fixes. `revision:true` stays within configured `max_rounds`
   (2); exhausting it requires explicit user escalation and re-registration handling, never a silent
   override. Never leave a completed round uncommitted.
9. Fully Autonomous mode needs no approval pauses within confirmed scope. Stop for a requirements
   conflict, a destructive or irreversible choice, or a technical blocker. Do not silently change
   scope or grading. Do not delegate goal controls to the user.
10. Finish with the saved deliverable state: seal, inspect the returned final PNG, complete final
    applicable grading, require `PASS` and no genuine unresolved blocker or major finding. Update
    README and all documents, commit, and run a clean `checkpoint`. Then call
    `goal_report(status="complete", reason=<evidence>)` and give the final response without further
    actions.

## Done

The goal is complete only when all acceptance checks pass, requirements, workflow, and review mode
are current, the scene and inspected review render are saved, the final applicable round is `PASS`
with no genuine unresolved blocker or major finding, no external asset is missing or unregistered,
all documents including `REVIEW.md` are current, and the completion hook sees a clean checkpoint and
a successful `blender_look` receipt for the sealed render. Harness state at
`~/.local/state/blender-workflow-harness/<workspace-hash>` is external and not agent-editable.
