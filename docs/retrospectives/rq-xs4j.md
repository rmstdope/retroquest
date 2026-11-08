# rq-xs4j — retrospective

- **Implementer:** Bishop
- **Date:** 2026-11-08
- **PR:** #1031

## `e2e/narrationCards.spec.ts` fails locally on a change that does not touch it

**What happened.** `npx playwright test` failed two layout tests in `e2e/narrationCards.spec.ts` (the cards' `y` was above the bottom of `.lq-stage-plate`). The diff only changed Act IV spell answers. Rerunning the spec three times each failed once in three on clean main (`22192311`) and once in three on the branch. `web-e2e` passed in CI.
**Why.** Not established. The machine was busy with other sessions at the time.
**Cost.** About ten minutes: the failed full run, then six reruns to tell a flake from a regression.
**Prevent by.** A bead for `web/e2e/narrationCards.spec.ts` to wait until the plate's box has settled before it measures.
**Seen before.** `rq-nms5` names the same spec; I did not compare the symptom.

## A UI narration unit test failed once in a full run

**What happened.** `npm run test` failed `LanternLayout.panels.test.ts` > "still narrates a command run from the phone Map section" (`isNarrating` was false) once. It passed 5 of 5 runs alone, and the next full run was green. Load average was above 17 at about that time.
**Why.** Not established.
**Cost.** A few minutes and one extra full run.
**Prevent by.** A bead to find what that test waits on beyond `advanceTimersByTimeAsync(0)` (`web/src/components/lantern/LanternLayout.panels.test.ts`).
**Seen before.** None found.
