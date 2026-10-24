# rq-dza — retrospective

- **Implementer:** Bishop
- **Date:** 2026-10-25
- **PR:** #558

## A fix to what a room reads went green with the narration script left stale

**What happened.** The fix made rooms compute their text in `descriptionFor()`. The fast gate passed (3370 tests), and CI passed, with `tts/act1/script.json` and `tts/act3/script.json` unchanged. Only the cold review noticed that arrivals are voiced from `GameController.getRoomDescription()`. That meant the Hidden Glade's arrival line and the Act III Antechamber arrival on the golden path had both changed, and both had recordings. After the scripts were regenerated, `narrationCasts.test.ts` went red on the two orphaned clips, which then had to be retired.

**Why.** No test compares the committed `script.json` with what `tts/extract-act.ts` would write now. A stale script is caught only after someone regenerates it.

**Cost.** One extra commit and CI run, plus a by-hand retirement of two clips. Without the review, the glade arrival would have gone out silent and the old clip would have stayed in the manifest.

**Prevent by.** A vitest check per act that runs the extraction in memory and compares it with `tts/act<N>/script.json`, failing when they differ. Or, failing that, a line in `.cerebro/traps.md`: any change to text the game says, room arrivals included, regenerates the act's script with `tts/extract-act.ts`.

**Seen before.** none found
