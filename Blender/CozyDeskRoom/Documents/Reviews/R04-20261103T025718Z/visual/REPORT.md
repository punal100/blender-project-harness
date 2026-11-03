# Grader Report — visual

- Round: R04-20261103T025718Z
- Grader: visual
- Focus: composition, camera, lighting, colour, materials, mood, detail and storytelling
- Model/variant: primary punal-9router-compatable / Codex-Everywhere-Claude/claude-sonnet-5-5 / xhigh (backup punal-9router-compatable / ocg/deepseek-v4.1-flash / Max; runtime ocg/deepseek-v4.1-flash)
- Target: 19f258b855a8b90ed8927dce383abcb36fb68b20 / d4e2b0abafe1885d4af7e9e0f320129b9ee139f5417012d0cf4baae733a4b40c / dirty
- Evidence key: 11d9f5d5647d343fe6fb11890d2a2b96b4e6ee8deeb154d88877aeb945be7b3e
- Verdict: PASS
- Evidence inspected: REQUIREMENTS.md, REVIEW.md, Goals/01-project-brief.md, prior R03 visual REPORT.md, renders/final/R04-20261103T025718Z.png and _evidence/camera.png (identical SHA-256, inspected at 1920 px), _evidence/scene.txt

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1 Spec fidelity | PASS | REQ-01/REQ-03/REQ-06 for this milestone: pens present in cup (scene.txt L45, L50-L52), warm emissive screen (camera.png centre), desk items rest on or in the desktop apart from the mouse gap (F-04) |
| 2 Composition and camera | not-assessed | Deferred by ticket to the final composition milestone; framing/clipping not graded |
| 3 Lighting and exposure | not-assessed | Deferred by ticket to the final lighting milestone; the flat orange key and hard shadows were not graded |
| 4 Materials and colour | PASS | Screen emission now warm amber-peach without clipping (camera.png monitor face); wood, fabric, plaster and metal read as warm primitives. Residual palette flatness noted below |
| 5 Geometry and scale | PASS | Desk panels reach the floor; keyboard, cup, lamp and monitor stand sit flush at z=0.76; chair meets the rug. Mouse contact fails (F-04, minor) |
| 6 Detail and storytelling | PASS | Pen cup now holds three pens on the right-rear desktop; mouse reads as a raised object. Pad separability fails (F-04, minor) |
| 7 Technical readiness | not-assessed | Outside assigned visual focus |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-04 | 0.70 | minor | 5 | REQ-06 / R03 F-02 fix | scene.txt L11 DeskTop top z=0.76, L37 Mouse centre z=0.79 with 0.04 height (base 0.77), L38 Mousepad z=0.76 with z size 0.0; camera.png 1920, desktop right of keyboard around x=990, y=665 | The mouse was raised but the pad was not: Mousepad still has no measurable thickness and is not separable from the wood, and the Mouse now hovers about 1 cm above the desktop instead of resting on a pad. The gap reads only as a shadow at hero distance, so it is minor. | Give Mousepad 2-3 mm thickness in a contrasting desaturated fabric tone (top around z=0.763), lower Mouse so its base sits on the pad, and re-render. |

## Re-review

- R03 F-01 (screen flat cream) -> FIXED: the monitor face in camera.png is now a warm amber-peach field with no clipped highlights; emission is restrained. The screen remains featureless (no desktop UI), which is deferred detail polish.
- R03 F-02 (mousepad invisible/coplanar) -> OPEN: Mousepad still records z=0.76 with z size 0.0 (flush with the desktop top at 0.76) and no distinct pad is visible around the mouse in camera.png; the fix added mouse height without pad thickness, producing F-04. Severity remains minor.
- R03 F-03 (empty pen cup) -> FIXED: Pen1-Pen3 exist inside PenCup (scene.txt L45, L50-L52) and thin pens are visible above the cup rim in camera.png at the right-rear desktop.

## Residual risks

- Composition, camera framing, final lighting, exposure, plant, print and room footprint are deferred by the ticket and were not graded; the chair base/rug run out of the bottom frame edge.
- The monitor is a flat emissive field with no desktop UI, so the "working computer" read still depends on the final detail pass.
- All three pens share PenWood_Material and sit within 2 cm, so at hero distance they may read as one or two sticks rather than three pens.
- WORKFLOW.md was not inspected; it does not define visual acceptance criteria.
