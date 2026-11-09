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
