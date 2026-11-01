# rq-tffa.2 — a layout test flaked in CI only

## What happened
`LanternLayout.arrival.test.ts` › "shows a turn that is not narrated and has no room as it is" failed in `web-test` on PR #718 (story text held the previous turn, not the pushed one), green locally three times alone and in the full run. A bare re-run of the same head passed.

## Why
Not established. The test pushes a turn straight into the store and checks the story after one `advanceTimersByTimeAsync(0)`; a slower runner may not have rendered it.

## Cost
One CI round (~3 min) and one of the two re-runs.

## Prevent by
Awaiting `nextTick`/a render flush after the push in that test.

## Seen before
Nothing like it yet.
