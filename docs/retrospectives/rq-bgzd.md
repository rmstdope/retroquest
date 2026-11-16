# rq-bgzd

## What happened
The first CI run of PR #1190 failed two e2e shards: `menuKeys.spec.ts:76` (shard 2/3) and `settingsRing.spec.ts:53` (shard 3/3). Each passed on Playwright's own retry ("1 flaky, 76 passed"), yet the step exited 1. The change touched only the fade code, no menu code. Three repeats of both specs passed locally, and a bare re-run of the failed jobs went green.

## Why
Not established. Both specs concern focus rings in menus; the CI step counts a flaky test as a failure.

## Cost
One re-run of the e2e shards (about 6 minutes) and a local reproduction.

## Prevent by
Not established; a fix is the navigator's to choose (quarantine or fix the two specs).

## Seen before
rq-gw9m (CI red on flaky suites the change does not touch) and rq-n0mb (a test reported "1 flaky").
