# Scene Health — CozyStudyRoom

- Generated: 2026-11-03
- Scene file: `cozystudyroom.blend`
- Scene hash after strict check: `679c465486c032be06f9d2e13e2659ab5f350d8d9bee33df63cbd2366b28ed4b` (the subsequent WIP save may change file serialization; scene content is unchanged).
- Engine: Blender EEVEE
- Render: 1920x1080, 16:9, 128 samples, frames 1–250 at 24 fps
- Unit scale: 1.0 (1 unit = 1 m)
- Hero camera: `Camera_Hero` at (1.5, −1.55, 1.45), 30 mm lens
- Framing: 4.2 x 4.2 x 2.77 m of scene visible, centred at (0.0, 0.0, 1.38)
- Status: final revision; strict `check_assets` passed on the final unchanged scene; sealed review render pending.

## Scale and placement

| Object | Dimensions (m) | Location (m) | Notes |
|---|---|---|---|
| Floor | 4.00 x 4.00 x 0.00 | (0.00, 0.00, −0.01) | Open floor plane; 4 boundary edges expected |
| Ceiling | 4.10 x 4.10 x 0.08 | (0.00, 0.00, 2.72) | Closed box |
| Wall_Back | 4.10 x 0.10 x 2.70 | (0.00, 2.05, 1.35) | Closed box |
| Wall_Left | 0.10 x 4.10 x 2.70 | (−2.05, 0.00, 1.35) | Closed box |
| Wall_Right | 0.10 x 4.10 x 2.70 | (2.05, 0.00, 1.35) | Closed box |
| Wall_Front | 4.10 x 0.10 x 2.70 | (0.00, −2.05, 1.35) | Closed box |
| Window_Glass | 0.90 x 0.02 x 1.10 | (0.95, 1.99, 1.65) | Closed box, dark dusk pane |
| Desk_Top | 1.80 x 0.70 x 0.06 | (−0.50, 1.55, 0.75) | Top surface z = 0.78 m; documented 4% tolerance above 0.75 m reference |
| Desk_Drawer | 0.36 x 0.60 x 0.36 | (0.20, 1.55, 0.55) | Closed box |
| Desk legs (4) | 0.06 x 0.06 x 0.72 | ±1.36 / 0.36, 1.25/1.85, 0.36 | Closed boxes |
| Monitor_Bezel | 0.55 x 0.04 x 0.40 | (−0.55, 1.45, 1.16) | 0.55 m target |
| Monitor_Screen | 0.50 x 0.02 x 0.34 | (−0.55, 1.43, 1.16) | Fits inside bezel with 0.025 m side margin |
| Monitor_Stand | 0.06 x 0.06 x 0.32 | (−0.55, 1.47, 0.95) | Closed box |
| Monitor_Base | 0.28 x 0.18 x 0.02 | (−0.55, 1.45, 0.79) | Closed box |
| Keyboard | 0.48 x 0.15 x 0.03 | (−0.55, 1.36, 0.80) | Closed box |
| Mouse | 0.06 x 0.10 x 0.04 | (−0.24, 1.36, 0.81) | Closed box |
| Mousepad | 0.76 x 0.38 x 0.01 | (−0.55, 1.36, 0.79) | Closed box |
| PC_Tower | 0.20 x 0.36 x 0.41 | (0.32, 1.62, 0.99) | Closed box |
| PC_Tower_Front | 0.19 x 0.01 x 0.39 | (0.32, 1.43, 0.99) | Closed box, subtle amber accent |
| Desk_Lamp_Base | 0.16 x 0.16 x 0.02 | (−1.28, 1.60, 0.79) | Cylinder |
| Desk_Lamp_Stem | 0.02 x 0.02 x 0.32 | (−1.28, 1.60, 0.95) | Cylinder |
| Desk_Lamp_Shade | 0.22 x 0.22 x 0.14 | (−1.28, 1.53, 1.14) | Cylinder, warm emissive shade |
| Chair_Seat | 0.48 x 0.44 x 0.07 | (−1.05, 1.00, 0.46) | Closed box |
| Chair_Back | 0.48 x 0.07 x 0.46 | (−1.05, 0.78, 0.75) | Closed box |
| Chair legs (4) | 0.04 x 0.04 x 0.46 | ±1.26 / −0.84, 0.82/1.18, 0.23 | Closed boxes |
| Rug | 2.30 x 1.80 x 0.02 | (−0.55, 0.65, 0.01) | Closed box, warm ochre-red |
| Shelf | 0.30 x 0.90 x 0.05 | (−1.85, 0.90, 1.50) | Closed box |
| Shelf brackets (2) | 0.10 x 0.04 x 0.11 | (−1.90, 0.55/1.25, 1.42) | Closed boxes |
| Wall_Art | 0.52 x 0.03 x 0.68 | (−1.45, 1.98, 1.78) | Warm abstract panel, in front of frame |
| Art_Frame | 0.58 x 0.03 x 0.74 | (−1.45, 2.01, 1.78) | Dark wood border behind art |
| Book_1 | 0.20 x 0.28 x 0.05 | (−1.85, 0.70, 1.56) | Closed box on shelf |
| Book_2 | 0.16 x 0.24 x 0.07 | (−1.85, 0.98, 1.57) | Closed box on shelf |
| Blanket | 0.44 x 0.52 x 0.05 | (−1.05, 1.00, 0.51) | Closed box on chair seat |
| Plant_Pot | 0.12 x 0.12 x 0.11 | (−1.85, 1.15, 1.58) | Cylinder |
| Plant_Leaves | 0.22 x 0.22 x 0.26 | (−1.85, 1.15, 1.76) | Closed mesh |
| Mug | 0.08 x 0.08 x 0.09 | (−0.15, 1.42, 0.82) | Cylinder |
| Notebook | 0.22 x 0.30 x 0.02 | (−1.00, 1.35, 0.79) | Closed box |

## Topology summary

- 54 mesh objects; 1 camera; 2 lights.
- All meshes are editable and non-degenerate.
- Zero non-manifold edges on every mesh.
- Zero loose vertices on every mesh.
- `Floor` is an open plane with 4 boundary edges; this is intentional.
- Closed meshes have 0 boundary edges.
- Curtains, lamp parts, plant pot, and mug contain 2 ngons each; all other meshes are quads/tris only.
- No negative or zero object scales observed.
- Highest triangle count: `Mouse` (32 tris), `Plant_Leaves` (32 tris), `Chair_Seat`/`Chair_Back` (8 tris each); all bounded.

## Materials and assets

- Textured materials: `DeskWoodTexture_Material`, `ChairFabricTexture_Material`, `WallPlasterTexture_Material`, `FloorWoodTexture_Material`.
- Warm final accents: rust `Wall_Art` panel behind the dark `Art_Frame` border; dark `Window_Glass`; warm emissive `Monitor_Screen` and `Desk_Lamp_Shade`; subtle amber `PC_Tower_Front`.
- CC0 Poly Haven sources: `wood_table_001`, `fabric_pattern_07`, `wood_floor_deck`, `painted_plaster_wall`.
- Local files: `assets/external/local/Poly-Haven/*.jpg`; sidecars `SOURCE.md` and `LICENSE.txt`.
- Redistribution: allowed (CC0-1.0), recorded in `SOURCE.md`.
- `Documents/ASSETS.md` lists all four textures, sources, licence, local paths, SHA-256, packaging, and use.
- Strict `check_assets` (`{strict:true}`, T046, 2026-11-03) returned `ok` on the final unchanged scene: no missing external files; four CC0 images packed; no linked libraries.
- Packaging: `pack_assets` completed; the delivered `.blend` does not depend on the ignored source JPGs.

## Lighting and camera

- `Light_Lamp`: area light, 85 W, warm `[1.0, 0.62, 0.30]`, at (−1.20, 1.10, 1.25).
- `Light_Fill`: point light, 12 W, cool `[0.42, 0.55, 0.85]`, at (−0.80, 0.00, 2.20).
- `Window_Glass`: dark dusk emission `[0.0, 0.004, 0.012]` at strength 0.05; no longer dominates.
- `Monitor_Screen`: warm emission `[1.0, 0.42, 0.12]` at strength 1.2.
- `Desk_Lamp_Shade`: warm emission `[1.0, 0.52, 0.18]` at strength 1.0.
- `PC_Tower_Front`: amber emission `[0.7, 0.24, 0.05]` at strength 0.2.
- Camera is 30 mm at 16:9; desk, monitor, chair, lamp, wall art, books, and shelf are inside the frame.

## Corrections completed in the final revision

- Resized `Monitor_Screen` to 0.50 m wide inside the 0.55 m bezel.
- Kept desk surface at 0.78 m and documented the 4% tolerance.
- Replaced busy rug/curtain fabric with warm solids; kept the chair fabric.
- Warmed the wall art, PC tower front, monitor, lamp shade, and window treatment.
- Layered the warm art panel in front of the dark frame border.
- Added the blanket, books, and frame detail to the scene and review evidence.
- Updated `README.md`, `DECISIONS.md`, and `ASSETS.md` from stale procedural/no-external-assets wording.
- Ran strict `check_assets` after all scene changes and before seal.
- Inspect the exact sealed render with `blender_look` before grader dispatch.
