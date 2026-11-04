# Grader Report — visual

- Round: R05-20261104T223723Z
- Grader: visual
- Focus: composition, camera, lighting, colour, materials, mood, detail and storytelling
- Model/variant: punal-9router-compatable/layso/claude-sonnet-5-5 / xhigh
- Target: base 5eb5c5e133005f5acd216bd333af03e9bf340fb6, saved scene SHA-256 67cb24fa192af05984b3903ea6a115c197aefeb3f8839a94917a7f87bdedc79f, project dirty
- Evidence key: a917b013f986323fde75a285b1fbc84d827e7084ac0447109053e11ff3cbbcf7
- Verdict: CHANGES_REQUIRED
- Evidence inspected: Documents/REQUIREMENTS.md; Documents/Reviews/R05-20261104T223723Z/_evidence/scenes/Scene/camera.png; Documents/Reviews/R05-20261104T223723Z/_evidence/scenes/Scene/scene-facts.json (scene.txt has the same hash). renders/final/R05-20261104T223723Z.png has the same SHA-256 as camera.png, but a direct read of it was denied by permissions, so camera.png was used.

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1 Spec fidelity | not-assessed | Outside the visual focus. Visual observations on REQ-06, REQ-07 and REQ-08 are folded into the findings below. |
| 2 Composition and camera | PASS | HeroCamera z=1.47 m, pitch about 80 deg, yaw -16 deg, 1920x1080. The desk, monitor, tower, keyboard and mouse sit centre-frame and read as a workstation. Only minor cropping issues remain (F-03). |
| 3 Lighting and exposure | FAIL | Warm and cool contrast is present. Shadows are crisp rather than soft (F-01), and the lower third is crushed (F-05). |
| 4 Materials and colour | PASS | Cohesive warm palette with a cool dusk-blue window accent, and flat stylized shading consistent with REQ-02. Only minor window-panel and prop-fidelity notes (F-02, F-04). |
| 5 Geometry and scale | not-assessed | Outside the visual focus. scene-facts shows the desk top at z=0.76 and the chair seat at 0.45. Bed length is 1.98 and the room is 3.6x3.2x2.6 (matches REQ-03 and REQ-09). The door frame spans x 1.77–1.80, flush with the WallRight inner face at 1.80 (R01 F-01 fixed). |
| 6 Detail and storytelling | PASS | Bed with pillows and blanket, bookshelf with 3 books, rug, plant, mug, desk lamp, floor lamp, wall art and curtains are all visible or implied. Some props read as placeholders (F-04). |
| 7 Technical readiness | not-assessed | Outside the visual focus. Engine is EEVEE, 1920x1080, camera set. |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.65 | major | 3 | REQ-06 | camera.png: floor lamp and shade shadow on the right wall (about x1750–1900, y215–1000); hard-edged dark patch on the floor under and left of the chair (about x830–1250, y1000–1080); triangular shadow on the desk right panel (about x1230–1370, y650–940) | REQ-06 requires soft shadows. Shadows from the lamps and props have crisp, sharply defined edges, so the lamp lighting reads as hard point-light shadows rather than soft evening light. | Raise the lamp light radius (soft size) on FloorLampLight, DeskLampLight and PendantLight to about 0.08–0.2 m, ensure soft shadows are enabled, and re-render. |
| F-05 | 0.60 | minor | 3 | REQ-06 | camera.png: chair back and seat (about x860–1200, y660–1000), tower (about x1150–1310, y415–620), floor foreground below y900 | The chair and tower are near-black and merge with the dark floor and shadow patch. The lower third of the frame is crushed, with little separation for the chair. | Lift the chair and tower material value slightly, or add a low-energy warm fill, so that form is readable in the lower half of the frame. |
| F-02 | 0.60 | minor | 4 | REQ-06, REQ-08 | camera.png: window (about x30–650, y10–540), bright hot-spot band at about x250–450, y270–300 | The window is the largest and most saturated area in the frame and competes with the monitor as the focal point. It reads as a flat blue panel, and the near-white hot-spot band looks like a light artefact on the pane (REQ-06 asks for no blown-out highlights). | Reduce WindowLight strength or move it farther from the pane to remove the hot spot, and soften or darken the dusk-blue emission. |
| F-03 | 0.60 | minor | 2 | REQ-08 | camera.png: chair base clipped at the bottom edge (y1080), floor lamp shade nearly tangent to the right edge (x about 1900), bed cut off at the left | Furniture is cropped awkwardly, and the lamp shade is tangent to the frame edge. | Nudge HeroCamera slightly (back or right) or loosen the lens a little so the chair base and lamp shade clear the frame edges. |
| F-04 | 0.60 | minor | 6 | REQ-01, REQ-05 | camera.png: monitor screen (about x775–1020, y425–580), wall art (about x745–920, y150–370), mug (about x1190–1235, y590–635) | The monitor screen is a flat orange fill, the wall art is a blank sage rectangle, and the mug is a handleless cylinder. These read as placeholder primitives and weaken the lived-in storytelling. | Give the screen a simple procedural gradient or UI bands, add a simple procedural pattern to WallArtPanel, and add a small torus handle to Mug. |

## Re-review

The R04 visual report was not supplied by path, so these dispositions rest on the ticket and the evidence only.

- R04 visual F-01 (rug partly occluded by the plant): ACCEPTED as declined. The rug is visible at the lower right (about x1195–1650, y880–1040), the pot sits on it (rug top z=0.024), and REQ-05 only requires a rug.
- R01 visual F-01 (door interpenetration): FIXED. DoorFrame spans x 1.77–1.80, flush with the WallRight inner face at x=1.80, and DoorPanel spans x 1.75–1.77 with no overlap. This is verified from scene-facts only, because the door is outside the hero frame.
- R01 technical F-01 (flat curtains): accepted as stylized. CurtainRod exists at z=2.23. In the render the right curtain reads as a flat rust-coloured slab (about x655–750).

## Residual risks

- The door is not visible in the hero frame. It sits on the right wall near the camera and is outside the horizontal field of view. REQ-03 compliance for the door rests on scene-facts only.
- The camera lens and light radii are not in scene-facts, so F-01 and F-03 rest on visual evidence alone.
- PendantCord has no material slot. It is not visible in frame.
- Duplicate-suffixed material names (.001 to .005) are present but have no visible effect.
- Grain is visible in the dark bed area at 64 samples.
- Pixel values were not measured, so the near-clipping judgement on the window hot spot and the pillows is by eye.
