# rq-yjh6 — an e2e test asserted the bug, and the fast gate does not run e2e

**What happened**: The bug fix (a stage button opens its drawer on the first press during a read-aloud) was green on the fast gate (eslint, prettier, vue-tsc, vitest). CI's web-e2e failed: `web/e2e/narration.spec.ts` had a case, "a press on a journal button catches up", that asserted exactly the behaviour the bead calls a bug (the Quests press must *not* open the drawer).

**Why**: `gate_fast` in `.cerebro/project.conf` has no Playwright leg, and the bugfixer contract only names the fast gate before the PR. A bug bead that reverses behaviour is the case most likely to have an existing test pinning the old behaviour, and I grepped only `web/src` for the attribute, not `web/e2e` for the behaviour.

**Cost**: One red CI round (~4 minutes) and a fix commit; the follow-up review then found the rewritten case's catch-up check passed on timeout alone, one more commit.

**Prevent by**: In `fix-bug` step 5, for a bug whose fix reverses a behaviour, grep `web/e2e/` for the behaviour's selectors and run `npx playwright test` (under `smoke-port`) before the PR, not only `gate_fast`.

**Seen before**: rq-lt3i (e2e specs outside the one run locally were red in CI; same class: Playwright not run in full before the PR).
