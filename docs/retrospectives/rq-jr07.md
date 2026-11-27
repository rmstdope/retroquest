# rq-jr07: the local browser suite outlasts a foreground tool call

**What happened.** The plan's validation ran `smoke-port -- npx playwright test` after the build in one foreground call, wrapped in `timeout 580`. The call passed the 600 s tool limit and was moved to the background, and the wrapper killed Playwright partway (exit 124, `Terminated: 15`) with no failures printed. The second, unwrapped run passed 262 tests in 19.3 minutes.

**Why.** The full suite run locally takes about twice the longest foreground tool call (CI splits it into three shards). `produce-bead`, *Waiting, without ending your run*, covers waits on things outside the session, not a validation command of the session's own that is longer than one call.

**Cost.** About ten minutes for the discarded run.

**Prevent by.** A line in `skills/produce-bead` *Building*: a validation command that can exceed ten minutes is started with `run_in_background` writing its exit status to a file, with no `timeout` wrapper, and is waited on with the heartbeating `until` loop.

**Seen before.** None found in `docs/retrospectives/`.
