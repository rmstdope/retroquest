# rq-gq40 — the panels test failed only in CI, from a timer of an earlier test

## What happened
`LanternLayout.panels.test.ts`'s two phone tests at the end of the file failed on and off in `web-test` (seven red runs between 7 and 9 November), on work that did not touch them. rq-xb25 was parked on it: 35 local runs under load showed nothing.

## Why
Unmounting during a narrated arrival armed `useArrivalStore`'s 1.5 s clearing timer one tick after `afterEach` had called `vi.useRealTimers()`, so the timer was real and outlived the test. When it fired inside a later test, a store action made the old pinia active again. The file runs in about 0.5 s locally and 2.2 s in CI, so a local run was over before the timer fired, under CPU load too.

## Cost
A bead parked, a navigator's decision to allow a re-run, and at least seven red CI rounds across other beads.

## Prevent by
When a test fails only in CI, compare its file's duration in the CI log with a local run, and put a real pause (a `setTimeout` captured before `vi.useFakeTimers`) in the failing test to bring late real timers into it. `LanternLayout.stage`, `.phone` and `.names-tab` tests still take their stores from the active pinia, as rq-tffa.2 noted.

## Seen before
`docs/retrospectives/rq-tffa.2.md`: the same active-pinia takeover, which named `.panels` as exposed; the late source was not found then.
