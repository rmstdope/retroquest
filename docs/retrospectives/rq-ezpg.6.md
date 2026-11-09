# rq-ezpg.6 — redLine e2e red in CI, green locally

## What happened
`e2e/redLine.spec.ts` failed twice in CI (`Expected: "debug act2"`, `Received: null`) on a pull request that did not touch it, and passed locally every time. The spec's `type()` waits until the typed command is the game's *newest* turn; a debug script plays its own turns and the act change clears them, so the typed command is only seen if the poll lands in a short window.

## Why
A timing cliff in the spec, not in the change: with CPU throttling (Chrome DevTools `Emulation.setCPUThrottlingRate`) at 3x and 4x the same spec fails on unmodified `origin/main` too; at 2x both pass. CI's runner sat on the wrong side of the cliff for this head.

## Cost
Two CI runs (about 25 minutes), one bare re-run spent, an hour of diagnosis.

## Prevent by
The debug line in `redLine.spec.ts` no longer waits for the newest turn; its report line ("Debug script 'actN' played …") is the proof, and the spec passes at 4x throttle. Any spec that asserts on "the newest turn" after a debug script is the same shape.

## Seen before
`docs/retrospectives/rq-62gc.md`: the same spec, the same assertion (`redLine.spec.ts:187`), red in CI and green locally on a change that did not touch it. That one was not diagnosed; this one is a timing cliff reproducible with CPU throttling.
