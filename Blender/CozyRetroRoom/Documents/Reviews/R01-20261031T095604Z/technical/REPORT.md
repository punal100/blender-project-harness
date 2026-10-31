# Grader Report — technical

- Round: R01-20261031T095604Z
- Grader: technical
- Focus: scale, geometry, topology, render settings, missing files, scene health
- Model/variant: ocg/deepseek-v4.1-flash / punal-9router-compatable
- Target: base 82470c61a95e43908ada1106ed36381fa8184e11; scene SHA-256 C3C7ED0CAD03301C82AD2CE20DD1C9267761AACE1D4CDE5834B20BBC1AF6D263; dirty true
- Verdict: CHANGES_REQUIRED
- Evidence inspected: _evidence/camera.png, _evidence/scene.txt; Documents/REQUIREMENTS.md; Documents/Goals/01-project-brief.md

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 5 Geometry and scale | PASS (minors F-02–F-04) | scene.txt: unit scale 1.0; desk top 0.75 m, chair seat 0.44 m, monitor 0.42×0.30 m, keyboard 0.44 m; solids all quads, 0 non-manifold |
| 7 Technical readiness | FAIL | scene.txt: EEVEE, 1920x1080, Camera_Hero, no HDRI; camera.png wall noise F-01 |
| 1,2,3,4,6 | not-assessed | outside assigned focus |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.65 | major | 7 | REQ-13 | camera.png, back wall flanking lamp at ~(1200–1320, 490–660) and (1450–1580, 520–665) px | Two bright orange patches have ragged, speckled/noisy penumbra unlike surrounding smooth paneling; reads as EEVEE shadow/reflection noise or light leak through/around paneling — a visible render artifact | Raise shadow/ray samples or sample count and area-light size; seat paneling tight to wall, then re-render and confirm patches are smooth or intentional |
| F-02 | 0.80 | minor | 5 | REQ-13 | scene.txt lines 66–71; camera.png desk left ~(640–735, 585–630) px | Zero-thickness floppies: Floppy_0 lies exactly on desktop (z 0.75 vs desk top 0.75, coplanar/z-fight); Floppy_1 and Floppy_2 both at z 0.76 and overlap in plan; labels sit 1 cm above disk 0 or coplanar with disks 1–2 | Give disks 2–3 mm thickness, stack with 3 mm steps, labels 0.1 mm proud |
| F-03 | 0.85 | minor | 5 | REQ-13 | scene.txt line 57 vs line 23 | Keyboard base at z 0.74, 1 cm inside desktop (top 0.75) — hero prop interpenetration, occluded in this view | Raise keyboard 1 cm to rest on desktop; adjust cable |
| F-04 | 0.65 | minor | 5 | REQ-09 / REQ-13 | scene.txt lines 33, 35 | Chair seat bottom 0.435 m over leg-frame top 0.42 m: 15 mm unsupported gap under seat | Lower seat 15 mm or extend leg frame to seat underside |

## Residual risks

- Missing-file state unverified: evidence has no datablock/library list and `Documents/ASSETS.md` was blocked by tool permissions. scene.txt shows HDRI none and no image textures, but font/image dependencies cannot be confirmed clean.
- Sample count, colour management, and render output path/format absent from evidence; `renders/final/` deliverable not inspectable under permissions.
- F-01 cause inferred from pixels, not confirmed via EEVEE settings.
- Saved-scene hash and dirty tree cannot be recomputed with the supplied read-only evidence.
