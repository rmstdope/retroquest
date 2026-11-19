# rq-lhg3 — retrospective

## An unreproducible flaky e2e test again needed the navigator for a re-run

**What happened.** PR #1270 (a `ChapterPage` change) was reviewed and green apart from `web-e2e (1/3)` on run 44474565359. There, `e2e/arrival.spec.ts:346` ("keeps a speaker's quote on the page of the line that introduces it, and Space and Escape work") failed once at line 372 (`.lq-arrival-card` count 0) and passed on its Playwright retry. CI fails a job on a flaky test. The test only clicks Begin on the intro, then exercises the story-pane arrival pages, which the diff does not touch. It passed 8 times in isolation and 24 more times in its suite with 4 workers locally, and it had not failed in the last 25 CI runs. `produce-bead` *Red CI* allows a bare re-run only after a local reproduction, so I asked the navigator, who allowed one; the re-run was green.

**Why.** Not established: a timing race in the arrival pagination under CI load, most likely.

**Cost.** About 15 minutes of local reproduction attempts and one round trip to the navigator for a re-run that was always going to be the answer.

**Prevent by.** `produce-bead` *Red CI*: allow one bare re-run without a local reproduction when Playwright itself marks the test flaky (it failed, then passed on retry, in the same job) and the test lies outside the diff. Separately, a Testing bead could look at `arrival.spec.ts:346` waiting on `.lq-arrival-card` straight after a Space press.

**Seen before.** `rq-xb25`: the same rule gap, with a vitest flake.
