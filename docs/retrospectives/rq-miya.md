# rq-miya — retrospective

- **Implementer:** Gambit
- **Date:** 2026-11-06
- **PR:** #938

## Six new spoken clue lines passed the fast gate without reaching the narration script

**What happened.** The fix added six `clue()` replies, which are read aloud. Running `tts/extract-act.ts 1` left `tts/act1/script.json` unchanged, and I read that as "no script work needed". The fast gate went green: `narrationScriptFresh.test.ts` passed because the script matched what the extractor writes. The review sub-agent then flagged that none of the six lines were in the script. They only get in through `{after, commands}` entries in `tts/act1/branches.json`, with their openings added to `OPTIONAL_LINES` in `web/src/lantern/narrationCoverage.test.ts`, as rq-uvlg did.

**Why.** The extractor plays only the golden path and the listed branches. A reply to a try that is off that path is never played, so the script stays "fresh" without it. No test checks that every `clue()` line in an act's source appears in its script.

**Cost.** A second commit after review, with seven branches, a regeneration and the coverage list. It also meant probing golden-path indices to find a state where each try is reachable, and another round of the fast gate and CI.

**Prevent by.** One of these:
- A trap in `.cerebro/traps.md`: "A new spoken line off the golden path needs a branch in `tts/act<N>/branches.json` and an `OPTIONAL_LINES` entry; an unchanged script after `extract-act` does not mean the line is in it."
- A vitest check that every `clue(...)` literal under `web/src/act<N>/` appears in `tts/act<N>/script.json`.

**Seen before.** `docs/retrospectives/rq-modz.md` touches the same files, but there the script went stale through a parallel merge. This is a new line never reaching the script at all.
