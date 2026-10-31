---
name: blender-project-goal
description: Use for Blender design requests and returns to paused projects. Defines discovery, bootstrap, project goal recording, and goal start/resume. Excludes read-only questions and workspace maintenance.
---

# Blender Project Goal

Blender production requires an active goal and a recorded project prompt. Read-only questions and
workspace maintenance do not require a Blender goal. Do not launch or modify Blender for maintenance
unless the user separately requested it.

The orchestrator owns goal creation, input handoffs, objective updates, and resume through supported
tools. Users provide requirements, decisions, and approvals in ordinary chat; never ask them to
manage goal commands or copy goal prompts.

## Session start and reset

1. Read this skill and enough project context to identify the saved goal and pending work. These
   bootstrap reads are permitted before a goal exists.
2. For a new project, work in ordinary chat: confirm requirements with
   `blender-project-requirements`, collect workflow and review answers with
   `blender-project-workflow` and `blender-project-grading`, scaffold with
   `blender-project-scaffold`, then persist all three exact confirmation records. Fill the goal only
   after those records are complete. Those scaffold documents are the only `Blender/<Name>/` writes
   allowed before registration; scene, asset, render, and evidence paths stay blocked, so a write
   denial names a missing lifecycle step, not a reason to use shell redirection or temp-file copies.
   Inspect status/diff/log and commit exact scaffold documents and the filled goal before
   `blender_workflow` `prepare`; finish its registration question in ordinary chat before starting the
   goal or launching Blender. Never use a discovery goal.
3. On a genuine later return to a paused project, read `Documents/WORKFLOW.md` and
   `Documents/REVIEW.md`, ask both selection questions in ordinary chat, and record the exact answers
   before resuming. Routine approval, clarification, and manual-edit pauses, automatic goal turns,
   and compaction within the same active task are continuations; do not reask modes for those pauses.
4. Resume unchanged saved work with `goal(action="resume")` only when its requirements, workflow,
   review, and goal records are current and the pending answer permits continuation. Changed objectives
   follow the replacement procedure below. Do not duplicate an active goal or resume it again on
   automatic goal turns or after compaction. Use harness `status` to recover
   its phase; changed registration facts require explicit re-registration while paused.
5. For new work, write the filled goal prompt and start the production goal only after requirements,
   workflow, and review records are complete, scaffold documents and goal are committed, and runtime
   registration is granted. Follow the hard invariants in `AGENTS.md` and the runtime contract in
   `blender-workflow-harness`.
6. Successful goal start/resume ends the current turn. Give a short response and continue when the
   goal resumes; do not call more tools or perform more work in that turn.
7. If a goal tool is unavailable or fails, report the exact error and stop production; a written
   prompt alone is not an active goal.

## Project goal steps

1. Confirm that requirements are confirmed, a workflow mode is selected, a review mode is recorded,
   and the project is scaffolded.
2. Read `AGENTS.md`, `README.md`, `Documents/REQUIREMENTS.md`, `Documents/WORKFLOW.md`,
   `Documents/REVIEW.md`, `Documents/ASSETS.md`, `Documents/DECISIONS.md`, and the existing goals.
3. For a new goal, choose `Blender/<Project>/Documents/Goals/NN-<slug>.md`; fill the scaffold's
   unfinished initial brief for the first goal. Never overwrite an earlier completed goal. For saved
   work, retain its actual active goal file instead of creating a duplicate.
4. For a new goal, start from
   `../blender-project-scaffold/templates/project/Documents/Goals/01-project-brief.md` and fill every
   section. For saved work, read its active goal file and update only confirmed revisions. Link
   `REQUIREMENTS.md`, `WORKFLOW.md`, and `REVIEW.md`; do not duplicate them.
   The `goal` objective must be the entire filled prompt text, not the raw request or a one-line
   summary; Kilo accepts at most 10,000 characters.
5. Identify the active goal's actual `Documents/Goals/NN-<slug>.md` path for production and grading.
   The initial brief is a bootstrap template, not a fixed target for later goals. Before launch,
   inspect status/diff/log and commit exact scaffold/goal paths. Call `blender_workflow` `prepare` with
   only `{project:"Blender/Name",goal:"Documents/Goals/NN-slug.md",scene:"name.blend"}` as its JSON-string
   payload. Pass the returned exact question and labels to `question` as one single-select question;
   omit `custom`/`multiple` or set them false where the tool exposes them. Only genuine runtime
   answers grant registration; never create approved JSON.
6. For a new goal, call `goal(action="start", objective=<the full prompt text>)` immediately. Writing
   the file without starting the goal is incomplete. For saved work, complete the return gates above
   and call `goal(action="resume")` for an unchanged objective; use the replacement procedure for a
   changed objective. After success, end the turn and wait for continuation.

## Required input and continuation

Kilo removes `question` while a goal is active
(https://kilo.ai/docs/code-with-ai/agents/goals#clarification-questions). The `goal` tool supports
start/resume, not pause. Apply this procedure in both autonomy modes:

1. If already paused, stopped, or blocked awaiting input, proceed directly to ordinary-chat questions.
   Do not repeat the stop procedure or request a user command. A final response alone does not prove
   a pause: Kilo auto-pauses a turn with no successful action and no completion report, as well as
   explicit Stop and backend restarts. Harness `goalActive` records start/resume history, not live
   Kilo goal status; it is not approval or permission to continue editing.
2. If active execution cannot continue because a required approval or decision is missing and
   `question` is unavailable, call `goal_report(status="blocked", reason=<concrete pending input>)`.
   Then end the turn with saved progress, findings, recommended next change, and the decision needed.
   Call no further tools. Do not report complete or invent a pause action. Routine reversible choices
   within Fully Autonomous scope do not require this handoff.
3. On the next ordinary user turn, recover the pending phase and ask any required `question` before
   resuming. For harness approval, obtain the exact `approval` question and labels unchanged; freeform
   direction does not replace its runtime receipt. Wait for every required answer. Pause, cancellation,
   no answer, or ongoing manual editing leave work stopped. Do not reselect modes for routine input
   handoffs within the same task.
4. Once the answer authorizes continuation and registration/records remain current, the orchestrator
   calls `goal(action="resume")` for the unchanged objective and ends the turn. Follow
   `blender-project-workflow` for approval, revision, commit, and checkpoint ordering. Missing tools or
   rejected calls are concrete blockers to report, not reasons to ask the user to operate goal controls.

## Changed objectives and next work

For a confirmed change to current scope, update requirements and the active goal file through
supported harness handling. For a separate next task, create the next numbered goal file; preserve
earlier goals. Complete required scoped commits and runtime registration before the orchestrator calls
`goal(action="start", objective=<the entire filled prompt>)` to replace the saved objective. End that
turn; do not also call resume. Never resume an outdated objective after changing its recorded prompt.

Changed specifications, modes, or goal paths invalidate registration. Current harness re-registration
is limited to its supported capped-review escalation path; ordinary `prepare` retries or `recover`
do not unlock arbitrary goal changes. If tooling cannot safely register the requested revision or
next task, report that exact maintenance blocker and leave production stopped. Never edit external
state or move lifecycle work to the user. Never self-confirm requirements or invent user directives.

## Required goal content

- Mission in the user's own words.
- Project name and links to README, requirements, workflow, review mode, assets, decisions, references.
- Visual outcome: subject, composition, camera, lighting, materials, colour, scale, mood.
- Scope: in, out, and external dependencies.
- Deliverables: scene, review render, exports, documents.
- Acceptance checks that can be seen in a render or read from a file.
- Workflow: launch with `blender_workflow` `launch` and verify the open file. The initial unsaved scene is
  one bounded change: ticketed `save`, scoped commit, then `checkpoint` recorded as `BOOTSTRAP`; never
  seal or grade that empty state. After that, save after every meaningful change and before risky work
  through ticketed harness operations, seal, inspect the returned final PNG with `blender_look`, and
  update docs. Each bounded change requires review, applicable approval, scoped commit, and
  `checkpoint` before the next `begin`; failed rounds commit before fixes. Include selected
  autonomy/review modes and configured graders under `blender-project-grading`.
- Done: require the review artifact, current documentation including `REVIEW.md`, and a final
  applicable `PASS` when grading is enabled. No genuine unresolved blocker or major finding permits
  completion; declining a genuine finding is not a waiver.

## Rules

- Do not perform Blender production without an active goal. Bootstrap and maintenance exceptions
  are defined above; they do not authorize scene edits.
- Requirements, workflow selection, review mode, and scaffolding happen before the goal. Do not
  create a project goal before requirements are confirmed or a workflow or review mode is selected.
- Do not start a goal to ask questions; Kilo disables `question` during goal execution.
- In either autonomy mode, follow the required-input handoff before necessary questions and let the
  orchestrator resume only after required answers permit continuation. Do not reselect modes for
  routine approval handoffs within the same active task.
- Never invent user confirmation or a session directive to bypass these gates.
- Production uses orchestrator-only harness operations under `blender-workflow-harness`; raw Python, imports, and
  generation are blocked. Unsupported operations stop until tooling is reviewed and extended.
  Maintenance remains exempt, without Blender access.
- This is a design goal, not a coding plan. Do not create `PLAN/` or plan-check/verifier records.
- Multiple goals per project are allowed; one file per goal.
- Never claim production completion without a saved review render inspected with `look`. Viewport
  screenshots supplement the render; they do not replace the production acceptance artifact.
- Pass the user's exact words in the Mission and in `user_prompt` for Blender MCP calls.
- Keep external asset references pointed at `Documents/ASSETS.md`.
- Complete required grading before every Partially Autonomous approval or revision-direction
  question. Grader findings never authorize another meaningful change before the user's approval or
  revision direction.
- Update README, `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`, `DECISIONS.md`, and `ASSETS.md` before
  `goal_report(status="complete", reason=<evidence>)`. Report only after all checks pass, then give
  the final response without further actions. The completion hook requires a clean checkpoint,
  final applicable `PASS`, and successful inspection of the sealed render; a claim is not a receipt.
