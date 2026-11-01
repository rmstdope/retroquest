# rq-tffa.2 — a layout test flaked in CI only

## What happened
`LanternLayout.arrival.test.ts` failed in `web-test` on PR #718 and on main (#717), a different test each time (`shows a turn that is not narrated…`, `ignores N during an arrival…`, `moves focus from the paper to the tab…`): the command went in and the arrival never appeared. Green locally alone and in the full run; two bare re-runs were spent before the cause was found.

## Why
The test took its stores with `useGameStore()` and friends, which resolve through pinia's *active* pinia. A store of an earlier test acting late (a callback that outlives its test) sets its own pinia active again, so `run()` sent the command to the old test's store while the mounted layout watched the new one. Reproduced under CPU load (30 busy loops: about one run in eight failed) and pinned by a test that sets another pinia active mid-test.

## Cost
Three CI rounds, two re-runs, and a bead handed back to a person.

## Prevent by
A test that mounts a component binds every store lookup to its own pinia (`useXStore(pinia)`, `mount(..., { global: { plugins: [pinia] } })`, `startedHoldStore(pinia)`), as `LanternLayout.arrival.test.ts` now does.

## Seen before
Nothing like it yet. `LanternLayout.stage`, `.panels`, `.phone` and `.names-tab` tests use the same `setActivePinia(createPinia())` pattern and are exposed to it.
