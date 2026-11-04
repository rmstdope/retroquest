# rq-modz — retrospective

- **Implementer:** Shadowcat
- **Date:** 2026-11-04
- **PR:** #815

## A regenerated narration script went stale on main with no merge conflict

**What happened.** The fix added a branch to `tts/act1/branches.json` and regenerated `tts/act1/script.json`. The fast gate was green locally. CI then failed on three tests: `narrationCasts` ("casts every speaker", `shopkeeper`), the script freshness test, and the new reproduction test. While the PR was open, #812 (rq-gbf0) gave Hemlock his own voice key, `hemlock` in place of `shopkeeper`, so the seven new lines named a speaker that no longer existed. Git merged both changes cleanly, because the new lines did not overlap any line #812 touched. Only the merged CI run showed that the generated file no longer matched the code.

**Why.** `script.json` is generated from the whole act. Any PR that changes Act 1 text or speakers makes every other open PR's regenerated copy stale, without a textual conflict.

**Cost.** One red CI run (about 8 minutes), a rebase, a regeneration and a second CI run. Main moved again before the merge, so there was a third rebase.

**Prevent by.** In `.claude/skills/produce-bead/SKILL.md` *Merging*, or as a trap in `.cerebro/traps.md`: a PR that commits a generated `tts/act<N>/*.json` rebases onto main and re-runs `tts/extract-act.ts <N>` immediately before the CI wait and again before merging, whenever main touched `web/src/act<N>/` or `tts/act<N>/` in the meantime.

**Seen before.** `docs/retrospectives/rq-dza.md` is related but different: there the script was left stale by the PR itself, before the freshness test existed.
