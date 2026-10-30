# Design Decisions — CozyRetroRoom

Record decisions that affect the visual result, scope, assets, or delivery. Keep the reason and
impact, not a diary.

| Date | Decision | Reason | Impact |
|---|---|---|---|
| 2026-10-31 | Project scaffold created. | New design project. | Fill README and goal before building. |
| 2026-10-31 | Anchored the scene in a late-90s small bedroom PC corner. | User selected this era and room type; it gives a clear nostalgic anchor and intimate framing. | Props, palette, and camera are constrained to a compact bedroom corner. |
| 2026-10-31 | Chose photoreal PBR with a single 1920x1080 hero still. | User selected photoreal style and the hero still deliverable. | No animation; effort goes into materials, lighting, and one strong composition. |
| 2026-10-31 | Use generic hardware and props, no real brand logos. | Avoids licensing issues and keeps the image era-evocative rather than a replica. | CRT, tower, posters, and media are original designs. |
| 2026-10-31 | Build everything in-scene; no external assets planned. | The scene is achievable procedurally and keeps the file self-contained with no licence overhead. | Any later external asset must be registered in `ASSETS.md` before use. |
| 2026-10-31 | Work Partially Autonomous, one meaningful change per approval. | User selected "Partial autonomous" in the initial request. | Save and inspect after each change, then pause the goal and ask for approval. |
| 2026-10-31 | Blockout baseline: 3.6 x 4.4 x 2.6 m room, desk top at 0.78 m against the back wall, CRT and tower on the desk, window placeholder on the back wall, 40 mm hero camera. | Gives a real-world-scaled composition with the computer as focal point. | Blockout is the baseline for proportion and framing; detail and materials come next after approval. |
| 2026-10-31 | Final framing: 38 mm three-quarter view from the right-front, camera at 1.33, -1.86, 1.32 m aimed at -0.66, 1.36, 0.88 m. | Keeps the CRT and keyboard dominant while showing enough room context and the rug edge. | Authoritative camera for the delivered still. |
| 2026-10-31 | Back wall gets a wood wainscot with vertical planks, a night window with curtains, and a media shelf above the desk. | Satisfies the confirmed woodgrain paneling, window ambience, and media-clutter requirements in one coherent wall treatment. | Divides warm wood below from quieter plaster above. |
| 2026-10-31 | Added a patterned rug, teal folded throw, warm cushion, snake plant, floppy/CD stacks, game boxes, and cables. | Fills the foreground and supports the lived-in, late-90s bedroom read. | Textiles and clutter stay subordinate to the computer. |
| 2026-10-31 | Generated the CRT desktop, poster prints, note paper, rug pattern, and evening window view procedurally and packed the images. | Keeps the file self-contained with no third-party licences or missing links. | No external assets; images are embedded in the `.blend`. |
| 2026-10-31 | Lit with a warm tungsten lamp, cool CRT area light, cool window fill, and a soft camera-side bounce; rendered with Cycles GPU, 256 samples, denoise, AgX, exposure +0.52. | Produces the warm-pool versus cool-window contrast with clean, deliverable still quality. | Final render at 1920x1080 in `renders/final/`. |
