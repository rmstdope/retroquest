# rq-arq9 — layout e2e green locally, red in CI at 37px

## What happened
`e2e/settingsRing.spec.ts` (arrow walk down Settings at 900×480) passed 60/60 locally but failed twice in CI on `web-e2e (3/3)` with a steady 37px clip, then passed on the next head with no change to the CSS or the walk. The Tab walk also flaked ~1 in 8 locally before an explicit Tab handler was added (a persistent 7.75px clip, not timing).

## Why
Not established. Fonts and row heights differ between the runner and a laptop; the 37px row was never identified because the first spec only reported a number. The spec now reports the element and both boxes on failure.

## Cost
Two CI cycles (~8 min each) and one review round.

## Prevent by
Have layout specs report the row and boxes in their failure message from the start; repeat a new layout spec with `--repeat-each 10` locally before the first push.

## Seen before
Nothing like it yet.
