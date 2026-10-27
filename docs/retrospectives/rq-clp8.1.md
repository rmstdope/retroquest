# rq-clp8.1 — retrospective

- **Implementer:** Bishop
- **Date:** 2026-10-27
- **PR:** #628

## A layout test passed while the line it checked was clipped out of sight

**What happened.** The first reproduction test (`web/e2e/speakingRule.spec.ts`) computed where the speaking rule sits from `getBoundingClientRect()` and asserted that the rule ends before the first letter. The fix moved the room description's edge 12px left. The test went green, the fast gate went green, and the full e2e run went green. Only the cold review found that the scrolling `.lq-story` pane had no gutter, so it clipped the rule completely: the line was now invisible instead of overlapping.
**Why.** `getBoundingClientRect()` reports where an element is laid out. It ignores clipping by an ancestor whose `overflow` is not `visible`, and any `overflow-y: auto` makes `overflow-x` clip too.
**Cost.** One review round, a rebase, a second commit and a follow-up review.
**Prevent by.** Any Playwright geometry assertion that says something is visible beside something else (in `web/e2e/`) should also assert that the box lies inside the nearest ancestor whose computed `overflowX` is not `visible`. `measure()` in `web/e2e/speakingRule.spec.ts` does this now and can be copied.
**Seen before.** none found

## Two sibling bug beads changed the same speaking-rule CSS at the same time

**What happened.** rq-clp8.1 (the line overlaps the text) and rq-clp8.2 (the line is missing) ran in parallel under two bugfixers. Both had the same root area: the story pane's left gutter and the −12px offsets. rq-clp8.2 merged the pane gutter (#627) while this PR was in review. This PR's arrival fix only works on top of that gutter. Before the rebase it had removed the line instead of fixing it.
**Why.** The epic rq-clp8 put both children up for assignment at once, with nothing marking that they shared a cause.
**Cost.** A wrong first fix, found only by review, then a rebase.
**Prevent by.** When an epic's children change the same component's styles (here `lantern.css`, `StoryTurn.vue` and `LanternLayout.vue`), the filer should add a `blocks` dependency between them so they run one after the other (see `skills/beads-workflow`, dependencies).
**Seen before.** none found
