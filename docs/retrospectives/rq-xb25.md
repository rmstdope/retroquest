# rq-xb25 — retrospective

- **Implementer:** Bishop, then Nightcrawler
- **Date:** 2026-11-09
- **PR:** #1066

## A flaky test no local run could reproduce held a finished fix for hours

**What happened.** The fix was reviewed and `web-e2e`, the check it was written for, passed on `0cfb43fe`. `web-test` failed on both of the PR's runs (42576397480, 42577641903), each time only at `LanternLayout.panels.test.ts:282`, "keeps the voice reading when another section is opened on a phone": `isNarrating` false right after `goNorth()`. The PR does not touch that file, and the same test had failed on unrelated work before this PR existed (42550803117, 42553331236). It did not fail locally in 26 runs of the file on Node 26 (14 under double CPU load), 6 on Node 22, or 3 full-suite runs. `produce-bead` *Red CI* allows a bare re-run only after a local reproduction, so none could be spent and the bead went to the navigator, who allowed a re-run. The re-run proved unnecessary: the PR was 6 commits behind main, and `web-test` passed on the catch-up merge `c51e23cb`.

**Why.** Not established, for the test's failure or for why it passed on `c51e23cb`. rq-gq40 carries the test.

**Cost.** One hand-back and about four and a half hours with a finished P1 fix unmerged, while main kept failing `redLine.spec` on and off and rq-dpom stayed blocked.

**Prevent by.** `produce-bead` *Red CI*: say what to do when a failure is in a file the diff does not touch and the same test has already failed on unrelated work, since a test that only fails on CI can never meet "reproduce locally once". Taking the *Merging* catch-up first, when the PR is behind, would have given a fresh run with no budget spent.

**Seen before.** rq-7fc6, rq-xs4j (the same file, its neighbouring test).
