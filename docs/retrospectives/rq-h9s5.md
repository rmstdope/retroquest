# rq-h9s5 — the local vitest gate went red under fleet load and green in CI

## Local vitest fails timing-based UI tests while the machine is loaded

**What happened:** The fast gate passed in full (5556 tests, 42 s). After a small, quest-only review fix it ran again: 7 failures in `LanternLayout.panels.test.ts` ("…while the voice reads on"), `useBridge.test.ts` ("reports progress and becomes ready", a 5 s timeout), `narrationScript.test.ts` and `narrationScriptFresh.test.ts` (139 s for the act 1 extract). The full run took 233 s. Reruns failed a *different* set each time, and the previously green head failed the same way. The load average was 55–75 with 34 sessions on the machine. CI was green on the same head.

**Why:** Not established for certain. The tests are timing-sensitive (narration playback, a 5 s init timeout, a long extract), and they starve when many fleet sessions run vitest and Playwright at once.

**Cost:** About 15 minutes of reruns and a revert-and-retest to prove the change innocent, and a gate the producer could not honestly call green locally.

**Prevent by:** A note in `.cerebro/traps.md`, or a check in the fast gate step of `produce-bead` *Building*: read `uptime` before the gate and treat a red result above a load threshold as "rerun once the load drops, or rerun the failed files on the previous head", not as a defect. Or give these suites timeouts that do not depend on wall-clock speed.

**Seen before:** nothing like it yet in docs/retrospectives/.
