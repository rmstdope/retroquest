# rq-a3bb — retrospective

- **Implementer:** Rogue
- **Date:** 2026-11-27
- **PR:** #1435

## CI went red on a belt browser test that a unit-test-only diff cannot reach

**What happened.** On head f3466f67 the job `web-e2e (1/3)` failed: `web/e2e/belt.spec.ts:410`
("a thing whose picture has been made shows it in place of its letter") timed out after 30 s in
`toTheCottageWithBread` (line 35), waiting for the menu item `Take` in the menu `Bread`. It passed
on the retry, and `failOnFlakyTests` failed the run (87 passed, 1 flaky). Locally the whole of
`belt.spec.ts` with `--repeat-each 3` (54 passed) and the one test with `--repeat-each 60
--workers 12 --fully-parallel` (60 passed) never showed it.
**Why.** Not established. The timeout is in the click that follows pressing Enter on the bread's
area; whether the ring never opened or closed again was not determined.
**Cost.** One CI cycle, and about ten minutes of local runs.
**Prevent by.** A Testing bead for `toTheCottageWithBread` in `web/e2e/belt.spec.ts`: open the
trace of the failed attempt, and make the helper wait for what the ring needs before it presses.
**Seen before.** None found.
