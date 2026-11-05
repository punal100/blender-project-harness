# Grader Report — spec

- Round: R05-20261105T162039Z
- Grader: spec
- Focus: requirement and acceptance fidelity, scope, deliverable completeness
- Model/variant: punal-9router-compatable / ocg/deepseek-v4.1-flash / Max
- Target: base a637a12513bd5aaa588fc778b6de0266d630ea6c, saved scene SHA-256 a9543155b0c7ffee88b9bfebb374395b15944c54b61f49c3159068443cbe7516, project dirty
- Evidence key: a3ee8253c008b3263bcc8fb5b9178544adf615bf049e02459f5ec4f58744e361
- Verdict: CHANGES_REQUIRED
- Evidence inspected: renders/final/R05-20261105T162039Z.png; Documents/Reviews/R05-20261105T162039Z/_evidence/scenes/Scene/camera.png; scene-facts.json; scene.txt

## Dimension results

| Dimension | Result | Evidence |
|---|---|---|
| 1. Spec fidelity | FAIL | scene-facts.json: six Washer bodies, six Washer_Rim objects, six Washer_Glass objects, no drum/tub object. camera.png: six black door discs with no visible drum. Sign_Laundry readable; bodies 0.85 m tall. |
| 2. Composition and camera | not-assessed | Focus is spec fidelity; the sixth-machine clipping is noted under F-02. |
| 3. Lighting and exposure | not-assessed | Not advanced by this milestone; no blown whites observed in the machine-area render. |
| 4. Materials and colour | not-assessed | Machine materials inspected only for REQ-05 door readability; no independent material finding. |
| 5. Geometry and scale | not-assessed | Machine dimensions and ground contact confirmed from scene-facts.json; missing drum geometry is F-01. |
| 6. Detail and storytelling | not-assessed | Counter, wire baskets, detergent, noticeboard, seating, and plant are explicitly deferred. |
| 7. Technical readiness | not-assessed | Not in the assigned focus. |

## Findings

| ID | Confidence | Severity | Dimension | Spec | Evidence | Problem | Fix |
|---|---|---|---|---|---|---|---|
| F-01 | 0.92 | major | 1 | REQ-05 | scene-facts.json (Washer_01..06, Washer_Rim_01..06, Washer_Glass_01..06; no drum object); camera.png bottom-right row | Six machines exist, but each door is a flat opaque disc with no drum/tub behind it: the glass sits about 30 mm in front of a solid body face, so no drum is visible. REQ-05's visible doors and drums is unmet. | Add a recessed drum per machine: a 0.33-0.36 m diameter, 0.15-0.25 m deep inner cylinder with a dark shadow gap and visible lip behind the door; set the glass/rim into the recess; keep glass non-transmissive. Recheck in the next hero render. |
| F-02 | 0.88 | minor | 1 | REQ-05 (six visible doors) | camera.png right edge | The sixth machine and its door are clipped by the right frame edge, so the hero evidence shows five complete doors plus a partial sixth; the six-machine row is not cleanly readable at acceptance. | Yaw the hero camera slightly right or pull back/widen the lens so all six complete machine fronts and their floor contact are in frame without losing the window and sign. |

## Re-review

Not a re-review of prior findings; this is the first review of the Machine row milestone. R04 dispositions remain unchanged and are not re-opened: F-04 (glass) declined within REQ-07, F-06 (minor) deferred. The new machine glass is also non-transmissive, consistent with the declined F-04 disposition.

## Residual risks

- Composition, lighting, and camera will be refit when the deferred counter and seating are added; no final hero framing is asserted here.
- Deferred props (counter, wire baskets, detergent, noticeboard, seating, plant) were not assessed and are not findings.
- The window exterior glimpse, floor, and shell were inherited from R04 and not re-assessed in this partial milestone.
