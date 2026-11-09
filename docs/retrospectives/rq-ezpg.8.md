# rq-ezpg.8 — belt unit tests green locally, red in CI (localStorage)

## What happened
`BeltOfPictures.test.ts` passed on the producer's machine and failed ten tests in CI's `web-test`: a test that switched the belt to Spells left `list: 'spells'` in `localStorage` (the belt store remembers it, like the settings), and the next test mounted a belt that started on Spells. Locally Node prints "localStorage is not available because --localstorage-file was not provided", so the store's try/catch silently fell back to its defaults every time and nothing leaked.

## Why
The test environment differs: CI has a working `localStorage` inside jsdom, a laptop run does not. Tests of anything that persists to `localStorage` only prove isolation where storage exists.

## Cost
One red CI run (about 12 minutes) and one fix push. Running the whole suite with `NODE_OPTIONS=--localstorage-file=...` to reproduce was not usable: it makes 48 unrelated tests fail, because the file is shared between workers.

## Prevent by
A test of a store or component that persists to `localStorage` stubs its own in-memory `localStorage` in `beforeEach` (`useBeltStore.test.ts`, `useSettingsStore.test.ts` and now `BeltOfPictures.test.ts` do) and unstubs it afterwards.

## Seen before
`rq-zhks.md`, `rq-mh4.2.md` and `rq-ezpg.9.md`: the same cause (a persisted value leaking between tests only where `localStorage` exists), each time with the settings store. This is the fourth.
