# rq-ezpg.9 — retrospective

- **Implementer:** Wolverine
- **Date:** 2026-11-08
- **PR:** #1053

## Four tests that set Reduce motion were green locally and red in CI

**What happened.** New tests set `settings.reduceMotion = 'on'`; `npm run test` was green locally (6575), and web-test failed in CI on those tests and on the existing SettingsDialog "follows the device" test, which ran after them.
**Why.** The settings store saves to `localStorage`. Locally Node prints "localStorage is not available because --localstorage-file was not provided", so nothing persisted between tests; in CI it does, so the next test's fresh Pinia read 'on' back. Established from the CI log; reproduced only partly (a shared `--localstorage-file` makes unrelated tests fail too).
**Cost.** One red CI cycle (about 10 minutes) and one fix commit.
**Prevent by.** A test that changes a persisted setting clears `localStorage` in its `beforeEach` (`globalThis.localStorage?.clear()`); worth one line in `CLAUDE.md` under Testing. Running the suite locally cannot show it.
**Seen before.** rq-mh4.2, rq-zhks (localStorage in tests; not read in full).
