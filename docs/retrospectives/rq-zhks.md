# rq-zhks

## A start-mode setting leaked between tests: green locally, red in CI

**What happened**: A new ActionComposer test set `useSettingsStore().startMode = 'type'` in a describe block (`ActionComposer on the stage`) that, unlike the first describe, does not stub `localStorage`. Locally all 4740 tests passed; in CI five later tests failed with `Unable to get [data-type]`.

**Why**: The setting persists to `localStorage`, which exists in CI but not in the local vitest run (`--localstorage-file` warning), so the value leaked into later tests only in CI.

**Cost**: One red CI run and one fix commit (about 6 minutes).

**Prevent by**: In `ActionComposer.test.ts`, give the `on the stage` describe the same `localStorage` stub as the first describe's `beforeEach`; or never write settings in a test without it.

**Seen before**: nothing like it yet.
