# Scene Health — CozyStudyRoom

- Generated: 2026-11-03
- Scene file: `cozystudyroom.blend`
- Scene hash at capture: `8201d9327e34a0b7db4927e94182ee9438d1281e3bf755ec9adc06df238d7353`
- Engine: Blender EEVEE
- Render: 1920x1080, 16:9, 128 samples, frames 1–250 at 24 fps
- Unit scale: 1.0 (1 unit = 1 m)
- Hero camera: `Camera_Hero` at (1.5, −1.55, 1.45), 30 mm lens
- Framing: 4.2 x 4.2 x 2.77 m of scene visible, centred at (0.0, 0.0, 1.38)
- Status: revision WIP; final strict `check_assets` receipt and sealed render are still pending.

## Scale and placement

| Object | Dimensions (m) | Location (m) | Notes |
|---|---|---|---|
| Floor | 4.00 x 4.00 x 0.00 | (0.00, 0.00, −0.01) | Open floor plane; 4 boundary edges expected |
| Ceiling | 4.10 x 4.10 x 0.08 | (0.00, 0.00, 2.72) | Closed box |
| Wall_Back | 4.10 x 0.10 x 2.70 | (0.00, 2.05, 1.35) | Closed box |
| Wall_Left | 0.10 x 4.10 x 2.70 | (−2.05, 0.00, 1.35) | Closed box |
| Wall_Right | 0.10 x 4.10 x 2.70 | (2.05, 0.00, 1.35) | Closed box |
| Wall_Front | 4.10 x 0.10 x 2.70 | (0.00, −2.05, 1.35) | Closed box |
| Window_Glass | 0.90 x 0.02 x 1.10 | (0.95, 1.99, 1.65) | Closed box, emissive dusk pane |
| Desk_Top | 1.80 x 0.70 x 0.06 | (−0.50, 1.55, 0.75) | Top surface z = 0.78 m; 4% above 0.75 m reference |
| Desk_Drawer | 0.36 x 0.60 x 0.36 | (0.20, 1.55, 0.55) | Closed box |
| Desk legs (4) | 0.06 x 0.06 x 0.72 | ±1.36 / 0.36, 1.25/1.85, 0.36 | Closed boxes |
| Monitor_Bezel | 0.55 x 0.04 x 0.40 | (−0.55, 1.45, 1.16) | Resized to 0.55 m target |
| Monitor_Screen | 0.59 x 0.01 x 0.35 | (−0.55, 1.43, 1.16) | Still 0.04 m wider than bezel; resize in final change |
| Monitor_Stand | 0.06 x 0.06 x 0.32 | (−0.55, 1.47, 0.95) | Closed box |
| Monitor_Base | 0.28 x 0.18 x 0.02 | (−0.55, 1.45, 0.79) | Closed box |
| Keyboard | 0.48 x 0.15 x 0.03 | (−0.55, 1.36, 0.80) | Closed box |
| Mouse | 0.06 x 0.10 x 0.04 | (−0.24, 1.36, 0.81) | Closed box |
| Mousepad | 0.76 x 0.38 x 0.01 | (−0.55, 1.36, 0.79) | Closed box |
| PC_Tower | 0.20 x 0.36 x 0.41 | (0.32, 1.62, 0.99) | Closed box |
| PC_Tower_Front | 0.19 x 0.01 x 0.39 | (0.32, 1.43, 0.99) | Closed box |
| Desk_Lamp_Base | 0.16 x 0.16 x 0.02 | (−1.28, 1.60, 0.79) | Cylinder |
| Desk_Lamp_Stem | 0.02 x 0.02 x 0.32 | (−1.28, 1.60, 0.95) | Cylinder |
| Desk_Lamp_Shade | 0.22 x 0.22 x 0.14 | (−1.28, 1.53, 1.14) | Cylinder |
| Chair_Seat | 0.48 x 0.44 x 0.07 | (−1.05, 1.00, 0.46) | Closed box |
| Chair_Back | 0.48 x 0.07 x 0.46 | (−1.05, 0.78, 0.75) | Closed box |
| Chair legs (4) | 0.04 x 0.04 x 0.46 | ±1.26 / −0.84, 0.82/1.18, 0.23 | Closed boxes |
| Rug | 2.30 x 1.80 x 0.02 | (−0.55, 0.65, 0.01) | Closed box |
| Shelf | 0.30 x 0.90 x 0.05 | (−1.85, 0.90, 1.50) | Closed box |
| Shelf brackets (2) | 0.10 x 0.04 x 0.11 | (−1.90, 0.55/1.25, 1.42) | Closed boxes |
| Wall_Art | 0.52 x 0.03 x 0.68 | (−1.45, 1.99, 1.78) | Closed box |
| Art_Frame | 0.58 x 0.03 x 0.74 | (−1.45, 1.99, 1.78) | Closed box, dark wood border |
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
- CC0 Poly Haven sources: `wood_table_001`, `fabric_pattern_07`, `wood_floor_deck`, `painted_plaster_wall`.
- Local files: `assets/external/local/Poly-Haven/*.jpg`; sidecars `SOURCE.md` and `LICENSE.txt`.
- Redistribution: allowed (CC0-1.0), recorded in `SOURCE.md`.
- `Documents/ASSETS.md` must list all four textures, sources, licence, local paths, SHA-256, and packaging before seal.
- Final `check_assets` with `{strict:true}` is required on the final unchanged scene; no strict receipt exists for this revision yet.
- Packaging: run `pack_assets` before seal so the delivered `.blend` does not depend on the ignored external JPGs.

## Lighting and camera

- `Light_Lamp`: area light, 55 W, warm `[1.0, 0.72, 0.45]`, at (−1.20, 1.10, 1.25).
- `Light_Fill`: point light, 35 W, cool `[0.55, 0.68, 1.0]`, at (−0.80, 0.00, 2.20).
- `Window_Glass` currently emits `[0.18, 0.30, 0.60]` at strength 1.0; reduce window dominance in the final change.
- Final lighting must make the warm lamp the key and keep the cool fill low-level.
- Camera is 30 mm at 16:9; desk, monitor, chair, lamp, and wall art are inside the frame.

## Known corrections for the final change

- Resize `Monitor_Screen` to match the 0.55 m bezel (target about 0.50 m wide).
- Keep desk surface at 0.78 m or document the 4% tolerance; do not lower it without moving keyboard, mouse, and desk props.
- Replace the overly busy rug/curtain fabric if needed; keep the chair fabric.
- Warm the wall art, PC tower, and window treatment; preserve the warm lamp key.
- Add the blanket/books/frame detail to the final review evidence.
- Update `README.md`, `DECISIONS.md`, and `ASSETS.md` from their stale procedural/no-external-assets wording.
- Run strict `check_assets` after `pack_assets` and before seal; record the receipt here.
- Inspect the exact sealed render with `blender_look` before dispatch.
