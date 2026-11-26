# rq-go62 — retrospective

- **Implementer:** Storm
- **Date:** 2026-11-26
- **PR:** #1393

## ESLint's fixes silently vanished in the second test of a file

**What happened.** `web/formatStaged.config.test.ts` first called the formatting function
in-process, each test on its own temporary repository holding a copy of `eslint.config.js`. The
first test passed; a later one came back Prettier-formatted but with `export let` unfixed, and
nothing was reported.
**Why.** Inferred, not confirmed from an error message: typescript-eslint refuses to parse once
one process has loaded configurations from two roots, and the script keeps only ESLint's output,
so a parse error looks like "nothing to fix". Running each test's script as a subprocess made all
of them pass.
**Cost.** One test run and a rewrite of how the tests call the script, a few minutes.
**Prevent by.** A test that lints temporary repositories with the project's ESLint configuration
runs the linter in a subprocess, one repository per process, as
`web/formatStaged.config.test.ts` does.
**Seen before.** none found.
