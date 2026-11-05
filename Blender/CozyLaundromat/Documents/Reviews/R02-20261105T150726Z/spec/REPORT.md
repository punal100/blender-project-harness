# Grader Report — spec

- Round: R02-20261105T150726Z
- Grader: spec
- Focus: requirement and acceptance fidelity, scope, deliverable completeness
- Model/variant: backup — punal-9router-compatable / ocg/deepseek-v4.1-flash / Max
- Target: base 3f5e3c05b34fc7c1a08a86554029c207ea69c102, saved scene SHA-256 bbba0dc62c7844014b8a689a70c92b08ea5477fe5d9832577c717547691edfde, project dirty
- Evidence key: 9513efd49190ae6733faf993ef2c6112d11bb23d630883862a04266a1f6b9a74
- Verdict: CHANGES_REQUIRED
- Evidence inspected: renders/final/R02-20261105T150726Z.png and _evidence/scenes/Scene/camera.png (identical sha256 b0159c4f82db7adba2c9146ee21444d3bd7081d43953b4472666a9b6936bf35f); _evidence/scenes/Scene/scene-facts.json and scene.txt (identical sha256 96444fa34650b4b3bae244c296a6380c92f276b2f36628afa469ab82fbb770ba). The assigned prior report path was denied by the harness gate, so prior statuses are based on the orchestrator's summary only.

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1. Spec fidelity | FAIL | camera.png left edge: window left jamb is outside the frame, so REQ-03 "without clipping" is not met. scene-facts.json confirms Camera_Hero z-rotation -0.124 and Window_Frame/x=-1.55, 1.62 m wide. |
| 2. Composition and camera | not-assessed | Out of assigned focus; framing defect logged under dimension 1. |
| 3. Lighting and exposure | not-assessed | Out of assigned focus. |
| 4. Materials and colour | not-assessed | Out of assigned focus. |
| 5. Geometry and scale | not-assessed | Out of assigned focus. |
| 6. Detail and storytelling | not-assessed | Out of assigned focus. |
| 7. Technical readiness | not-assessed | Out of assigned focus. |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.95 | major | 1 | REQ-03 | camera.png, left edge of frame (window x≈0–610 px; left pane cut at x=0); scene-facts.json Camera_Hero rotation Z=-0.124, Window_Frame location x=-1.55, dimensions 1.62 × 1.56 | The window is still clipped: the left jamb/trim is outside the image and the left glass pane runs into the frame edge. The revision's "full window now framed" claim is not visible. | Yaw Camera_Hero left (increase rotation Z from -0.124 toward about +0.05/+0.10, or shift camera x negative) until the full Window_Frame, including the left jamb, sits inside the image with clear margin; re-seal and inspect. |
| F-02 | 0.70 | minor | 1 | REQ-06, REQ-08 | scene-facts.json: Ceiling_Fixture_1/2 at z=2.34, height 0.09; Ceiling_Cream spans z=2.80–2.90. camera.png: both white discs hang below the ceiling line with no stem or cord. | Matching fixtures now exist on both ceiling lights (fix progress), but each is 0.415 m below the ceiling underside with no visible mount, reading as floating discs rather than fitted practicals. | Move both fixtures up so their top is flush with the ceiling underside (z≈2.755), or add a short stem/cord connecting each fixture to the ceiling. |

## Re-review

- F-01 → OPEN. Window left jamb is still outside the image (camera.png left edge); the camera yaw remains -0.124 in scene-facts.json.
- F-02 → OPEN. Both ceiling lights now have matching fixtures, but both float 0.415 m below the ceiling (fixture z=2.34 + 0.045 half-height = 2.385 vs ceiling underside 2.80) with no mount in scene-facts.json or camera.png.
- F-04 → FIXED. The window glass in camera.png shows a soft matte gradient with no hard specular streak, consistent with the raised roughness described in the revision.

## Residual risks

- This partial milestone covers the room shell, window, lights, grout and runner only. Washers/dryers, folding counter, seating, props, noticeboard, plant, counter light and evening exterior glimpse (REQ-05) are unbuilt/deferred and were not graded as findings.
- REQ-06 was assessed only on the single hero frame (warm amber palette, soft gradients, no blown walls); fixture attachment is logged as F-02.
- REQ-07 appliance-front, wood-counter and fabric-seating materials are not yet present; only the painted-wall, window-glass and floor material response could be judged.
- The prior report and peer reports were not read; harness-denied access is recorded here and no evidence beyond the assigned files was used.
