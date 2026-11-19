# rq-v29l.4 — a pre-existing e2e flake made the bead's CI red twice

**What happened**: At head `6d5ef754`, `web-e2e (1/3)` failed twice, each time with "1 flaky" and every other test passing. On the run, `e2e/arrival.spec.ts:346` ("keeps a speaker’s quote on the page of the line that introduces it, and Space and Escape work") waited 15.7 s for `.lq-arrival-card` after a Space, then passed on the retry in 2.9 s. On the first re-run, `e2e/areaNames.spec.ts:385` (rq-njoa) failed in its setup: `dotUnderCardEdge` found no dot under the words. Locally under `smoke-port`, the first test passed 8 of 8 and the second 10 of 10. The second re-run was green. Main's own latest CI run (`44611342191`, `d7fa0832`) failed on the same `arrival.spec.ts:346` test, also at 15.8 s, so the bead did not cause it.

**Why**: not established. Both tests wait on layout that is told on a timer: an arrival page after Space, and a dot laid out under the cards after a scroll. Both pass at once on a retry, which points at a slow CI runner rather than the code.

**Cost**: both of the bead's bare re-runs (about 15 minutes of CI waiting), and two local repro runs.

**Prevent by**: In the Playwright reporting of `.github/workflows/ci.yml`, a test that is only flaky should not fail the job. Failing that, the rule in rq-dn9z should be followed: pull `test-results/…/error-context.md` for `arrival.spec.ts:346` and pin why the Space page change can take 15 s on CI.

**Seen before**: rq-dn9z, rq-hqv0 and rq-7psx are CI-only flakes in `e2e/arrival.spec.ts` waiting on `.lq-arrival-line`. This is the same spec, a different test, and now red on main too.
