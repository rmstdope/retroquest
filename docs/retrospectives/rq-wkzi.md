# rq-wkzi — retrospective

- **Implementer:** Bishop
- **Date:** 2026-11-09
- **PR:** #1071

## `e2e/narrationCards.spec.ts:27` fails locally on a change that does not touch it

**What happened.** The full local `npx playwright test` failed one test, "at 1440px the cards sit up the left, under the plate": `wrap.y` was 207 against a plate bottom of 230.6. The change only alters which belt picture takes focus. Running `e2e/narrationCards.spec.ts e2e/belt.spec.ts --repeat-each=3` failed that test 3 of 3 with the fix and 3 of 3 with the fix reverted. Run alone with `--repeat-each=5` it passed 5 of 5 both ways. `web-e2e` passed in CI.

**Why.** Not established. It shows only when other specs run beside it.

**Cost.** About 15 minutes of reruns to show the failure was not from this change, and a CI cycle for this file.

**Prevent by.** A bead for `web/e2e/narrationCards.spec.ts` to wait until the plate's box has settled before it measures, as `rq-nms5`, `rq-xs4j` and `rq-7fc6` proposed; this run shows line 27 needs it as well as line 60.

**Seen before.** `rq-nms5`, `rq-xs4j`, `rq-7fc6`.
