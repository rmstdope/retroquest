# rq-7psx: e2e flake in an unrelated sideways-phone spec

## web-e2e failed `sidewaysCards.spec.ts` "a larger phone keeps today's type" on a CSS change it does not reach

**What happened**: At head `83479997` (one CSS rule for the upright phone's `.lq-phone-plate` room name, plus an e2e test), CI's `web-e2e (3/3)` failed `e2e/sidewaysCards.spec.ts:109` on the run and its retry: `fontSize(page, '.lq-arrival-line')` returned `""` where `"24px"` was expected, at an 844×390 viewport, which uses the sideways plate, not the one changed. Locally under `smoke-port` the whole spec passed 24/24 (`--repeat-each 3`). After an `update-branch` catch-up the same suite went green with no change to the test or the code it covers.

**Why**: Not established. `getComputedStyle(el).fontSize` is `""` for an element no longer in the document, so the arrival line was most likely replaced or removed between `.first()` resolving and `.evaluate` running, i.e. the test reads the arrival before it has settled. The CI trace was not inspected.

**Cost**: One red CI round (~5 minutes of e2e) and a catch-up before the merge.

**Prevent by**: In `web/e2e/sidewaysCards.spec.ts`, have the `fontSize` helper wait for `.lq-arrival-line` to be visible (or use `expect(locator).toHaveCSS('font-size', …)`, which retries) instead of a one-shot `evaluate`.

**Seen before**: rq-dn9z and rq-hqv0, both CI-only flakes waiting on `.lq-arrival-line` in `e2e/arrival.spec.ts`; same element, a different spec.
