# rq-lt3i — e2e specs outside the one I ran were red in CI

**What happened**: I ran only `e2e/lantern.spec.ts` locally. CI's full e2e run failed in `narration.spec.ts` (it looked for the old `Cancel` text and `.lq-cancel`) and `narrationHint.spec.ts` (two more phone verbs made the sheet one row taller, so a read word sat under the hint).

**Why**: The plan named only the lantern spec as the e2e suite to run; other specs drive the same composer.

**Cost**: One red CI round (~6 minutes) and a fix commit.

**Prevent by**: When a change touches `ActionComposer.vue` or the verb list, plan the full `npx playwright test`, and grep `web/e2e/` for the changed labels and class names (`Cancel`, `.lq-cancel`, `Do it`).

**Seen before**: nothing like it yet.
