# rq-hqv0: e2e flake on a test-only change

**What happened**: On a diff that touched only vitest files, `web-e2e (1/3)` failed once: `e2e/arrival.spec.ts:586` (rq-fc9f, "shows every line of the Dream before Enter moves on, after Escape") timed out waiting for `.lq-arrival-line` (15 s). Locally the spec passed 3 of 3; the failed-job re-run was green.

**Why**: not established; looks like CI load on the shard.

**Cost**: one re-run and about 6 minutes of waiting.

**Prevent by**: not established; if it recurs, give that spec's wait a reason to be tied to the arrival's own readiness rather than a fixed 15 s.

**Seen before**: nothing like it yet.
