# rq-tffa.4

## A long foreground e2e run, re-run after a tool timeout, ran twice at once

**What happened:** `npx playwright test` under `smoke-port` outlasted the 590 s tool limit and moved to the background while a second copy was started; two runs on one machine made single specs hang for 15 minutes (`narration.spec.ts` "holds the story still", `lantern.spec.ts`), each passing alone in 5 s. Separately, `git add -A .` during a rebase staged `e2e/lantern.spec.ts` with conflict markers; `eslint` caught it only at the next gate.

**Why:** the first part is not established beyond contention; the second is `git add -A` run before checking for markers.

**Cost:** about 45 minutes and three full e2e runs.

**Prevent by:** run the e2e per spec file with `--global-timeout` (the whole suite is about 45 s when alone), never start a second copy while one is in the background; after a rebase, `grep -rn '<<<<<<<' web/src web/e2e` before `git add`.

**Seen before:** nothing like it yet.
