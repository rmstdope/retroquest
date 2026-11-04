# rq-me4f — retrospective

- **Implementer:** Nightcrawler
- **Date:** 2026-11-04
- **PR:** #830

## Two beads in flight fixed the same bug, and one PR had to be rebuilt

**What happened.** rq-me4f (state-dependent room descriptions never scripted) and rq-6lgv (the
locked Abandoned Shed, and a description read on look unscripted) were worked at the same time by
two sessions. Both changed `actScript` in `web/src/lantern/narrationScript.ts` to read a room's
description again after a step, and both repaired the same 7 tests left red by 6b405e1a. rq-6lgv
merged first; #830 then conflicted in all four `tts/act<N>/script.json`, the reproduction test
already passed on main, and the PR was rebuilt on main around what was left (branch scenes).

**Why.** Not established. Each bead named a different symptom; the shared cause (the extractor
reads a room only on its first visit) was found inside both builds, and nothing showed one session
the other's open PR touching the same function.

**Cost.** A discarded fix, a second review, a rebuild and a re-gate; a navigator question about
the red main that rq-6lgv had answered an hour earlier.

**Prevent by.** At the start of a build, `gh pr list --search "<file>"` (or `gh pr list` and a look
at each open PR's files) for the files the fix will touch, read as a step of `produce-bead`
*Workspace*; an open PR on the same function is a reason to wait for it or say so on the bead.

**Seen before.** The red main is rq-6lgv's first section. The overlap: none found
(`grep -ril "overlap\|same bug\|duplicate" docs/retrospectives/` matched only unrelated files).
