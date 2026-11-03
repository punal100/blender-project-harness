# Design Decisions — CozyStudyRoom

Record decisions that affect the visual result, scope, assets, or delivery. Keep the reason and
impact, not a diary.

| Date | Decision | Reason | Impact |
|---|---|---|---|
| 2026-11-03 | Project scaffold created. | New design project. | Persist exact requirements, workflow, and review records; fill README and start the filled goal before launch. |
| 2026-11-03 | Use a warm practical desk lamp as key light with cool low-level window/ambient fill. | The user chose a warm evening lamp-lit mood; a single warm source risks a flat orange image without cool separation. | Lighting rig must include a visible lamp fixture and a restrained cool fill. |
| 2026-11-03 | Permit free CC0 Poly Haven textures and HDRIs, registered in ASSETS.md. | User approved CC0 downloads; textures materially improve wood, fabric and rug realism. | Each download requires source/licence records and packing/relative-path checks. |
| 2026-11-03 | Keep desktop PC (monitor, keyboard, mouse, tower) as the centered focal subject. | User selected desktop PC plus monitor and a desk-corner hero frame. | Camera and set dressing must lead the eye to the workstation. |
| 2026-11-03 | Use four CC0 Poly Haven textures (wood table, fabric pattern, wood floor, painted plaster) instead of procedural-only materials. | R01 found the flat materials a major visual/spec issue; textures make wood, fabric, floor, and walls read at real-world scale. | Four external JPGs are registered with source, licence, SHA-256, and `Redistribution allowed: yes`; pack them before delivery and keep the source binaries git-ignored. |
| 2026-11-03 | Warm the palette with ochre wall art, warm PC metal, and a less dominant dusk window. | R01 found the cool grey walls, teal art, blue window, and navy tower displaced the requested warm evening mood. | The lamp remains the warm key; the window becomes a restrained blue accent and the wall art/PC become warm. |
| 2026-11-03 | Add a dark wood frame behind the wall art, two shelf books, and a folded rust blanket on the chair. | R01 found the bare teal art and sparse props visually weak. | The desk-corner frame gains lived-in detail without changing the PC focal point. |
| 2026-11-03 | Resize the monitor bezel to 0.55 m and document the 0.78 m desk surface as a 4% tolerance. | R01 technical review flagged the 0.64 m bezel and 0.78 m desk against the 0.55 m / 0.75 m references. | The monitor now matches the requested width; the desk remains at its built height because keyboard, mouse, and props are placed for it. |
| 2026-11-03 | Use a dusk-blue emissive window and a warm textile rug/curtain treatment. | The cool window balances the warm desk lamp, while textile surfaces add warmth and lived-in softness. | The window is a restrained blue accent; the rug/curtains may use the fabric texture or a warmer solid if the pattern is too busy in the sealed render. |
| 2026-11-03 | Light the desk with a soft area lamp and add a low cool ceiling fill. | A point light close to the lamp shade cast hard silhouette shadows; an area source gives a soft falloff. | Deep but soft shadows; the window and fill keep the room from going flat or black. |
| 2026-11-03 | Final visual pass: warm painted walls, abstract art accents, warm right curtain, reduced monitor/PC emission, deep-red rug, cream blanket. | R02 visual review found cool vertical wall striping, blank art, flat emissive panels, and weak textile legibility. | The painted plaster texture remains packed and registered but is not applied; the room reads warmer and the art/textiles are legible. |
