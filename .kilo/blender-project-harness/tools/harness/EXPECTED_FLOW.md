# Blender Harness — Expected Flow

Status: developer reference  
Audience: contributors who need to understand the harness without reading the full codebase  
Scope: conceptual flow, lifecycle, evidence, failure handling, and examples

This document is a generic reference. It is not a live test contract and is not tied to a specific
project, branch, machine, or run. Project documents and the workspace instructions remain
authoritative.

## 1. What the harness is

The harness turns a normal conversation into a governed Blender production workflow:

```text
user prompt
  -> requirements confirmation
  -> workflow and review selection
  -> project scaffold and registration
  -> active goal
  -> bounded scene changes
  -> worker apply tickets
  -> WIP renders and inspections
  -> sealed review evidence
  -> independent graders
  -> review verdict
  -> scoped commits
  -> checkpoint and completion
```

The harness exists to make these guarantees:

- Blender is only edited through declared, bounded changes.
- Every scene edit has a ticket, an exact payload, and a task record.
- The orchestrator does not execute apply operations; a worker does.
- A review is based on frozen evidence, not on a viewport glance.
- Graders cannot edit the scene or fabricate a pass.
- Project history is scoped and clean.
- Assets, licences, exports, and external files are recorded.
- Failures are reported as failures, not silently downgraded.

## 2. Main components

| Component | Responsibility |
|---|---|
| Workflow engine | State machine, registrations, changes, tickets, review, commits, checkpoints. |
| MCP proxy | Exposes a narrow tool surface and guards the live Blender connection. |
| Kilo plugin | Enforces tool permissions, goal state, session identity, and delegation rules. |
| Scaffold | Creates the project structure from templates. |
| Document tools | Validates and reads/writes structured project documents. |
| Operation schema | Defines bounded Blender operations and generated Blender Python. |
| Intake | Copies user files into canonical project paths with hashes and sidecars. |
| Download | Fetches allowed HTTPS assets into ignored staging only. |
| Shell policy | Classifies and approves workspace shell commands. |
| Worker | Executes exactly one assigned apply ticket. |
| Grader | Reads frozen evidence and writes one assigned report. |
| Task ledger | Records ticket, task, child, state, and result under project control. |

The engine owns state. The proxy owns live Blender execution. The plugin owns session and tool
permissions. Keep those responsibilities separate.

## 3. Core concepts

### Project

A project is a folder under the workspace Blender area, for example:

```text
Blender/ExampleRoom/
```

It contains a scene, documents, assets, renders, and task records. The exact project name is chosen
during requirements and registration.

### Registration

Registration freezes the project requirements, workflow mode, review mode, goal, scene path, and
grader roster. After registration, changing those records requires an explicit re-registration.
Do not edit registration documents inside a normal change.

### Goal

The goal is the active production objective. The harness exposes `status.nextStep`; follow it rather
than guessing the next action. Do not start a goal just to ask questions.

### Bounded change

A bounded change has:

- one observable outcome;
- exact object names;
- exact project-relative paths;
- declared scenes when the change is multi-scene;
- a milestone or requirement scope;
- at most one open change per project.

Every scene edit belongs to a change. A documentation-only or asset-only change is non-scene and
does not need seal or review.

### Ticket

A ticket is a one-time authorization for an operation or a batch of operations. The orchestrator
issues it; the worker consumes it. Tickets expire. The worker never saves, seals, reviews, or
commits on its own.

### WIP render

A work-in-progress render is a checkpoint for visual progress. It is required every three applies
and before seal. Inspect it with `look`; a WIP render without an inspection is not evidence.

### Seal

Seal freezes the review evidence:

- saved scene hash;
- per-scene renders;
- camera evidence;
- scene facts;
- manifest;
- evidence key;
- review round folder.

Seal is not a review and not a pass. It creates the package a grader can inspect.

### Review

Review aggregates independent grader reports. The verdict can be PASS, CHANGES_REQUIRED, or BLOCKED.
A tooling BLOCKED is not a design finding. A missing report is not a PASS.

### Checkpoint

A checkpoint verifies that the project is committed, the review history is consistent, and no
unexpected files are left behind. Completion requires a clean checkpoint.

## 4. Expected lifecycle

### Phase 0 — Status and capabilities

Start with status and capabilities:

```json
{ "action": "status" }
```

```json
{ "action": "capabilities" }
```

Expected:

- the live operation set matches the source;
- the scene limit and supported actions are known;
- the agent does not claim a missing operation;
- Blender is not launched before registration.

### Phase 1 — Requirements and workflow

Ask only questions that change the result or the rights:

- What should the scene contain?
- What style, mood, and lighting?
- What deliverables?
- Are references generated, supplied, or omitted?
- Are external assets supplied, downloaded, or avoided?
- Are scripts needed?
- Fully Autonomous or Partially Autonomous?
- Review Off, Single, or All?

Record confirmed answers before scaffolding. Do not ask the user to understand harness internals.

### Phase 2 — Scaffold, documents, registration, and goal

Expected sequence:

1. Scaffold the project with the harness-owned scaffold command.
2. Fill required documents with the bootstrap document tool.
3. Commit the scaffold with the bootstrap commit action.
4. Confirm the commit includes every scaffold file, including current template additions such as
   the intake register.
5. Call `prepare`.
6. Ask the exact registration question.
7. Register only after a real user answer.
8. Start the goal.
9. Launch Blender through the harness.
10. Verify the addon and scene path.
11. Save the bootstrap scene.
12. Commit and checkpoint the bootstrap save without review.

Example scaffold outcome:

```text
Blender/ExampleRoom/
  ExampleRoom.blend
  README.md
  Documents/
    REQUIREMENTS.md
    WORKFLOW.md
    REVIEW.md
    ASSETS.md
    DECISIONS.md
    INTAKE.md
    TASKSTRACKER.md
    Tasks/
    Goals/
    References/
  assets/
  renders/
  exports/
```

A scaffold commit that leaves a template file untracked is a bug. Verify the commit, not just the
working tree.

### Phase 3 — Scene change and apply

Example `begin` payload:

```json
{
  "project": "Blender/ExampleRoom",
  "outcome": "Build the desk, monitor, and warm desk lamp",
  "objects": ["Desk_Top", "Monitor_Bezel", "Desk_Lamp_Shade"],
  "paths": [
    "Blender/ExampleRoom/ExampleRoom.blend",
    "Blender/ExampleRoom/README.md"
  ],
  "scenes": ["Scene"],
  "requirements": ["REQ-01", "REQ-02"]
}
```

Example apply batch:

```json
{
  "operations": [
    {
      "operation": "create_mesh",
      "name": "Desk_Top",
      "primitive": "cube",
      "location": [0, 0, 0.75],
      "scale": [0.9, 0.35, 0.03]
    },
    {
      "operation": "create_mesh",
      "name": "Monitor_Bezel",
      "primitive": "cube",
      "location": [0, 0.1, 1.1],
      "scale": [0.28, 0.02, 0.2]
    },
    {
      "operation": "create_light",
      "name": "Light_Lamp",
      "light_type": "POINT",
      "location": [-0.7, 0.2, 1.2],
      "energy": 45
    }
  ]
}
```

Expected:

- the orchestrator issues one apply ticket;
- the worker receives the ticket and exact payload;
- the worker executes only that batch;
- the harness saves the scene;
- an apply commit records the scene and task records;
- no other writer runs at the same time.

### Phase 4 — WIP and inspection

Every three applies, and before seal:

```text
apply -> save -> WIP render -> look -> continue
```

The WIP render is not a final review. It is a cheap visual checkpoint. Inspect it for:

- camera framing;
- missing or floating objects;
- unreadable scale;
- black or empty render;
- obvious material or lighting failures.

### Phase 5 — Finalize and seal

Before seal:

- the final asset or material change is complete;
- strict `check_assets` has run on the final unchanged scene when assets were used;
- the strict asset receipt is stored on the change;
- the WIP render has been inspected;
- every declared scene has a camera and render.

Seal produces:

```text
Documents/Reviews/R01-<timestamp>/
  REVIEW.md
  manifest.json
  _evidence/
    scenes/<SceneName>/
      camera.png
      scene-facts.json
      scene.txt
```

The manifest must include:

- scene hash;
- per-scene evidence hashes;
- evidence key;
- spec hashes;
- grader roster;
- operation tasks;
- `asset_check` with the strict receipt when assets were used.

`scene-facts.json` should contain more than names and types:

- world location, rotation, scale, dimensions;
- materials and modifiers;
- mesh vertex, edge, and face counts;
- n-gons, non-manifold edges, loose vertices, degenerate faces;
- render resolution, engine, frame range, fps;
- colour management, samples, and VSE strips.

### Phase 6 — Graders

Each grader gets one ticket and one exact prompt. Example ticket content:

```text
HARNESS_GRADER:<token>
Round: R01-<timestamp>
Project root: <workspace>
Grader name / focus: visual / composition, camera, lighting, colour, materials, mood
Milestone: <outcome>
Requirements to grade: REQ-01, REQ-02
Scenes to grade: Scene
Primary scene: Scene
Final full-spec review: yes
Spec: <workspace>/Blender/ExampleRoom/Documents/REQUIREMENTS.md
Target: base <commit>, saved scene SHA-256 <hash>, project clean
Evidence key: <evidence-key>
Evidence files:
- <render path> (sha256 <hash>)
- <scene-facts path> (sha256 <hash>)
Manifest: <manifest path>
Report path: <assigned report path>
Live inspection: not allowed
Budget: <minutes> minutes, <steps> steps
```

Expected:

- all configured graders are dispatched, up to `max_parallel`;
- each reads only assigned specs, evidence, and its own prior report;
- each writes only its assigned `REPORT.md`;
- each cites the scene hash and evidence key;
- a missing report is recorded as BLOCKED;
- a retry uses a fresh ticket with the current hash and evidence key;
- no grader reads a peer report.

A hand-written grader prompt that omits the scene hash or evidence key is a bug. Use the ticket
prompt.

### Phase 7 — Review, commit, checkpoint

The review aggregates the reports:

- PASS: every applicable report passes;
- CHANGES_REQUIRED: a design finding requires another revision;
- BLOCKED: evidence or tooling is insufficient.

On a review commit, include the review artifacts and the scoped project change. Then checkpoint.
Completion requires a final full-spec PASS and a clean project.

### Phase 8 — Completion

Before reporting complete:

- the scene is saved;
- the final sealed render exists and was inspected;
- every declared scene was inspected;
- every required grader report exists;
- the verdict is PASS;
- the strict asset receipt is present when assets were used;
- exports have valid receipts;
- the checkpoint is clean;
- the goal is complete;
- the tracker is complete.

## 5. Evidence contract

Every sealed round must satisfy:

- `scene` hash matches the saved `.blend`;
- every declared scene has a render, camera, facts, and text evidence;
- the facts contain dimensions and topology;
- the manifest lists every evidence hash;
- the evidence key is reproducible from the scene hash, specs, and evidence;
- grader reports cite the same scene hash and evidence key;
- `asset_check` is non-null when assets were used;
- the review index and manifest agree on the round;
- the final checkpoint is clean.

If any item is missing, the review is BLOCKED. Do not accept a visually good render as proof of
geometry, topology, or asset integrity.

## 6. Review and autonomy modes

### Workflow modes

- Fully Autonomous: the agent may proceed through approved production steps and review commits
  without asking for every change.
- Partially Autonomous: every reviewable change requires explicit user approval before commit.

The mode is frozen at registration. A change requires re-registration.

### Review modes

- Off: self-review only.
- Single: one configured grader.
- All: every configured grader.

A configured grader must have a primary and backup provider/model/variant. A missing grader is a
tooling failure, not an automatic pass.

## 7. Subagents

### Worker

- executes one assigned ticket and payload;
- never saves, seals, reviews, approves, or commits;
- returns the operation result;
- leaves the scene saved and clean;
- uses the backup model only when the primary fails.

### Grader

- is read-only;
- writes only its assigned report;
- does not read peer reports;
- does not ask the user;
- does not edit the scene;
- returns structured findings and a verdict;
- stops on missing evidence or budget exhaustion.

## 8. Assets and intake

### User-supplied files

Bring files in through intake. Intake:

- scans first;
- copies into canonical project paths;
- records hashes, MIME, dimensions, source, and licence;
- writes sidecars and register rows;
- never asks the user to move or rename files manually.

### Downloads

A download may fetch a public HTTPS asset into ignored staging. It does not import, register, or
execute it. Inspect the receipt, provide source/licence, then intake.

### Media generation

Media generation belongs to the agent, not the harness. Use the configured media tool only with
explicit permission before spending credits. Save the actual file, inspect it, pass its path to
intake with generated metadata, display it, and ask before using it as a texture or reference.

### Licences and binaries

- external assets require source and licence metadata;
- non-redistributable binaries are not committed;
- sidecars and metadata are committed;
- strict `check_assets` must pass on the final unchanged scene;
- export receipts are separate from asset checks.

## 9. Multi-scene flow

Example user prompt:

> Turn this into three scenes: a wide establishing shot, a close desk shot, and a master scene
> that sequences both. Keep the room intact and give each shot its own camera.

Expected:

- create the shot scenes and master scene;
- declare exact scene names;
- switch scene only deliberately;
- duplicate or link the room with the correct copy semantics;
- add scene strips to the master;
- set frame range and FPS where needed;
- seal every declared scene;
- inspect every scene render;
- grade every declared scene;
- verify every scene in the manifest.

A seal that captures only the active scene is a bug.

## 10. Export flow

Example user prompt:

> Export a GLB for sharing, keeping the Blender file as the source of truth.

Expected:

- export under `exports/`;
- receipt includes format, path, bytes, SHA-256, source scene, and signature;
- the harness verifies the receipt;
- `check_assets` remains a separate check;
- README and asset records stay current;
- completion denies a missing or changed export.

## 11. Git and commit rules

Expected history:

- scaffold commit;
- one atomic commit per successful apply batch;
- review/evidence commit at the review boundary;
- tracker-only completion commit;
- no manual project commits;
- no unrelated files;
- no secrets, absolute paths, WIP renders, or non-redistributable binaries.

Workspace code changes are separate from project history. Do not mix harness or tooling changes into
a project change. When tooling fixes are needed, keep them atomic and outside the live project
change.

Example atomic commit set for a harness fix:

```text
fix: harden apply commits for ignored assets and staged recovery
feat: expose scene geometry and topology in scene facts
fix: preserve strict asset-check receipts in review manifests
fix: require exact grader ticket evidence and allow reference reads
fix: include intake register in project scaffold
```

## 12. Failure handling

### Harness BLOCKED

The harness refused an action because the state or evidence was insufficient. Retry only after the
missing condition is fixed.

Examples:

- no camera before a render;
- seal before finalize;
- strict asset check missing;
- missing grader report;
- index contains files outside the change;
- scene changed outside a guarded operation.

### Design CHANGES_REQUIRED

The scene is valid but does not meet the confirmed visual or spec requirements. Start a new revision
change, apply the fixes, seal again, and re-review.

Examples:

- lamp lights the wall instead of the desk;
- palette is cool instead of warm;
- wall material reads as striping;
- monitor is a flat emissive panel;
- props are missing or unreadable.

### Recovery rules

- do not edit runtime state;
- do not force-add ignored binaries;
- do not manually stage or commit project files;
- preserve a failed change as WIP and checkpoint;
- clear a stale base only through a controlled recovery, not by deleting the project;
- keep code fixes separate from the test project.

## 13. Developer invariants

- One Blender writer at a time.
- One open bounded change per project.
- One ticket, one payload, one worker.
- Orchestrator never executes apply.
- Every scene edit has a task record.
- Every review has frozen evidence.
- Every grader has one assigned report.
- Every completion has a clean checkpoint.
- Every asset has a source and licence record.
- Every export has a verified receipt.
- Every failure is reported with exact error text.

## 14. Example end-to-end session

User:

> Make a cozy room with a computer.

Agent:

> I need a few choices that change the result: warm or cool mood, what the computer setup should
> include, and whether I may download free assets. I will also ask you to choose Fully or Partially
> Autonomous and Off, Single, or All review.

User:

> Warm evening, desk with monitor and keyboard, free CC0 assets allowed, Fully Autonomous, All
> graders.

Agent:

- confirms requirements;
- scaffolds and registers;
- launches Blender;
- builds the room in bounded changes;
- renders WIP checks;
- seals the final scene;
- dispatches visual, technical, and spec graders;
- fixes review findings in a new revision;
- reaches PASS;
- commits and checkpoints;
- reports the project path, render path, review result, and remaining limitations.

## 15. Minimal acceptance checklist

- [ ] Live capabilities match source.
- [ ] Requirements and modes were confirmed before scaffolding.
- [ ] Scaffold commit includes every template file.
- [ ] Blender launched only after registration.
- [ ] Every scene edit has a ticket and task record.
- [ ] WIP renders were inspected.
- [ ] Final scene was saved before seal.
- [ ] Strict `check_assets` ran on the final unchanged scene when assets were used.
- [ ] `scene-facts.json` includes dimensions and topology.
- [ ] Manifest `asset_check` is non-null when assets were used.
- [ ] All configured graders wrote reports.
- [ ] Reports cite the scene hash and evidence key.
- [ ] Final verdict is PASS.
- [ ] Every declared scene render was inspected.
- [ ] Exports have verified receipts if produced.
- [ ] Project history is scoped and clean.
- [ ] Checkpoint is clean.
- [ ] Goal and tracker are complete.

## 16. Known limits

- No arbitrary Blender Python execution.
- No browser or authentication bypass.
- No automatic licence acceptance.
- No model preview worker yet.
- No master animation render ticket yet; master scene stills and scene strips are tested.
- Media generation is agent-owned; the harness only intakes and records the result.
- A single-scene pass is valid before multi-scene, media, and export follow-ups.
