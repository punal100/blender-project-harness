# Grader Report — technical

- Round: R03-20261103T160339Z
- Grader: technical
- Focus: scale, geometry, topology, render settings, missing files, scene health
- Model/variant: ocg/deepseek-v4.1-flash / Max
- Target: base 1efbf7651a917db8106fc86d66c6faba75876a56, saved scene SHA-256 bcd301aa8efaafa7685a596be4bd0c285eece53878405fdc288295c1e6e86279, project dirty (M cozystudyroom.blend, README, DECISIONS, ASSETS, SCENE-HEALTH, TASKSTRACKER; untracked Tasks/T058 and the final PNG)
- Evidence key: 99a94f2251ef3b9d7b771be68bec72a1330ecdab79621ea01c3df0fdd19724f9
- Verdict: PASS
- Evidence inspected: REQUIREMENTS.md, WORKFLOW.md, REVIEW.md, Goals/01-project-brief.md, scene-facts.json (identical content to scene.txt), camera.png (byte-identical to renders/final/R03-20261103T160339Z.png), manifest.json

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1 Spec fidelity (technical requirements REQ-07, REQ-08, REQ-09) | PASS | Room shell 4.1 m x 4.1 m x 2.72 m, monitor bezel 0.55 m wide; saved scene at project root with sealed hash; 1920x1080 final render in renders/final/. Minor deviations listed below. |
| 2 Composition and camera | not-assessed | Outside assigned focus (visual grader). |
| 3 Lighting and exposure | not-assessed | Outside assigned focus (visual grader). |
| 4 Materials and colour | not-assessed | Outside assigned focus (visual grader). |
| 5 Geometry and scale | PASS | scene-facts.json measurements: one 4x4 m floor plane, 2.7 m walls, 0.75-0.78 m desk, 0.55/0.40 m monitor, 0.064 m mouse, 0.48 m keyboard; all meshes 0 loose vertices, 0 degenerate faces, 0 non-manifold edges except the floor plane's 4 open boundary edges (expected). Minor grounding/interpenetration errors F-01 to F-03. |
| 6 Detail and storytelling | not-assessed | Outside assigned focus (visual/spec graders). |
| 7 Technical readiness | PASS | Render settings 1920x1080, EEVEE, 128 samples, AgX, film_transparent false, Camera_Hero set as scene camera, no stray helper objects, single purpose-named collection, textured render resolves all image data; see residual risk on packing verification. |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.85 | minor | 5 | REQ-07 | scene-facts.json: Floor location z=-0.01 / dims 4x4x0; Desk_Leg_FL 0.36-0.36; Chair_Leg_FL 0.23-0.23; Rug 0.012-0.012; Baseboard_Back 0.06-0.06 | Floor surface is 1 cm below every ground-contact object, so desk, chair, rug and baseboards all hover 1 cm above the floor plane (contact shadows hide most of it in camera.png). | Move Floor to z=0.00 so its surface coincides with object bases, then re-render. |
| F-02 | 0.80 | minor | 5 | REQ-07 | scene-facts.json: Rug location z=0.012, dims 2.3x1.8x0.024 (top 0.024); Chair_Leg_FL/FR/BL/BR bottom z=0.00; Desk_Leg_FL/FR bottom z=0.00 at y=1.25 inside rug y range -0.25..1.55 | Chair legs and both front desk legs pass 2.4 cm into the rug slab; the chair reads as sunk into the rug rather than resting on it. | Raise the chair by 0.024 m, and end the rug before the desk front legs (y <= 1.20) or raise the desk legs' contact accordingly. |
| F-03 | 0.75 | minor | 5 | REQ-04 / REQ-07 | scene-facts.json: PC_Tower x 0.22..0.42 and PC_Tower_Front x 0.224..0.416 vs Desk_Top x -1.40..0.40 | PC tower base overhangs the desk's right edge by 0.02 m; the tower is supported on only part of its footprint. | Shift PC_Tower and PC_Tower_Front 0.02 m left (tower x 0.20..0.40) so the base sits fully on the desk top. |
| F-04 | 0.70 | minor | 5 | REQ-07 | scene-facts.json: Desk_Top location z=0.75 with 0.06 thickness (top face 0.78); legs 0.00..0.72 | Desk work surface measures 0.78 m, 3 cm above the confirmed 0.75 m desk height in REQ-07. | Lower Desk_Top to a 0.75 top face (center z=0.72) with legs shortened to 0.69, and drop the desk-surface items by 0.03; otherwise record 0.78 m as accepted intent. |

## Re-review

No prior finding IDs or dispositions were supplied for R02, and the R02 report path was not assigned; no F-ID mapping was performed.

## Residual risks

- Asset packing could not be verified from the sealed evidence: manifest.json carries `asset_check: null`, and scene-facts.json has no image/packed-file section. The render shows all textures resolved and the ledger records a successful check_assets at T056, but that check predates the seal save.
- Live scene inspection is disallowed, so unit scale (scene unit settings) and any hidden/disabled objects outside the captured inventory cannot be confirmed.
- frame_start 1 / frame_end 250 and use_sequencer true with zero strips are default settings with no visible effect on the still, but the sequence range is not representative of the deliverable.
- Dimension 5 minors are boundary-condition issues (1-3 cm); they are not acceptance blockers at the delivered camera distance and were not confirmed as visible artifacts in camera.png beyond the rug contact.