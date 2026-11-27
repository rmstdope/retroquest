# rq-t0ew — retrospective

- **Implementer:** Cyclops
- **Date:** 2026-11-27
- **PR:** #1407

## A narration spec merged an hour earlier fails about one local run in four

**What happened.** The full browser suite on the rebased branch (4 workers) failed
`narration.spec.ts` "a hold let go before the ring is full skips nothing": `.lq-speaking` had count
0, expected 1. Neither the spec nor `web/src` differed from main. Alone, with
`--repeat-each 15 --workers=4`, it failed 4 of 15. The same pull request's CI shards passed.

**Why.** Not established. The test holds the mouse and lets go before the app's hold comes due, on
the real clock; #1402 last changed the spec.

**Cost.** One extra run to tell it from a regression.

**Prevent by.** A Testing bead for that test: let go on the page's clock (`page.clock`) instead of
racing the hold's timer.

**Seen before.** None found.

## Auto mode gave no verdict for a command that began with `cd`

**What happened.** A Bash call of the form `cd <worktree>/web && …` was refused with "auto mode
reviewed this call without its leading cd, and the shell has moved since". Sent again alone, it ran.

**Why.** Not established.

**Cost.** One re-sent call.

**Prevent by.** As in `rq-aq22`: a line in `produce-bead`, *Workspace*, to keep the shell in one
directory (`git -C`, `npm --prefix`).

**Seen before.** `rq-aq22`.
