# rq-c09g — retrospective

- **Implementer:** Wolverine
- **Date:** 2026-11-27
- **PR:** #1423

## Narrated specs began an act before its recordings had arrived

**What happened.** With 4 e2e workers, `narration.spec.ts` ("marks a narrated paragraph with a rule")
failed with `.lq-speaking` never appearing: once in CI (45959857880), and in some local batches
(up to 35 of 80). Delaying the narration manifest 3 s failed 18 of the spec's 21 tests, and
`cardEnd.spec.ts` too.

**Why.** The specs pressed Begin and typed at once. A turn played before the manifest is loaded is
told without the voice. `sound.spec.ts` and `narrationHint.spec.ts` already waited for it, each in
its own way; the other narrated specs did not.

**Cost.** About 20 minutes of repeat runs. Retrying with `--trace` and with CPU throttle did not
reproduce it; delaying the one network answer the test depends on did, at once.

**Prevent by.** A narrated spec begins an act with `beginActOnceRecorded` (`web/e2e/fixtures.ts`).
When a spec times out waiting for something that never appears, delay the fetches it depends on
before reaching for repeats.

**Seen before.** `rq-t0ew` and `rq-2u0t` record narration specs failing on a loaded machine; neither
names this cause.

## Cottage-picture specs still flake on a loaded machine

**What happened.** Local `CI=1` runs now use 4 workers. Under load of up to 50, some had a flaky
`roomMotion.spec.ts`, `roomPatches.spec.ts:9` or `arrival.spec.ts:462`. None showed in the CI runs of
this bead.

**Why.** Not established. Delaying the picture manifest 4 s did not reproduce the cottage ones.

**Cost.** Two extra full local runs.

**Prevent by.** A Testing bead for `toTheCottage` (`web/e2e/fixtures.ts`) if CI shows either.

**Seen before.** `rq-vjbs` (the local suite under load).
