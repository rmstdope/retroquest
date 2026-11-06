# rq-nms5 — retrospective

## The 1060px narration-cards layout test fails locally and passes in CI

**What happened:** The local Playwright run failed `e2e/narrationCards.spec.ts:60` ("at 1060px the cards and the lines share one column in the middle, under the plate"): `wrap.y` was 207 against a plate bottom of 230.6. The change only rewrote Act 1 item texts, which the test never reaches (voice, cottage look, grandmother). With `--repeat-each 3` it failed once and passed twice; CI's web-e2e passed on the same change.

**Why:** Not established. The test reads the bounding boxes right after the first speech line is visible, so it may be measuring before the one-column layout settles.

**Cost:** About ten minutes: a second e2e run to tell a flake from a regression, and a caveat in the PR body.

**Prevent by:** `web/e2e/narrationCards.spec.ts:60` should wait for the layout to settle (for example, poll the column's top with `expect.poll` until it is at or below the plate) instead of measuring once.

**Seen before:** No earlier retrospective mentions it.
