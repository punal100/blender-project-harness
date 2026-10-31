# Requirements — CozyRetroDen

Status: Confirmed
Defined: 2026-10-31
Last updated: 2026-10-31
Confirmed: 2026-10-31
Confirmation: "Confirm requirements (Recommended)" plus "Cycles (Recommended)" for the presented draft: cozy 1980s home-computer den interior, stylized realism, one hero still, procedural assets only, warm cinematic light, expanded into REQ-01 to REQ-08 below.

Confirmed requirements are the source of truth. Add or change them only after explicit user confirmation.

## Core value

Cozy 1980s home computer den interior in stylized realism, one hero Cycles still.

## Confirmed requirements

### Purpose and audience

- REQ-01: The scene is one interior room: a 1980s home-computer den. A viewer seeing only the final still must recognise both the era and the room's purpose (home computing den).
- REQ-02: The deliverable is one hero still render. No animation, no second room, no characters.

### Visual outcome

- REQ-03: Style is stylized realism: believable proportions, PBR materials, slightly idealized clean shapes, no low-poly faceting and no photoreal grime obsession.
- REQ-04: The computer (beige CRT monitor, keyboard) on the desk is the focal point. Framing is a wide three-quarter interior view showing desk, wall treatment, and surrounding room context; camera at roughly standing/seated eye level.
- REQ-05: Lighting is warm incandescent practicals (desk lamp and/or floor lamp) with a cool CRT-screen glow as accent. Mood is cozy, golden, lived-in. Practicals must be visible light sources, not just fills.
- REQ-06: Palette is warm browns/oranges (wood panelling, rug) against beige computer plastics, with small saturated period accents (posters, books, upholstery).
- REQ-07: Materials are procedural node materials only: wood grain, fabric, beige plastic, metal, paper. No external image textures.
- REQ-08: Geometry is procedural only, built in Blender from primitives and modifiers. No imported models, no external asset downloads, no third-party data embedded in the `.blend`.

### Scope and delivery

- REQ-09: Scene contents: wood-panelled walls, floor with shag rug, desk, beige CRT computer with keyboard and mouse, desk chair, at least two shelving/storage elements with period clutter, 1-2 wall posters, curtains or window treatment, one desk lamp and one floor lamp (or two practicals total), ceiling/floor trim.
- REQ-10: Deliverables: `cozyretroden.blend` saved at the project root, final PNG in `renders/final/`, and current project documents.
- REQ-11: Render uses Cycles. Resolution 1920x1080 as production default (adjustable as implementation detail only if quality or time requires it).
- REQ-12: The final render must be free of visible artifacts: no clipping through the camera, no black/blank frames, no obvious mesh intersections, no missing material (magenta) surfaces.

## Constraints

- Blender version: recorded at launch from `blender_get_addon_status`.
- File format / resolution: `.blend` scene; final PNG 1920x1080 (provisional production default).
- Performance / delivery limits: one hero still only; Cycles sample count tuned to finish the still in reasonable time.
- External assets: none; procedural only. `Documents/ASSETS.md` stays empty of third-party entries.

## Deferred

- Detail renders or close-ups.
- Camera animation.
- Alternative era variants.

## Out of scope

- External/downloaded assets, HDRIs, or textures: user chose procedural modeling only.
- Characters or people.
- Animation.
- Second room or exterior view.
- Photorealistic dirt/grime detail pass.

## Open questions

- Final Cycles sample count and denoise settings: implementation detail, decided during production based on render time.
- Exact wall panelling style, poster subjects, and clutter objects: implementation detail within the confirmed 80s den direction.

## Research notes

No external research was required: the era, style, deliverable, and asset policy were all chosen explicitly by the user in discussion.

## Change log

| Date | Change | Source | Confirmed by |
|---|---|---|---|
| 2026-10-31 | Initial draft created. | make cozy retro room with computer | Pending |
| 2026-10-31 | Requirements confirmed and expanded into REQ-01 to REQ-12. | User answers to era, style, deliverable, asset, and engine questions | User: "Confirm requirements (Recommended)" and "Cycles (Recommended)" |
