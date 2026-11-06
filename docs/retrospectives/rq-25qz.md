# rq-25qz — a commit meant for the worktree went to main

## A relative `cd ..` left the worktree, and the commit and push landed on main

**What happened:** The fast gate ran in `web/` with `cd <tree> && … cd web && …`. The shell's directory carried over to the next call, which began `cd <tree>`, then ran `bd update …`, then `cd .. && git add -A && git commit && git push -u origin HEAD`. That `cd ..` went from the worktree root up to `.cerebro/worktrees`. Git resolved that directory to the main checkout. It staged the navigator's uncommitted image work (22 portrait PNGs, `manifest.json`, `content-studio/images` edits and lock), committed it under this bead's subject, and pushed it straight to `origin/main` as `c28deb4e`. The `gh pr create` that followed failed with "head branch main is the same as base branch main", and that error was the first sign.

**Why:** One shell call held a relative `cd` that assumed where the previous call had left the shell. Nothing in the call checked `pwd` or the branch before `git add -A`, `commit` and `push`. A push of `HEAD` from the main checkout goes straight to the default branch.

**Cost:** The navigator's work-in-progress went onto main without them choosing it, under a misleading subject that names this bead (so `(rq-25qz):` subject greps see two commits). It also cost a question to the navigator, who chose to leave it as is.

**Prevent by:** In `produce-bead` *Workspace*, require every call that commits or pushes to start with an absolute `cd <tree>` and to check, in that same call, that `git branch --show-current` is not the default branch, and stop if it is. The skill's current "Check `pwd` before every git command" is advice that can be skipped inside a chained call. A `git push` guard in `githooks/` that refuses a push to the default branch from a fleet session would catch it mechanically.

**Seen before:** Nothing like it yet in `docs/retrospectives/`.
