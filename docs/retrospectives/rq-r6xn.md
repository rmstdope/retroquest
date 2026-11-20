# rq-r6xn — retrospective

- **Implementer:** Gambit
- **Date:** 2026-11-20
- **PR:** #1331

## A reproduction e2e passed against the unfixed code under the suite's reduced motion

**What happened.** The bug, a click on a card going by itself that opened the wheel of the mark under it, only shows with motion on. Under reduced motion a mark jumps back to its own place the moment the card goes, so the click lands on the thing's press area, which the linger already ignored. The first reproduction specs passed against main. The playwright config sets `reducedMotion: 'reduce'`, and the specs used the real Village Square path, as did an injected card over a still mark. The test was red only once motion was back on (`page.emulateMedia({ reducedMotion: 'no-preference' })`) and it waited for the mark to step aside for the card. Fixed sleeps also missed that step: a mark first comes in at its own place and moves about half a second later.

**Why.** `web/playwright.config.ts` runs every spec with reduced motion, so transitions and glides take no time. A bug that lives inside a transition window cannot show unless the spec turns motion back on.

**Cost.** About an hour of exploratory Playwright runs before the right reproduction, and two more rounds to make it red against main.

**Prevent by.** In `skills/fix-bug` (or the e2e notes in `web/e2e/fixtures.ts`): a reproduction that involves something appearing, fading or moving must be run red against main with `page.emulateMedia({ reducedMotion: 'no-preference' })`, since the suite's default hides such bugs.

**Seen before.** None found.
