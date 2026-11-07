# Retrospective: rq-dn9z

## web-e2e failed in an unrelated Act I spec that passed every time locally

**What happened**: At head `804d1752` (an engine change to how Act II quests settle), CI's web-e2e failed `e2e/arrival.spec.ts:394` "a long arrival on a narrow window (rq-fc9f) › shows every line of the Dream before Enter moves on, after Escape", on both the run and its retry: `.lq-arrival-line` was never visible within 15 s at a 564×717 viewport. The same branch's previous head had passed the same suite. Locally, under `smoke-port` with `CI=1`, that test passed 3/3 alone and the whole spec passed 15/15. After an `update-branch` catch-up the same suite went green with no change to the test or the code it covers.

**Why**: Not established. The test starts at the Act I dream, where no quest settles, so the diff is unlikely to be the cause; the CI artefact (`error-context.md`) was not inspected.

**Cost**: One red CI round (~9 minutes of e2e) and a catch-up before the merge.

**Prevent by**: When this spec fails in CI again, download the run's `test-results/…narrow-window…/error-context.md` and trace before re-running, so the flake's cause is pinned in `web/e2e/arrival.spec.ts` rather than retried past.

**Seen before**: Not in `docs/retrospectives/` (rq-msx8 names this spec, for a different cause: a quoted old line).
