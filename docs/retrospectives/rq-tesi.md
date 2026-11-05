# rq-tesi: narration e2e tests green locally, red in CI

## What happened
Changing the lantern's lighting line retired its clip. `narration.spec.ts` (journal tests, three places) waits for `.lq-speaking` after `use lantern`; they passed in my local full Playwright run and in a local `-g journal` rerun, but failed in CI's `web-e2e` because the new line has no recording.

## Why
Not established why the local run still saw speech (likely clips or audio state present in the local environment that CI's checkout lacks).

## Cost
One CI round (~12 minutes) and one fix attempt.

## Prevent by
A bead that changes a spoken line should grep `web/e2e/` for the command that speaks it (`use lantern`) before the PR and make those steps not require a recording.

## Seen before
Nothing like it yet.
