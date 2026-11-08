# rq-62gc — retrospective

- **Implementer:** Bishop
- **Date:** 2026-11-08
- **PR:** #1057

## `redLine.spec.ts` went red in CI on a bug fix that does not touch it, and passes locally

**What happened.** CI run 42530565387 on head 3786bfdb failed `web-e2e` with one test, on the attempt and its retry: `e2e/redLine.spec.ts:190`, at `redLine.spec.ts:187` (`expect.poll(() => newestCommand(page)).toBe(command)`, 15000 ms, called from line 212, the act's `completing` commands). The whole suite passed locally on this branch, and `npx playwright test e2e/redLine.spec.ts` passed on its own in 15.7 s. The same test failed on `main` in runs 42526290627, 42528121562 and 42530436595, so `main` itself was red.
**Why.** Not established. The failing `main` runs do not contain this bead's change.
**Cost.** One CI cycle of about 10 minutes, plus reading four runs' logs to tell it apart from a regression.
**Prevent by.** `web/e2e/redLine.spec.ts`, helper `type`: pass a failure message to `expect.poll` that names the command, and the turn it saw instead, so a CI failure says which command was lost without needing the trace.
**Seen before.** docs/retrospectives/rq-msx8.md and docs/retrospectives/rq-6lgv.md mention the red line; see them for whether it is this same failure.
