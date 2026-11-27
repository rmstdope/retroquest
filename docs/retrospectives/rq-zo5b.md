# rq-zo5b — retrospective

- **Implementer:** Cyclops
- **Date:** 2026-11-27
- **PR:** #1425

## The sibling requirement's spec landed mid-build with the same listener

**What happened.** SND-2 was built as a spec of its own (`roomSound.spec.ts`) with an init script
that tracks Web Audio sources by file. Before the pull request, `origin/main` gained
`web/e2e/sound.spec.ts` (rq-6b6k, SND-3, #1418), built in the same hours with its own version of
that script.

**Why.** SND-2 and SND-3 were filed and built as separate beads with no edge between them, though
both need the same browser listener.

**Cost.** The test was rewritten into `sound.spec.ts`, its failure re-proven, and the gate re-run.

**Prevent by.** In `.cerebro/cerebro/agents/qa.md`, filing: requirement findings in one area that
need the same new test helper get a `relates-to` or blocking edge naming it.

**Seen before.** None found.

## The local gate failed three ways on a loaded machine

**What happened.** With load averages of 15 to 70 from other sessions, `npm run test` twice failed
the same two tests on the 5000 ms timeout (`src/lintRules.test.ts`, first case;
`src/lantern/roomMotionScene.test.ts` "draws every kind without a fault"); run alone they took
5.6 and 6.0 s. One full Playwright run failed `narration.spec.ts` "a hold let go before the ring is
full skips nothing" and `roomMotion.spec.ts` "the cottage picture drifts with movement over it";
both passed 3 of 3 alone, and the next full run passed.

**Why.** The two vitest cases pay a cold import inside the default timeout. The browser failures:
not established.

**Cost.** Two extra unit runs, one extra browser run (13 minutes), and a wait for the load to drop.

**Prevent by.** A Testing bead: give those two vitest cases their own timeout, or move the cold
import into `beforeAll`; and fix the narration hold test as `rq-t0ew` proposes.

**Seen before.** `rq-t0ew` (the narration hold test).
