# rq-ea5t — retrospective

- **Implementer:** Rogue
- **Date:** 2026-11-27
- **PR:** #1401

## Only the browser suite noticed the name menu stopped returning focus to its name

**What happened.** The plan put the name menu under the new rule as a window, so with the typing
box up Escape sent the cursor to the box instead of back to the name. All 7589 vitest tests passed.
`npx playwright test` failed `e2e/namesTab.spec.ts:53` after about 20 minutes, and the suite was
run again in full after the fix.
**Why.** The behaviour was pinned only end to end: `LanternLayout.test.ts` checked the name menu's
focus return with no typing box up. The plan was written from the unit tests and the source
without searching `web/e2e/` for `toBeFocused`.
**Cost.** One extra full browser run (about 20 minutes) and an amended plan.
**Prevent by.** A unit test of that return with the box up, which this PR adds to
`LanternLayout.test.ts`; and when a plan changes focus behaviour, grep `web/e2e/` for
`toBeFocused` and run those specs before the full suite.
**Seen before.** none found
