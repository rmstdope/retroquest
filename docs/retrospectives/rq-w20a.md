# rq-w20a — retrospective

- **Implementer:** Rogue
- **Date:** 2026-11-27
- **PR:** #1432

## The bead blamed the crowding test for a file's 13 s; it cost about 0.15 s of them

**What happened.** The bead named the test stepping four scenes 160,000 times as the cost. Run
alone it took 37 ms (`npx vitest run src/lantern/roomMotionScene.test.ts --reporter=verbose
--silent`). The time was in other tests, whose fake canvas proxies made a new `vi.fn()` for every
method the scene called. Replacing that with one shared no-op took the file from 5.0 s to 0.6 s
locally and from 13,399 ms to 1,343 ms in CI.
**Why.** The cited log gives one duration per file, and the filing names the test with the largest
step count without giving any per-test time.
**Cost.** A few minutes of measuring. Doing only what the bead described would have left the file
close to 13 s and failed its acceptance.
**Prevent by.** A step in the `qa` sweep's filing of a slow-file finding: run that file with
`--reporter=verbose` and quote the per-test durations of the tests it names.
**Seen before.** none found
