# rq-vjbs — retrospective

- **Implementer:** Cyclops
- **Date:** 2026-11-26
- **PR:** #1394

## A quarantine bead was claimed and worked before the quarantine had merged

**What happened.** The bead asked for a bead per quarantined spec. rq-4zhj was filed at P4 during the
build. Within minutes it had been ranked, labelled `bugfix` and claimed by Bishop, who edited
`web/e2e/areaNames.spec.ts`, the same file as this PR, while the `@quarantine` tag the bead
describes was not yet on `main`.

**Why.** A bead is assignable as soon as it is ranked, and nothing in the new bead said it depended on
this one: no `bd dep add` was made.

**Cost.** A coordination note on rq-4zhj and the risk of two branches editing one test.

**Prevent by.** `produce-bead` could say: a follow-up bead whose subject only exists once the current
PR merges is filed with `bd dep add <new> <current>` in the same call.

**Seen before.** none found in `docs/retrospectives/`.

## The browser suite could not finish locally while other sessions were building

**What happened.** With a load average of 90 to 150, `npx playwright test` was cut off at the 10-minute
tool limit twice (179 and 217 tests done), one run's servers did not start within 180 s, and one vitest
`beforeAll` hit its 60 s timeout. CI ran the same shards in 4 to 6 minutes.

**Why.** Several worktrees were building and driving browsers on one machine; the suite was run in the
foreground.

**Cost.** About 40 minutes of waiting and re-running.

**Prevent by.** `produce-bead`, *Building*: say to run the full browser suite with
`run_in_background` and to check `uptime` first.

**Seen before.** not established.
