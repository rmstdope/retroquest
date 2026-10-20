# rq-ay8: retrospective

## Vitest cache files committed from the repository root

**What happened.** A `npx vitest run …` started from the worktree root (the shell's cwd had moved back from `web/`) did not find `web/`'s vitest. npx fetched one into its own cache, which failed for lack of `jsdom`, but it still wrote `node_modules/.vitest-cache/` at the repository root. The next `git add -A` committed both files (b102e57). The cold review caught them.

**Why.** The root `.gitignore` does not ignore `node_modules/`; only `web/` does. The `cd web && …` prefix is easy to lose when the shell's working directory resets between calls.

**Cost.** One review finding, a removal commit, and a second CI run on the branch.

**Prevent by.** Add `node_modules/` to the root `.gitignore`. Run tests with `npm run test -- <files>` from `web/` rather than bare `npx vitest`, which falls back to a downloaded copy outside a package.

**Seen before.** No.
