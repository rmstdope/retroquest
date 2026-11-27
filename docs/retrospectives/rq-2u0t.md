# rq-2u0t — retrospective

- **Implementer:** Wolverine
- **Date:** 2026-11-27
- **PR:** #1420

## A lint-rule unit test times out on a loaded machine

**What happened.** The fast gate failed once: the first case of "the content name-comparison rule"
in `web/src/lintRules.test.ts` took 5558 ms against the 5000 ms limit (load average about 75,
38 users' processes). The diff touched nothing under `web/src/`. The next full run passed.

**Why.** Likely, not proven: each call of the test's `lint` helper builds a new `ESLint`, and the
first one loads the whole config, on the real clock under the default timeout.

**Cost.** One extra full unit run.

**Prevent by.** A Testing bead for `web/src/lintRules.test.ts`: one shared `ESLint` instance warmed
in a `beforeAll` with its own timeout.

**Seen before.** None found.

## More narration specs than the known one time out on a loaded machine

**What happened.** With load average 44 to 66, the full browser suite failed
`narration.spec.ts:126` ("a hold let go before the ring is full skips nothing"). A rerun of
`narration.spec.ts` then failed four other tests (lines 209, 268, 376, 490) at about 16 s each, and
a third run passed 21 of 21. The diff touched neither the spec nor `web/src`.

**Why.** Not established. The failures were `expect` timeouts of 15 s.

**Cost.** About 25 minutes of reruns.

**Prevent by.** Widening the Testing bead asked for in `rq-t0ew` to all of `narration.spec.ts`:
its waits on real recordings and the real clock.

**Seen before.** `rq-t0ew` (the first of these tests only).
