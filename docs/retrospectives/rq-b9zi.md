# rq-b9zi — retrospective

## `git add -A` in a prepared worktree committed a cerebro submodule bump

**What happened:** The worktree's `.cerebro/cerebro` was checked out at a different commit from the one `main` records. Committing increments with `git add -A` staged that difference, so PR #1114 carried an unrelated submodule bump (`23458d8b` → `9d7c5121`). The second review round spotted it. `git checkout origin/main -- .cerebro/cerebro` did not undo it, because the submodule's own checkout won. Only `git update-index --cacheinfo 160000,<main's sha>,.cerebro/cerebro` fixed the committed pointer.

**Why:** The worktree's submodule checkout is not tied to the gitlink on the branch. `git add -A` stages any submodule whose HEAD differs from the recorded gitlink.

**Cost:** One review round partly spent on it, two extra commits, and a near-miss: an unreviewed harness version would have shipped inside a UI change.

**Prevent by:** In `produce-bead`, *Workspace*, stage `web/` (or the paths the bead names) rather than `git add -A`. Alternatively, have `prepare-worktree` run `git submodule update` to the branch's recorded gitlink, so `git status` shows no submodule change in a fresh tree.

**Seen before:** No.
