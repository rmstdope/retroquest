# rq-zkkc — retrospective

- **Implementer:** Storm
- **Date:** 2026-11-27
- **PR:** #1436

## Merging by hand took repeated catch-ups while main kept moving

**What happened.** `scripts/ship` exited 3 ("no fleet view has swept in ten minutes"), so the
producer merged itself. CI was green at `85968f43`, `34c50883` and two later heads, but each time
main had gained a commit during the five-minute run. `gh pr view` said `MERGEABLE CLEAN`; the
protection call in `produce-bead`, *Merging*, answers `404 Branch not protected`, which that
section reads as `strict`, so every behind head needed `update-branch` and another CI run.

**Why.** The default branch is unprotected, and the skill treats any failed protection read as
strict, "Branch not protected" included.

**Cost.** Several extra CI runs of about five minutes each, for a diff that never changed.

**Prevent by.** `produce-bead`, *Merging*: say that a `404 Branch not protected` answer means
`strict` is false (or protect the branch, if strict is what is wanted).

**Seen before.** None found for the protection answer; rq-xb25 and rq-h3xx mention catch-ups while
main moved, for other symptoms.
