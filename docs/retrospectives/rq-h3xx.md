# rq-h3xx — retrospective

- **Implementer:** Bishop
- **Date:** 2026-11-24
- **PR:** #1376

## A second flaky test, failing CI on main for five days, was hiding behind the one the bead named

**What happened.** The bead named one red check on Dependabot's #1376: web-e2e 1/3, `arrival.spec.ts:351`. Fixing that turned web-e2e 2/3 red on the next head. The cause was `menuKeys.spec.ts:80` ("Help scrolls with the keys"), timing out at the End poll on both attempts. A search of the last 25 failed CI runs found that test in 13 of them, three on main, starting 2026-11-19. No bead covered it. It passed locally at 1x, 8x and 20x CPU throttle and with web fonts held back for 2.5 s.

**Why.** rq-v29l.15 (#1298, 2026-11-19) made Help longer. At 1280x800 its text already overflows its box (1483 px of text in a 561 px box). The test's guard, "the text is taller than its box", therefore passed before the 300 px window had been laid out. An End that came first scrolled to the bottom of the tall box. The box then shrank to 141 px and the scroll stayed 246 px short of the bottom. A probe test measured this. rq-n6yh had already named the race but fixed it with a guard that #1298 then made useless.

**Cost.** One extra red CI cycle (about 8 minutes), plus about 30 minutes of diagnosis, most of it spent trying to reproduce a failure that a slow CI runner shows and a laptop does not.

**Prevent by.** When a test is flaky on main, and failOnFlakyTests turns it red, the PR that first meets it should file a bugfix bead. Today each PR's implementer re-runs or works around it, then records it in a retrospective (rq-306j, rq-bgzd, rq-n6yh), and the test stays broken for everyone else. A guard that waits for a layout should check something only the new layout can satisfy, such as `clientHeight` under the new window height, not something the old layout may satisfy too.

**Seen before.** rq-306j, rq-bgzd, rq-n6yh (all the same `menuKeys` Help/End flake).
