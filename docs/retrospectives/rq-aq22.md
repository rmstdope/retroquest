# rq-aq22 — retrospective

- **Implementer:** Storm
- **Date:** 2026-11-27
- **PR:** #1402

## Auto mode gave no verdict for a command that began with `cd`

**What happened.** Twice a Bash call of the form `cd <worktree>/web[/…] && …` was refused with
"auto mode reviewed this call without its leading cd, and the shell has moved since, so the review
does not cover what would run". The same input, sent again alone, ran.

**Why.** Not established. In both cases the shell's directory had changed with an earlier call's
leading `cd`, and the refused call was sent right after one that moved it.

**Cost.** Two re-sent calls.

**Prevent by.** A line in `produce-bead`, *Workspace*: start each command with `cd` to the same
directory (the tree's root) or use `git -C` and `npm --prefix`, so the shell does not move between
a call's review and its run.

**Seen before.** Nothing like it in `docs/retrospectives/`.
