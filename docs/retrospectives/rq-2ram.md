# rq-2ram — retrospective

- **Implementer:** Rogue
- **Date:** 2026-11-27
- **PR:** #1422

## A forced click failed an e2e shard with "Element is not visible"

**What happened.** The first CI run of the branch (45957511870) failed `web-e2e (3/3)`:
`pressRing.spec.ts` "the ring of a person fits inside the picture" raised `locator.click: Element is
not visible` in `pressThing` and passed on its retry, which `failOnFlakyTests` turns red. It did not
recur in some hundreds of local repeats in the same container image.

**Why.** `click({ force: true })` skips the wait for visibility, so a button briefly without a box
fails at once (shown with a temporary spec). Why the button had no box then is not established.

**Cost.** One CI fix attempt and about 20 minutes of local container runs.

**Prevent by.** In `web/e2e/`, put `await expect(locator).toBeVisible()` before a
`click({ force: true })`. `belt.spec.ts` still has one such click on an area button.

**Seen before.** none found in `docs/retrospectives/`.

## The bead expected time saved, and the container saves none

**What happened.** The browser install step took a median 20 s (16 jobs); "Initialize containers"
took a median 27 s (8 jobs). Job totals did not fall.

**Why.** The Playwright image is pulled afresh on every GitHub-hosted runner.

**Cost.** None to the build; the bead's "pull requests wait less" is not met.

**Prevent by.** A bead that swaps one CI download for another should be filed with the new one
measured first, for instance with a throwaway workflow run.

**Seen before.** none found in `docs/retrospectives/`.
