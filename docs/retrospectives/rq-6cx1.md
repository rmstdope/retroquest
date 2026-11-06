# rq-6cx1 — the review sub-agent left the bugfixer's worktree detached

**What happened:** The `reviewer` sub-agent was briefed with the worktree path "read-only for you"
and the reviewed sha. After it returned, the worktree was on `HEAD (no branch)` at that sha (reflog:
`checkout: moving from rq-6cx1-… to 8befcb41`). The bugfixer's next commit (the review answers)
landed on the detached HEAD, and the following `git push` pushed nothing, with its output hidden by
a `| tail -1` in the same call. It surfaced only when `gh pr view` showed the PR head was still the
reviewed sha and the PR `CONFLICTING`.

**Why:** Most likely the sub-agent ran `git checkout <reviewed_head>` in the shared worktree to
read the code at that sha. Not established beyond the reflog entry.

**Cost:** About ten minutes: re-attaching the branch, a rebase with conflicts in the generated
narration lock and manifest, regenerating them, and an extra commit.

**Prevent by:** `.cerebro/cerebro/agents/reviewer.md` (the review sub-agent's mode) telling the
sub-agent never to check out, switch or reset in the producer's tree (read a sha with `git show
<sha>:<path>` or `gh pr diff`); and `skills/produce-bead` *The review loop* checking
`git branch --show-current` after the sub-agent returns, before any further commit.

**Seen before:** No.
