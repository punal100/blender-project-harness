# Grader Report — visual

- Round: R07-20261105T061908Z
- Grader: visual
- Focus: composition, camera, lighting, colour, materials, mood, detail and storytelling
- Model/variant: punal-9router-compatable / layso/claude-sonnet-5-5 / xhigh
- Target: base 674ee29b16eb40e97c276b04d73d8c452c716e09, saved scene SHA-256 0ceca1eb494104b88d0b380a2da8653a832a2120428fcd7a4d75527a233ff37c, project dirty
- Evidence key: 074faccf1892eb432575007fc5c0112d99912e3a9fee8fb2a33fd85de681da46
- Verdict: PASS
- Evidence inspected: renders/final/R07-20261105T061908Z.png, _evidence/scenes/Scene/camera.png (sha256 63ad83de…), _evidence/scenes/Scene/scene-facts.json

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1. Spec fidelity | PASS | All REQ-01–REQ-10 confirmed against render and scene-facts.json |
| 2. Composition and camera | PASS | Wide three-quarter view; desk corner, window, and room atmosphere all in frame; eye-level perspective reads correctly for ~1.5 m |
| 3. Lighting and exposure | PASS | Warm fill from ceiling lamp + WarmFill light; cool vivid-blue window via WindowGlow emissive + DuskLight; no blown highlights or crushed shadows; monitor screen clearly readable |
| 4. Materials and colour | PASS | Procedural palette: warm wood desk, dark plastic computer, teal chair fabric, lavender bed, orange curtains, warm brass lamp; warm/cool contrast achieved; no UV stretch or colour-space anomaly visible |
| 5. Geometry and scale | PASS | Room shell 3.6×3.2×2.6 m confirmed in scene-facts; desk, chair, bed, bookshelf proportions believable; all furniture ground-contacted; no visible interpenetration |
| 6. Detail and storytelling | PASS | All required props present: desk lamp, mug, papers, blanket/throw, pillow, wall art, curtains, bookshelf rows (two coloured rows), plant atop shelf; cozy lived-in mood intact |
| 7. Technical readiness | not-assessed | Assigned to technical grader |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|

No findings above suppression threshold. Accepted R06 minors (flat art-frame canvas, simple book-row silhouettes, no rug pile texture) carry forward unchanged and remain within harness material constraints.

## Re-review

R06 visual: PASS — confirmed OPEN (minor accepted carry-forwards, not regressions). No R06 findings introduced defects in R07 evidence; same frozen render.

## Residual risks

- Door (DoorPanel) is present in scene-facts at the left wall but falls outside the hero camera frame; REQ-02 confirms door exists in the room, REQ-07 does not require it to be camera-visible. No finding raised.
- Warm desk lamp contribution is subtle in the ambient balance; the cool window is the stronger visual, which matches the spec's stated contrast intent.
- Rug texture grain not assessed (harness material limit; accepted in R06).
