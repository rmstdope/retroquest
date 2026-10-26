# rq-bvt2 — retrospective

- **Implementer:** Nightcrawler
- **Date:** 2026-10-26
- **PR:** #625

## A scripted casing sweep over test files broke types and weakened guards without one red test

**What happened.** To bring the tests in line with ~80 lower-cased story lines, I ran a regex pass over every `*.test.ts` that lower-cased title-cased item names after a lower-case word, and a second pass that lower-cased item names inside `toContain('…')`. The first pass also lowered class names in type positions (`locker: Locker` became `locker: locker`, `let quest: EchoesOfTheHiddenBondQuest` became `echoesOf…`). vitest stayed green, since it strips types; only `vue-tsc` in the gate failed. The second pass lowered `toContain` checks on raw item names (inventory lists, the room's item listing), and those then failed. It also turned some `not.toContain('Crystal of Light')` checks on room listings into always-true ones; I caught and reverted those by reading the diff. One more guard, `not.toContain('Ancient Amulet[/item_name] glows')` in `Act3.curse.test.ts`, became trivially true because the source text itself went lower case. Only the cold-read review caught it.

**Why.** A text-level substitution cannot tell narrative from identifiers or from raw-name assertions. And a negative assertion stays green whether or not it still tests anything.

**Cost.** Two rounds of manual reverts, a failed type check found late in the gate, and one review finding with its own fix commit and CI run.

**Prevent by.** When a change rewrites wording that tests pin, update the tests from the failure list (`npx vitest run` → each `AssertionError`), not by a bulk pass. After any bulk edit, run `npx vue-tsc --noEmit` before the test suite. List every changed `not.toContain` with `git diff -U0 -- '*.test.ts' | grep 'not.toContain'`, and check each one still matches something real.

**Seen before.** None found.
