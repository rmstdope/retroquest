# rq-mh4.2 — retrospective

- **Implementer:** Cyclops
- **Date:** 2026-10-23
- **PR:** #502

## Five layout tests passed locally and failed in CI

**What happened.** The new narration tests in `LanternLayout.test.ts` passed in the full local run, and five of them failed in CI's `web-test` (blocks shown that should not be, or not shown).
**Why.** One test switches `narrationOn` off. Settings are saved to `localStorage` whenever it exists. Locally Node runs without `--localstorage-file`, so jsdom has no storage and the setting is lost with the Pinia instance; in CI storage exists, the setting survived into the later tests of the file, and a fresh store read it back as off.
**Cost.** One failed CI run and one fix push, about ten minutes.
**Prevent by.** A test that changes a persisted setting, or follows one that does, clears storage and sets the setting it relies on in its own `beforeEach`. To reproduce locally: `node --localstorage-file=<file> node_modules/vitest/vitest.mjs run <test file>`.
**Seen before.** None found.
