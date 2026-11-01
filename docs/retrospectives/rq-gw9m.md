# rq-gw9m — retrospective

- **Implementer:** Nightcrawler
- **Date:** 2026-11-01
- **PR:** #722

## CI red twice on a change that two flaky suites on main do not touch

**What happened.** The first head of PR #722 was green. After a test-only follow-up commit, CI went red: `web-test` failed in `src/components/lantern/LanternLayout.arrival.test.ts` (a different case on each run: "clears when narration is switched off while it is told", then "ignores N during an arrival, and the tab does not offer it"), and `web-e2e` failed twice in `e2e/lantern.spec.ts` "opens a long turn at its start with More below at 390×844" (`|turn.y - story.y|` 40–57px, expected < 24). With main's `StageSpeech.vue` swapped in locally, the e2e failed 5 of 8 runs (`--repeat-each 8 --retries=0`) and the arrival file failed 1 of 10 `npx vitest run`s. Main's own CI is red on the arrival suite at 735bd7ae and 5079b044 (a docs-only commit).
**Why.** Not established. The e2e measures the paper's turn position straight after `toContainText`, while the paper may still be gliding (its height transition) or scrolling. The arrival cases look timing-dependent too.
**Cost.** About 25 minutes: two bare re-runs (the whole re-run budget), a bisect of the change, and local repeat runs to prove the flakes were already on main.
**Prevent by.** A Testing bead to make these two tests deterministic: `lantern.spec.ts` "opens a long turn at its start" should wait for the paper's size to settle before it measures, and `LanternLayout.arrival.test.ts` needs its timing source found. Until then, the CI fail-fast on main hides that main itself is flaky.
**Seen before.** none found.
