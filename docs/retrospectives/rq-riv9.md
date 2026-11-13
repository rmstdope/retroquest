# rq-riv9 — an e2e test that relied on where text wraps passed on macOS and found nothing in CI

**What happened**: The reproduction test scrolled the words up 3px at a time, looking for spots where the Table dot lay under a card's faded edge. On macOS two scroll positions (168 and 165) matched and the test was RED then GREEN as intended. In CI (ubuntu, Linux fonts) no position matched, so `covered` was 0. The test failed on its guard `expect(covered).toBeGreaterThan(0)` on both the first try and the retry. The review sub-agent had already predicted this: in its scratch run the fonts did not load, the text wrapped differently, and the result was the same 0.

**Why**: Where a dot ends up next to the words depends on how tall each card is, and that depends on how the story's text wraps. Line wrapping depends on the fonts the machine renders with, and those differ between macOS and CI's Linux Chromium. Neither the e2e suite nor its docs say this.

**Cost**: One red CI run (about 12 minutes of web-e2e with its retry), one of the three fix attempts, and a rewrite of the test.

**Prevent by**: A note at the top of `web/e2e/` (or in the e2e section of `CLAUDE.md` *Testing*): an e2e test must not depend on text wrapping to set up its geometry, such as card heights or the place of a dot next to the words. Build the geometry the test needs directly (this test now lays its own clear element over the dot), or assert only what holds at every line wrap.

**Seen before**: No. `rq-ezpg.6` was also red in CI and green locally, but the cause there was timing, not text layout.
