# rq-8xen — retrospective

- **Implementer:** Storm
- **Date:** 2026-11-27
- **PR:** #1408

## A testing bead's "a unit test already asserts this" did not hold for one browser assertion

**What happened.** The bead listed `LanternLayout.arrival.test.ts:732-734` as proof of
`spellNews.spec.ts`'s "the journal keeps the learned line". Those lines read the store's
`fullText`, not the journal. Deleting `record` from `<StoryTurn>` in `StoryDrawer.vue` left all
1404 component tests green, so removing the spec as filed would have lost the only proof. A test
was added to `StoryDrawer.test.ts`.
**Why.** The cited unit assertion checks the data behind the screen, not the screen; each half
(`StoryTurn` with `record` set by the test) was covered, the wiring between them was not.
**Cost.** A few minutes; no CI cycle.
**Prevent by.** In `.cerebro/cerebro/agents/qa.md`, for a finding that says a higher-level test is
already proven lower down: show it by breaking the wiring and seeing the cited test fail, for
every assertion about what a person sees.
**Seen before.** None found.

## `narration.spec.ts:93` failed once in the full local Playwright run

**What happened.** `tells an answer block by block, a tap hurries and a hold shows the rest`:
expected 1 block, received 3 (`narration.spec.ts:106`), 1 failed and 257 passed. The diff does not
touch it. A re-run of `narration.spec.ts` with `questNews` passed 25 of 25.
**Why.** Not established.
**Cost.** One extra run of two specs, about two minutes.
**Prevent by.** A testing bead to make that test count blocks without depending on how fast the
telling runs under load.
**Seen before.** None found.
