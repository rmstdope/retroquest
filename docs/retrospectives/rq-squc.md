## The new spec failed once and its message was lost

**What happened**: the first `--repeat-each 3` run of `web/e2e/mainQuest.spec.ts` had one failure inside its first walk (the `sendToGame` loop), 4.1 minutes for the whole run, load average above 20. The command kept only the last 8 lines, so the error message was not seen, and the next run overwrote `test-results/`. 29 later runs passed (CPU throttle 1, 4 and 10).

**Why**: not established. A test timeout (then 90 s) on a loaded machine is the guess; it is now 120 s.

**Cost**: about 8 minutes of repeat runs that reproduced nothing.

**Prevent by**: `produce-bead`, *Building*: send a Playwright run's output to a file and read the failure from it, never through `tail` or `grep`.

**Seen before**: no.
