# rq-4kvu — retrospective

- **Implementer:** Bishop
- **Date:** 2026-11-01
- **PR:** #720

## web-test goes red in LanternLayout.arrival.test.ts, a file the PR does not touch

**What happened.** PR #720 changes one CSS rule in `StageSpeech.vue` and adds one e2e test. CI's `web-test` failed twice in `web/src/components/lantern/LanternLayout.arrival.test.ts`, each time on a different test: first "keeps the paper away and inert only while the arrival is told" (`inert` undefined, line 372), then "clears when narration is switched off while it is told". The third run passed. Locally, `npx vitest run src/components/lantern/LanternLayout.arrival.test.ts` failed 1 time in 6 (2 tests) on unchanged code. The same file also failed CI run 41339911033 on `rq-g0gb-mockup` ("tells what happens on arrival first…").

**Why.** Not established. The failures move between tests in that one file, which looks like timing (the arrival's timers or narration state carried between runs) rather than any one assertion.

**Cost.** Both of this bead's bare CI re-runs, about 8 minutes of waiting, and one more red run on another branch.

**Prevent by.** A Testing bead to make `LanternLayout.arrival.test.ts` deterministic (fake timers or awaited flushes around the arrival), proved by running it 20 times in a row: `for i in $(seq 20); do npx vitest run src/components/lantern/LanternLayout.arrival.test.ts || break; done`.

**Seen before.** None found.
