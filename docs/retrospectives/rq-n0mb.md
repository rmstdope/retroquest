# rq-n0mb — retrospective

- **Implementer:** Nightcrawler
- **Date:** 2026-11-15
- **PR:** #1167

## An e2e spec this PR does not touch failed twice in a row with the same numbers and used up both re-runs

**What happened.** After a follow-up commit that changed only a timeout argument and a comment in
`web/e2e/roomTitle.spec.ts`, `web-e2e (2/3)` failed in `lantern.spec.ts:1378` ("hugs a centred
closing line with the speaking rule at 1280px"). The block measured 137 px wide where the read
before the rule appeared gave 131 px, and the test was reported "1 flaky". The re-run failed the
same way with the same numbers. The PR's first head, and main at 535fc44e, had both been green.
Locally, `--repeat-each 20 --workers 4` on the production build passed 40 of 40. The second
re-run went green.

**Why.** Not established. Identical numbers in two CI attempts suggest a first-run condition in
that worker (a font or style landing between the spec's two `boundingBox()` reads), which is the
two-step read pattern rq-z206 and this bead fixed in other specs.

**Cost.** Two bare re-runs (the whole budget) and about 15 minutes. Without the second re-run going
green, the bead would have been handed back with its own fix done.

**Prevent by.** A Testing bead for `web/e2e/lantern.spec.ts:1378` that waits for fonts
(`document.fonts.ready`) or reads both boxes in one in-page step, as rq-z206 did elsewhere.

**Seen before.** rq-gw9m (CI red on flaky suites the change does not touch), rq-tets (picture
tests red in a shard, green locally), rq-z206 (two-step reads racing the page).

## Local e2e runs became unusable when the machine was loaded by other sessions

**What happened.** At load average 13 to 18, a 44-test run that had taken 2 minutes took 15.7
minutes with five unrelated timeouts, and the next run failed with "Timed out waiting 180000ms
from config.webServer".

**Why.** Other fleet sessions were running their own builds and browsers at the same time.

**Cost.** About 25 minutes of local runs that proved nothing; the follow-up commit was judged by
CI instead.

**Prevent by.** Before a local load test (`E2E_CPU_THROTTLE`, `--repeat-each`), read `uptime`, and
wait or fall back to CI when the 1-minute load is above the core count.

**Seen before.** rq-tffa.4 (a long local e2e run that overlapped itself).
