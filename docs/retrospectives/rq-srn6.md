# rq-srn6 — retrospective

- **Bead:** rq-srn6 (bugfix)
- **PR:** #946

## A new spoken line reachable only off the golden path stayed out of the script, and every test was green

**What happened.** The fix gave the Hidden Glade a new rest reply for the state where the mill's mechanism still runs. I regenerated `tts/act1/script.json` and the fast gate was green, but the new line was not in the script: the golden path first reaches the glade after the mechanism is jammed, and the only glade-rest branch in `tts/act1/branches.json` runs after that too. `narrationScriptFresh` only compares the committed file with what the extractor produces, so it stayed green. The review sub-agent caught it.

**Why.** Nothing ties a new line in the code to the script. The extractor only records what the golden path and the branches reach, and a line behind a state the path never visits is silently left out. `tts/README.md` also says `branches.json` is for Acts II to IV, but Act I has one, so I did not look for it at first.

**Cost.** One review round: a probe to find a walkable route from Mira's hut to the glade, a new branch after index 46, a regeneration and a second gate run.

**Prevent by.** In `tts/README.md`, under *the script*: say that `act1/branches.json` exists too, and that a change adding a line behind a state the golden path skips adds a branch that reaches it, checked by finding the line in the regenerated `script.json`. A mechanical check could also live in `narrationScriptFresh.test.ts`: every reproduction test's expected `[narration]` line must be in the script. That is broader and less certain.

**Seen before.** `docs/retrospectives/rq-6xfi.md`: there a branch existed but reached nobody; here no branch reached the new state at all.
