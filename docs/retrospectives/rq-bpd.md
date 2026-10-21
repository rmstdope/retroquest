# rq-bpd

## What happened
Waited ~20 minutes for CI that never started: the PR was `CONFLICTING` with main (the shared `Act3.integration.test.ts` kept getting appended to by other beads), and `gh pr checks` printed only "no checks reported". While squashing, a `git reset --soft origin/main` from the wrong base staged a diff that reverted main's commits; caught by `git diff --stat origin/main HEAD`.

## Why
GitHub runs no CI on a conflicting PR, so an empty check list looks like "pending". Squash base was taken from `origin/main` instead of the merge-base.

## Cost
About 25 minutes and two extra rebases.

## Prevent by
Check `gh pr view <n> --json mergeable` before every CI wait and treat `CONFLICTING` as a rebase, not a wait; squash with `git reset --soft $(git merge-base HEAD origin/main)`.

## Seen before
Nothing like it yet.
