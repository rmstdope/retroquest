# rq-crqk — the local unit suite went red on timeouts while the machine was overloaded

**What happened**: After the review answer, `npm run test` in the worktree failed 4 tests, and
running only those 4 files again failed 7. Each run failed a different set, and every failure was a
timeout: `useBridge` init at 5 s, `LanternLayout.panels` waits, and `narrationScriptFresh` for
Act 1 and Act 2 at about 130 s. `uptime` showed a load average of 78 on the host, which had 34
sessions. Act 1's freshness test passed alone with `--testTimeout=600000`, and CI's `web-test`
passed on the same head.

**Why**: The fleet's sessions run their gates on one machine at the same time. The suite's fixed
timeouts (vitest's 5 s default, the freshness test's own limit) are sized for an idle machine.

**Cost**: Two extra suite runs (about 4 minutes), one targeted rerun with a raised timeout, and
the doubt over whether a red gate was real before opening a commit.

**Prevent by**: `produce-bead` *Building*: when the fast gate fails only on timeouts, check
`uptime` and rerun the failing files alone with a raised `--testTimeout` before treating it as a
regression. Or the fleet view could stop starting gates when the host's load is above a limit,
the way `disk-preflight` stops a start when the disk is low.

**Seen before**: Not in `docs/retrospectives/` (grep for "load" and "timeout": rq-yjh6 and
rq-9bu are about other timeouts).
