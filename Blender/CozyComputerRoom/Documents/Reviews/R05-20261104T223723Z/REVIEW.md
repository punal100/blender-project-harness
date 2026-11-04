# Review aggregate
Verdict: CHANGES_REQUIRED
Scene SHA-256: 67cb24fa192af05984b3903ea6a115c197aefeb3f8839a94917a7f87bdedc79f
Scenes: Scene
Evidence key: a917b013f986323fde75a285b1fbc84d827e7084ac0447109053e11ff3cbbcf7

## Inspection notes
Inspected sealed R05: the room is complete and readable, but the floor-lamp and chair shadows are crisp rather than soft, which conflicts with REQ-06's soft-shadow requirement. The window also retains a soft white reflection band, and the pendant cord has no material.

## Reason
Technical and spec returned PASS; visual returned CHANGES_REQUIRED for a REQ-06 major (hard shadows). The spec primary grader hit its step budget and the configured backup produced PASS, so no further grader retry is possible. The visual major requires a scoped revision before this final round can pass.

## Finding dispositions
visual F-01 hard shadows (major, REQ-06): open; fix in revision by replacing the three point practicals with AREA lights (the supported way to soften EEVEE shadows) and re-render. visual F-05 near-black chair and tower: open; lighten their base colors in the revision. visual F-02 window hot-spot band: open; re-evaluate after the area-light revision. visual F-03 chair base and right-edge clipping: declined as intentional hero framing; no requirement is violated. visual F-04 flat screen, blank art, handleless mug: declined as acceptable stylization; no requirement calls for those details. technical F-01 PendantCord has no material: open; assign a dark material in the revision. Prior R04 technical F-01 fixtures and F-02 curtain contacts: fixed and verified. Prior R01 door interpenetration: fixed and verified. Prior R01 flat curtains: declined as stylized; curtain rod present. Spec: PASS.

## Grader verdicts
- visual: CHANGES_REQUIRED
- technical: PASS
- spec: PASS
