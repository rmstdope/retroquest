# rq-rewj retrospective

## The local fast gate went red on UI tests this diff never touched

**What happened:** `npm run test` (the fast gate) failed three times in a row on tests that had nothing to do with the change (Act I text only): `LanternLayout.panels.test.ts` (a different case each run) and `useBridge.test.ts > init > reports progress and becomes ready`, all vitest timeouts. Each passed when run alone, and the full suite passed with `npx vitest run --maxWorkers=4`. CI was green.

**Why:** The machine's load average was about 32 (34 sessions, other worktrees running suites at the same time), and vitest's default worker count put more parallel work on top of it, so timing-sensitive UI tests timed out.

**Cost:** Three extra full-suite runs, about 10 minutes, and time spent working out whether the failures were real.

**Prevent by:** `gate_fast` in `.cerebro/project.conf` could cap vitest's workers (for example `npm run test -- --maxWorkers=4`), or the *Building* section of `produce-bead` could say to rerun with fewer workers, after checking the load average, before treating timeouts as real.

**Seen before:** nothing like it in `docs/retrospectives/`.
