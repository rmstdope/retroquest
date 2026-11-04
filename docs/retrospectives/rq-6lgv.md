# rq-6lgv — retrospective

- **Implementer:** Bishop
- **Date:** 2026-11-04
- **PR:** #825

## Main was red on arrival, from a hand commit of studio data

**What happened.** The fast gate in a fresh worktree failed 7 tests unrelated to the bead
(`sceneMix.test.ts`, `useActMusic.test.ts`, `LanternLayout.test.ts` music credits). The same 7
failed on clean main, and `gh run list --branch main` showed main red since 6b405e1a
("Added recordings"), a hand commit that rewrote `web/src/lantern/scenes/act1.mix.json`
(music named for every Act I scene, effect levels retuned).

**Why.** Those tests read the committed mix: one pinned studio-tuned `level` values, and the
others used Act I rooms on the assumption that their mix names no music. Studio output changed,
so the tests broke, though the game was fine (every named track is in the real manifest). The
commit went to main directly, so no CI ran before it landed.

**Cost.** A navigator question, one extra commit of test repairs in a bug-fix PR, and a CI cycle;
any other producer that started after 6b405e1a hit the same red gate.

**Prevent by.** Tests in `web/src/lantern/` and `web/src/composables/` that need a particular mix
set it through the `mixOf` override (as `useActMusic.test.ts` now does) and never assert values
the studio tunes; and studio output reaches main through a pull request, so CI judges it before
the fleet builds on it.

**Seen before.** None found (`grep -rli "mix\|studio" docs/retrospectives/`).

## The script extractor never recorded a description read on look

**What happened.** Changing the shed's arrival line made `retire-orphans` delete the navigator's
recording of the shed's inside description, though the game still narrates it on a look after
unlocking. The review caught it.

**Why.** `actScript` scripted a room's description only on first arrival; a look re-reads
`descriptionFor` as the story has changed it, and those lines (the opened shed, the jammed mill,
the cut vines) were never in any act's script.

**Cost.** A review round, a navigator question, and an extractor change in this PR that added
about 50 unrecorded lines across the four acts' scripts.

**Prevent by.** Fixed in this PR (`tryProbes` in `web/src/lantern/narrationScript.ts` now looks
around at each step). Before running `tts/retire-orphans.ts`, check whether the retired line is
still reachable in the game rather than only absent from the script.

**Seen before.** None found.
