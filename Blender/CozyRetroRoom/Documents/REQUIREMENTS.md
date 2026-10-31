# Requirements — CozyRetroRoom

Status: Confirmed
Defined: 2026-10-31
Last updated: 2026-10-31
Confirmed: 2026-10-31
Confirmation: "Confirm requirements (Recommended)" in answer to "Do these requirements look right for CozyRetroRoom?" — scope: the full draft brief presented in chat on 2026-10-31 (1980s beige-PC den, desk-corner hero shot, warm lamp + CRT glow, Partially Autonomous, review mode All).

Confirmed requirements are the source of truth. Add or change them only after explicit user confirmation.

## Core value

Cozy 1980s retro computer den, desk-corner hero shot.

## Confirmed requirements

### Purpose and audience

- REQ-01: Deliver one still hero image of a cozy 1980s home-computer den for viewers who want a nostalgic, warm, richly detailed retro interior.
- REQ-02: The computer and its immediate desk setup are the unmistakable focal point; the room supports it rather than competing with it.

### Visual outcome

- REQ-03: Include a beige CRT computer (monitor plus system unit) and beige keyboard on an oak desk.
- REQ-04: Surround the desk with 1980s cues: wood wall paneling, shag rug, chair, poster or wall art, window edge, floppy disks, and a mug.
- REQ-05: Camera is a close-medium 16:9 desk-corner hero shot, computer centred or near-centred, window edge visible, believable eye-level or slightly low perspective.
- REQ-06: Lighting mixes a warm amber desk lamp with teal-green CRT glow, soft evening shadows, and a cozy nostalgic mood.
- REQ-07: Palette stays cohesive: warm amber, oak brown, and beige against teal-green monitor glow.
- REQ-08: Materials read deliberately — wood grain, beige plastics, fabric, paper, and glass — at review-render scale.
- REQ-09: Scale is real-world metric; desk, chair, and computer proportions read correctly.

### Scope and delivery

- REQ-10: Scene is saved as `cozyretroroom.blend` in the project root.
- REQ-11: One final review render at 1920×1080 (16:9) is saved under `renders/final/`.
- REQ-12: README, `REQUIREMENTS.md`, `WORKFLOW.md`, `REVIEW.md`, `DECISIONS.md`, and `ASSETS.md` are current at delivery.
- REQ-13: No floating or intersecting hero props; no visible render artifacts; scene opens with no missing files.

## Constraints

- Blender version: the installed version reported by the workspace launcher and MCP addon.
- File format / resolution: `.blend` scene; PNG review render at 1920×1080.
- Performance / delivery limits: single still image; no animation required; render must complete interactively for review.
- External assets: procedural modeling and materials preferred; any third-party asset must be registered in `Documents/ASSETS.md` with licence before use and linked with relative paths.

## Deferred

- Additional camera angles and detail renders.
- Volumetric dust and heavy atmospheric effects.
- More period props beyond the confirmed list.
- Animation or interactive walkthrough.

## Out of scope

- Animation, rigged characters, or people.
- Full house or exterior architecture.
- Audio.
- Paid or unlicensed external assets.

## Open questions

- None.

## Research notes

No external research was required; the visual direction was chosen directly by the user from offered options.

| Date | Question | Finding | Source | Effect |
|---|---|---|---|---|
| 2026-10-31 | Initial scope | User selected 1980s beige PC den, desk-corner hero shot, warm lamp + CRT glow, review mode All. | User answers in chat | Defines REQ-01 to REQ-11. |

## Change log

| Date | Change | Source | Confirmed by |
|---|---|---|---|
| 2026-10-31 | Initial draft created. | make cozy retro room with computer | Pending |
| 2026-10-31 | Requirements confirmed and recorded as REQ-01 to REQ-13. | Requirements draft in chat | User: "Confirm requirements (Recommended)" |
