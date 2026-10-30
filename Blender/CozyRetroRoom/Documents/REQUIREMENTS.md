# Requirements — CozyRetroRoom

Status: Confirmed
Defined: 2026-10-31
Last updated: 2026-10-31
Confirmed: 2026-10-31
Confirmation: "Confirm requirements (Recommended)" — confirms the presented draft covering a late-90s small-bedroom PC corner, photoreal PBR hero still, listed props, 16:9 1920x1080 camera, deliverables, and exclusions.

Confirmed requirements are the source of truth. Add or change them only after explicit user confirmation.

## Core value

A cozy late-90s bedroom computer corner, rendered as a photoreal 16:9 hero still. The nostalgia must
be immediate and the room must feel warm, lived-in, and personal.

## Confirmed requirements

### Purpose and audience

- [ ] REQ-01: Deliver one photoreal hero visualization of a cozy late-90s bedroom computer corner for
  the project owner's nostalgic portfolio/mood use.
- [ ] REQ-02: The image must read as a late-90s PC corner at first glance, not a generic office or a
  modern setup with retro props.

### Visual outcome

- [ ] REQ-03: Focal subject is a beige CRT monitor, powered with a warm screen glow, paired with a
  matching desktop tower and chunky keyboard on a pine/MDF desk in the corner of a small bedroom.
- [ ] REQ-04: Era dressing includes woodgrain wall paneling, worn carpet, posters and wall notes,
  shelves or stacks of CDs/floppy disks/game boxes, a houseplant, a blanket or rug, cables, a mug,
  and small lived-in knick-knacks.
- [ ] REQ-05: Mood is cozy evening: warm tungsten desk lamp, CRT glow, and soft window ambience;
  warm amber and brown palette with cool screen highlights.
- [ ] REQ-06: Materials are physically plausible PBR: aged beige plastics, wood veneer/laminate, dusty
  CRT glass, woven fabric, printed paper, matte wall paint. Avoid overt real-world brand logos.
- [ ] REQ-07: Camera is a three-quarter view into the room corner at roughly seated/standing eye
  height, framing desk, computer, and enough surroundings to establish the room; 16:9 aspect,
  1920x1080 final.
- [ ] REQ-08: Real-world scale in metres. Desk roughly 1.2-1.5 m wide, CRT roughly 0.35-0.45 m wide,
  room corner walls roughly 2.4-2.8 m high. All props rest on surfaces or hang correctly.

### Scope and delivery

- [ ] REQ-09: Deliver a saved authoritative `.blend` at the project root with relative asset paths and
  no missing external files.
- [ ] REQ-10: Deliver a Cycles final render at 1920x1080 in `renders/final/`, plus a review render
  inspected with `look`.
- [ ] REQ-11: Keep README, requirements, workflow, asset register, decisions, and goal records current.

### Acceptance

- [ ] REQ-12: The final render instantly reads as a cozy late-90s bedroom computer corner; the CRT and
  keyboard are the clear focal point; composition is readable and uncluttered in silhouette.
- [ ] REQ-13: No floating, intersecting, or visibly mis-scaled props; no missing textures; lighting
  produces warm pools with soft shadows and a legible screen glow.
- [ ] REQ-14: The scene opens cleanly, the saved camera matches the delivered framing, and the final
  render exists in `renders/final/`.

## Constraints

- Blender version: current workspace Blender (record live version at production start).
- File format / resolution: `.blend` scene; PNG hero render at 1920x1080, 16:9.
- Render engine: Cycles, denoised.
- Performance / delivery limits: single still, no animation.
- External assets: none required; procedural/manual modeling preferred. Any future external asset
  must be registered in `Documents/ASSETS.md` with a compatible licence.

## Deferred

- Camera animation or orbit/turntable.
- Additional rooms or alternate camera angles.
- Character models or a visible occupant.

## Out of scope

- Animation and video output: the confirmed deliverable is a single still.
- Other rooms or a full house: only the bedroom corner is in frame.
- Real-brand replicas and logo-accurate hardware: licensing and authenticity risk; generic late-90s
  hardware instead.
- Modern equipment, RGB gaming aesthetics, or clean minimalist styling: conflicts with the confirmed
  late-90s cozy direction.

## Open questions

- None blocking. Live Blender version and GPU render settings are technical details to record during
  production.

## Research notes

Sources that informed a requirement or a pending decision. Keep long material in `References/`.

| Date | Question | Finding | Source | Effect |
|---|---|---|---|---|
| 2026-10-31 | What made 90s home PC spaces feel authentic? | Period accounts and recreations favor beige desktop PCs and CRTs, pine/MDF desks, woodgrain wall paneling, media clutter, and warm practical lighting. | VOGONS thread "What did your home PC space/room look like in the mid 90s?" https://www.vogons.org/viewtopic.php?t=101256 ; Francesco Milanese, "How I Recreated My First 1990s PC Corner" https://www.francescomilanese.com/tutorials-en-all/tut-204-en-b3d-sp-386-pc-corner.html | Informed the confirmed prop list and material palette; no additional requirement created. |

## Change log

| Date | Change | Source | Confirmed by |
|---|---|---|---|
| 2026-10-31 | Initial draft created. | make cozy retro room with computer | Pending |
| 2026-10-31 | Requirements confirmed: 90s bedroom PC corner, photoreal hero still, prop list, camera, deliverables, exclusions. | Requirements confirmation question | User: "Confirm requirements (Recommended)" |
