# Grader Report — technical

- Round: R01-20261031T190358Z
- Grader: technical
- Focus: scale, geometry, topology, render settings, missing files, scene health
- Model/variant: ocg/deepseek-v4.1-flash / unspecified
- Target: 1d5b4743e30521fbb8f0ab0456bca6833083d42b, saved scene SHA-256 0ad883c845e8d029e6e9603f3b8f694633e0f7021e300fb1988e647e6376083e, dirty
- Evidence key: 5f6d6b8856af1029ff78ffee0239db85b86af5c7f16ea0654075b2f7e871d687
- Verdict: CHANGES_REQUIRED
- Evidence inspected: `_evidence/scene.txt`, `_evidence/camera.png`

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1, 2, 3, 4, 6 | not-assessed | Outside assigned focus; reserved for visual/spec graders |
| 5 Geometry and scale | FAIL | scene.txt lines 9-32: book/stack contact offsets; otherwise scale plausible and all meshes manifold |
| 7 Technical readiness | FAIL | scene.txt line 2: EEVEE 1920x1080 camera set, HDRI none; lines 12-32: 18 of 27 meshes have no material slot |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.90 | major | 7 | REQ-03 / REQ-11 | scene.txt lines 12-32; camera.png whole frame | 18 of 27 meshes have no material: 14 books (B01, B03-B08, B10-B14, B16, B17), all 3 stack books (S01-S03), and PlantPot. They render as default gray, so the paper-neutral spine palette is not actually authored and pot/stack shading is unintentional. | Assign paper-neutral materials (cream/kraft/off-white with faint muted accents) to every book, the stack, and the pot |
| F-02 | 0.85 | minor | 5 | REQ-08 / REQ-09 | scene.txt aces rows/columns for B01-B17, S01-S03 | Contact is inconsistent: B01, B02, B04, B08, B16 sink 5 mm into shelf boards; B07, B10, B13, B15 hover 5 mm; S01 hovers 5 mm and S03 hovers 10 mm above S02. | Snap each book/stack bottom exactly to its supporting surface (settle RowLow at 0.775, RowMid 1.275, RowTop 1.775, stack S02 at 0.82, S03 at 0.86) |

## Residual risks

- Evidence manifest was not readable under grader gate, so scene hash, spec/evidence hashes, and external-file audit could not be re-verified.
- No image/texture datablocks appear and HDRI is `none`; packed/relative external links cannot be fully enumerated from `scene.txt`.
- Final `renders/final/` PNG and README were outside assigned evidence and were not assessed.
