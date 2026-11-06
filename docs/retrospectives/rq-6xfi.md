# rq-6xfi — retrospective

- **Implementer:** Shadowcat
- **Date:** 2026-11-06
- **PR:** #924

## A branch in branches.json played to nobody, and the priest's and merchant's lines silently never reached the script

**What happened.** After I changed the priest's unknown-word line and regenerated `tts/act1/script.json`, neither the new line nor the old one was in the script. The rq-4429 branches `{"after": 81, … "say zork to priest"}` and `{"after": 155, … "say zork to merchant"}` play at golden-path steps where the current room is the Forest Path and somewhere past the Road to Greendale. Neither character is present at those steps, so each `say` got the engine's "no one here" answer, and the extractor wrote nothing for the two characters. `narrationScriptFresh` stayed green, because it only compares the committed file with what the extractor produces now.

**Why.** Nothing checks that a branch's commands reach the character or item they name. An `after` index chosen by hand, or one shifted by a later golden-path change, fails silently.

**Cost.** About ten minutes. I wrote a throwaway probe that played the golden path and logged the room and characters at each step, then moved the two branches to steps 89 and 137. The priest's and merchant's rq-4429 lines had been missing from the recording script since that merge.

**Prevent by.** `tts/actScripts.ts` (`actScript`, where branches are played) could fail extraction when a branch command's answer is the parser's "not here" or "no such character" text, naming the branch and its `after`. Alternatively, `narrationScriptFresh.test.ts` could assert that every branch adds at least one line that is not already in the golden-path script.

**Seen before.** none found (rq-modz is a stale script from a concurrent PR, not a branch that plays to nobody).
