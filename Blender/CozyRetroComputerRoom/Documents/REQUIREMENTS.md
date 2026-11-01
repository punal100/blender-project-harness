# Requirements — CozyRetroComputerRoom

Status: Confirmed
Defined: 2026-11-01
Last updated: 2026-11-01
Confirmed: 2026-11-01
Confirmation: "Confirm requirements" — user confirmed the draft: late-80s/90s beige cozy computer corner, desk-corner close-up hero shot, beige CRT monitor + PC tower, one hero still, Fully Autonomous workflow, All graders review.

Confirmed requirements are the source of truth. Add or change them only after explicit user confirmation.

## Core value

A single warm, instantly readable late-80s/90s computer corner: a beige CRT desktop glowing on a wood-veneer desk in a cozy, lived-in room, presented as one polished hero still.

## Confirmed requirements

### Purpose and audience

- [ ] REQ-01: Deliver a portfolio-quality hero still of a cozy retro computer room for general viewers; the retro computer identity must be readable within two seconds of looking at the render.

### Visual outcome

- [ ] REQ-02: Subject — beige CRT monitor with a deep rear housing on a wood-veneer desk, beige keyboard and mouse in front of it, PC tower beside or under the desk, floppy disks and desk clutter around the base.
- [ ] REQ-03: Cozy set dressing — warm tungsten desk lamp, CRT screen glow as key accent, mug, CDs/cassettes, small potted plant, wall poster or framed art, visible chair edge, warm wall and floor surfaces.
- [ ] REQ-04: Camera — tight 3/4 desk-corner close-up, 16:9, monitor as dominant focal point, shallow depth of field with the CRT face sharp and background softly out of focus.
- [ ] REQ-05: Palette — beige/cream plastics, warm wood, teal-orange accent light mix, no cold blue-dominant cast.
- [ ] REQ-06: Style — stylized realistic game-ready props, clean readable silhouettes, believable wear such as slight yellowing of the beige plastic.
- [ ] REQ-07: Scale — metric, real-world proportions: desk 0.75 m high, CRT roughly 0.4 m wide x 0.4 m deep, monitor top around 1.25 m from floor.

### Scope and delivery

- [ ] REQ-08: One Blender scene saved as `cozyretrocomputerroom.blend` at the project root, with no missing external files.
- [ ] REQ-09: One hero still rendered from the scene camera, saved under `renders/final/`, at 1920x1080.
- [ ] REQ-10: README, REQUIREMENTS, WORKFLOW, REVIEW, ASSETS, and DECISIONS reflect the delivered state, and every required review round is committed.

## Constraints

- Blender version: the single harness-launched Blender instance for this workspace.
- File format / resolution: `.blend` scene plus one 1920x1080 PNG hero render, 16:9.
- Performance / delivery limits: scene must stay responsive; render must complete inside the harness review flow.
- External assets: none required. All geometry and materials authored procedurally in the scene; no third-party models, textures, HDRIs, or brands.
- Only harness-supported operations; no raw Python or shell Blender access.

## Deferred

- Turntable or any animation.
- Alternate camera angles and extra hero frames.
- Additional rooms or an exterior view through the window.
- Interactive or game-engine export.

## Out of scope

- Animation, rigging, and simulation.
- People or characters of any kind.
- Branded or copyrighted hardware, logos, and poster artwork.
- Downloaded third-party models, textures, or HDRIs.
- Exports other than the hero PNG.

## Open questions

- None.

## Research notes

| Date | Question | Finding | Source | Effect |
|---|---|---|---|---|
| 2026-11-01 | Initial scope | Confirmed through the user's answers to era, framing, computer type, deliverable, workflow, and review-mode questions. | User confirmation in chat | Defines the confirmed requirement set above. |

## Change log

| Date | Change | Source | Confirmed by |
|---|---|---|---|
| 2026-11-01 | Initial draft created. | make cozy retro room with computer | Pending |
| 2026-11-01 | Requirements confirmed and finalized. | User answer "Confirm requirements" | User |
