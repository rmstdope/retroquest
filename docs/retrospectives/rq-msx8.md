# rq-msx8 — retrospective

- **Implementer:** Shadowcat
- **Date:** 2026-11-02
- **PR:** #760

## A wording fix was green on the fast gate and red in web-e2e, because an e2e spec quoted the old line

**What happened**: The fix changed the Act 1 refrain from "…and let them rest…" to "…let them rest…". Before changing it, I grepped `web/src`, `tts`, `design` and `docs` for the old wording, but not `web/e2e`. The fast gate (eslint, prettier, vue-tsc, vitest) was green. In CI, web-e2e failed: `web/e2e/redLine.spec.ts` checks the dream voice beat against the exact old line, and `web/e2e/arrival.spec.ts` uses it as fixture text.

**Why**: `gate_fast` has no Playwright leg, and the grep left out `web/e2e`. A change to wording is exactly the kind that e2e specs quote word for word.

**Cost**: One red CI round (~5 minutes), one fix attempt and a second commit.

**Prevent by**: Before the PR on any bead that changes a game line, grep the whole `web/` tree for the old text (`grep -rn "<old text>" web/src web/e2e`), not only `web/src`, and run `npx playwright test` under `smoke-port`. Better still, add a Playwright leg to `gate_fast` in `.cerebro/project.conf`, or make `fix-bug` step 5 name the e2e suite.

**Seen before**: rq-yjh6 (the same class: an e2e spec pinned the old behaviour and the fast gate does not run e2e), and rq-lt3i.
