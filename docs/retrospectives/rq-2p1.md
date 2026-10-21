# rq-2p1

## What happened
Green locally, red in CI: `web-test` failed on `GateCaptain.test.ts > Gate Captain welcome`, a test added by rq-i4s that merged after my branch was cut. It gave the entry pass and then talked to the captain; rq-2p1 makes him leave on the give, so the test saw "already returned".

## Why
Two beads changed the same character's behaviour in parallel; my local tree did not contain rq-i4s. CI tests the merge with main, so it found the clash.

## Cost
One red CI run and one fix attempt (test-only), about ten minutes.

## Prevent by
Fetching `origin/main` and rebasing before the fast gate in the *Building* step of `produce-bead`, so the gate runs on what CI will test.

## Seen before
Nothing like it yet.
