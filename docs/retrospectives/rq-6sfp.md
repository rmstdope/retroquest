# rq-6sfp — retrospective

- **Implementer:** Nightcrawler
- **Date:** 2026-11-22
- **PR:** #1357

## The reported click on a card was Chrome automation latency

**What happened.** The bead said a click on the *Hint of magic* card's "Click to continue" dismissed it and opened the Shelves wheel. Three headless Playwright probes clicked the card while it was up, with and without narration, after a mouse-driven dream and at several moments, and never opened a wheel. Playing the repro in Chrome through the browser tools opened the wheel. A timestamped log of `.lq-arrival-stage.lq-on` and the clicks showed why: the card had gone by itself at t=61749 ms and the click landed at t=63063 ms. The 1.3 s between a screenshot (card visible) and the click that follows it in the next tool call was past the 600 ms grace window. The navigator chose to lengthen the window to 1500 ms.

**Why.** With browser tools, a screenshot and the next click are separate round trips, often a second or more apart. A card read for its time can go between them, so a click "on the card" is really a click on the picture.

**Cost.** About forty minutes of headless probes before the timing log, plus a question to the navigator.

**Prevent by.** In `.claude/skills/verify-retroquest` (or wherever exploratory play files bugs): before filing a "click on X did Y" bug found through browser tools, log timestamps of the state change and the click (a `MutationObserver` plus capture-phase `pointerdown`/`click` listeners, via `javascript_tool`) and include them in the bead. Anything timed under about two seconds cannot be judged from screenshots.

**Seen before.** None found.

## arrival.spec.ts "keeps a speaker’s quote…" is flaky on main, and throttling reproduces it

**What happened.** `web-e2e (1/3)` failed on `e2e/arrival.spec.ts:351` (`.lq-arrival-card` count 0 after a Space), on its first try and its retry. The spec never presses the picture, so this change cannot reach it. It passed 5 of 5 locally. With `E2E_CPU_THROTTLE=6` it failed 1 of 6 on this branch and 5 of 10 with main's value restored. One bare re-run of the job was green.

**Why.** Not established. On a slow CPU the arrival seems to clear between Space presses, perhaps because its reading time runs out while the pages are turned.

**Cost.** One CI round (about 7 minutes) and a re-run.

**Prevent by.** A Testing bead on `e2e/arrival.spec.ts:351`, using the reproduction `E2E_CPU_THROTTLE=6 npx playwright test e2e/arrival.spec.ts:351 --repeat-each 10` (about half fail on main).

**Seen before.** `docs/retrospectives/rq-lhg3.md`: the same spec, same assertion, failed once in CI and could not be reproduced locally then.
