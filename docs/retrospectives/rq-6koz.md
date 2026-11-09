# rq-6koz: a test that could not fail hid two of three routes to the bug

## What happened

The first fix closed one route by which Enter reached the focused Look. Its e2e test asserted "no command ran" with `getByTestId('command')`. A held-Enter test written the same way passed before any fix, so I concluded a held key was no bug and dropped the test. The cold review showed the locator stayed at 0 after 15 real `look` turns. With the game's real turn list, the held key gave 6 turns and four paced Enters gave 3.

## Why

`getByTestId('command')` is rendered by `StoryTurn`, and on the laptop stage the story is hidden during an arrival. A count of a hidden thing is 0 whatever the game does. Two older tests in `web/e2e/arrival.spec.ts` had the same blind spot.

## Cost

A wrong bug log, one extra review round and one question to the navigator that the first pass could have asked.

## Prevent by

In `skills/produce-bead/SKILL.md`, *Building* (or the `fix-bug` contract's step 3): a "this did not happen" assertion must be shown to fail once, by running it where the thing does happen, before it counts as evidence.

## Seen before

Nothing like it in `docs/retrospectives/` yet.

# rq-6koz: two e2e fixtures relied on a stray Enter pressing a verb

## What happened

`e2e/belt.spec.ts` and `e2e/pressRing.spec.ts` press Enter in a loop while `.lq-arrival-hint:visible` counts above zero. On narrow screens all eight presses ran during the card's 0.15 s fade. The extra ones opened the folded sheet and then pressed Look, which folded it again. Once the pause swallowed those presses, the sheet stayed open and four tests timed out in CI. Locally I had run only the arrival, scene and narration specs.

## Why

The fixtures' loop condition counted a card that was already leaving, and the outcome depended on how many stray presses happened to land.

## Cost

One red CI run of about 15 minutes and a fix attempt.

## Prevent by

For a change to `web/src/lantern/hurryKeys.ts`, run the whole of `npx playwright test` before the pull request, not only the specs that name the keys (`fix-bug` contract, step 5).

## Seen before

Above, in this file: the same loop shape of asserting on what is on the page rather than on what the game did.
