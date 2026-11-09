# rq-7fc6 — retrospective

- **Implementer:** Nightcrawler
- **Date:** 2026-11-09
- **PR:** #1064

## A narration unit test went red in CI on a change that does not touch it

**What happened.** `web-test` failed on the catch-up merge `d598f771`: `LanternLayout.panels.test.ts` > "still narrates a command run from the phone Map section", `isNarrating` false. The change only clears the way-arrow state in `LanternLayout.vue`. On that same head, 12 runs of the file and 8 runs of the full suite passed locally.
**Why.** Not established.
**Cost.** About twenty minutes of reproduction attempts, and a CI run that could not be used.
**Prevent by.** A bead to find what that test waits on beyond `advanceTimersByTimeAsync(0)` in `web/src/components/lantern/LanternLayout.panels.test.ts`, as `rq-xs4j` already proposed. It has now failed on two unrelated changes.
**Seen before.** `rq-xs4j`, the same test and the same assertion.

## `e2e/narrationCards.spec.ts:60` failed once in a local full run

**What happened.** `npx playwright test` failed one layout measure (the column's `y` above the foot of `.lq-stage-plate`), 164 of 165 passing. It passed 3 of 3 alone and in CI.
**Why.** Not established.
**Cost.** A few minutes and one repeat.
**Prevent by.** A bead for `web/e2e/narrationCards.spec.ts` to wait until the plate's box has settled before it measures, as `rq-nms5` and `rq-xs4j` proposed.
**Seen before.** `rq-nms5`, `rq-xs4j`.

## A CPU-load reproduction ran too long on a shared machine

**What happened.** To reproduce the red unit test I ran the suite beside three busy loops per core on the machine the fleet shares. The first run had not finished after almost ten minutes, so I stopped it with no result.
**Why.** The load was far more than a reproduction needed, and the suite slowed with it.
**Cost.** Ten minutes, and other sessions slowed meanwhile.
**Prevent by.** `.cerebro/cerebro/skills/produce-bead/SKILL.md`, *Red CI*: name what a local reproduction may do on the shared machine, for example `--maxWorkers=2` and no load generators.
**Seen before.** None found.
