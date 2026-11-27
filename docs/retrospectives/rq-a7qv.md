# rq-a7qv — retrospective

- **Implementer:** Cyclops
- **Date:** 2026-11-27
- **PR:** #1399

## A wait loop on `pgrep -f 'playwright test'` never ended, because it matched its own shell

**What happened.** The local `npx playwright test` (19.8 minutes, 262 passed) outlasted the 600 s
tool limit and moved to the background. To wait for it, a loop broke on
`pgrep -f 'playwright test' >/dev/null || break`. It was still looping after the run had finished
and written `262 passed`, until the second call hit its own limit and was stopped by hand.
**Why.** `pgrep -f` matches full command lines, and the shell running the loop carries the pattern
in its own. Not established whether other worktrees' runs matched too.
**Cost.** About ten minutes of waiting on a finished run.
**Prevent by.** In `produce-bead`, *Waiting, without ending your run*: wait on what the run writes
(`until grep -qE '^ +[0-9]+ (passed|failed)' <log>`), or start the gate with its exit status
echoed to the log, never on `pgrep -f` with a pattern the waiting command contains. A run this
long should be started in the background from the first call.
**Seen before.** rq-tffa.4 (the same suite outlasting the tool limit; a different failure after it).
