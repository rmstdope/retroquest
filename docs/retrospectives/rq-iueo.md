# rq-iueo — retrospective

- **Implementer:** Nightcrawler
- **Date:** 2026-11-24
- **PR:** #1383

## The bead was filed from a red run whose base lacked a fix already on main

**What happened.** The Dependabot sweep filed rq-iueo at 10:27Z for #1383's red web-e2e (1/3). That run (45365170984, 09:26Z) was on head 535dbf2e. Its failure was `arrival.spec.ts:351`, the speaker's-quote timing race. rq-h3xx had already fixed that race on main at 09:47Z (bf48db0a). Dependabot rebased #1383 onto main at 10:32Z, and the new run went green with no change. Nothing was left to fix.

**Why.** The sweep files a bead from a PR's latest failed run "without re-running CI", as the bead says. It does not check whether the PR's base is behind main. Nor does it check whether main has merged anything since that run, including a fix for the same test.

**Cost.** One bugfixer pass (about 15 minutes): reading the logs, confirming the fix was already in the head, the gate, a review, and this extra CI cycle.

**Prevent by.** In `scripts/dependabot-sweep`, before filing, compare the failed run's head with the PR's base. When main has moved past that head's base, ask Dependabot to rebase (`@dependabot rebase`), or re-run CI, and file a bead only if the fresh run is red too.

**Seen before.** rq-h3xx (the same sweep's bead, whose Dependabot PR was closed beneath it).
