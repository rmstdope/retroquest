# rq-mh4.1 — retrospective

- **Implementer:** Cyclops
- **Date:** 2026-10-23
- **PR:** #501

## A background `uv run tts/narrate.py act1` failed to spawn after `cd` into the worktree

**What happened.** The full Act I recording ran as a background command: `cd <worktree> && … && uv run -q tts/narrate.py act1`. It exited at once with `error: Failed to spawn: tts/narrate.py … No such file or directory`. The same command run in the foreground in the same shell had worked minutes earlier. A later chained validation step (`cd <worktree> && uv run … tts/test_narrate.py`, run in parallel with other calls) also ran in the wrong directory.
**Why.** Not established. The session's shell directory and the background command's directory disagreed.
**Cost.** Two restarts, about five minutes, and a monitor armed on a run that never started.
**Prevent by.** Give scripts by absolute path in any background or parallel command: `uv run -q <worktree>/tts/narrate.py act1`. `tts/README.md`'s *Recording an act* section could say so.
**Seen before.** None found.

## Recorded clips reported a 48,695-second duration, and correct takes scored as misheard

**What happened.** The first two-line `narrate.py --only` smoke run wrote a manifest duration of 48,695 s for a 3-second clip. After that was fixed, a correctly spoken "Act One" scored 83%. Once the full act was recorded, every line containing "I" lost a word in alignment, so its word timings were interpolated rather than measured.
**Why.** Two causes:
- Fish streams its WAV, so the header's data length is a placeholder. Counting frames from the header (and copying it into the joined file's header) was wrong.
- The pronunciation "Act I:" → "Act One:" had been turned into a word alias "i" → "one" that applied to every "I".

A third cause appeared along the way: Whisper writes spoken numbers as digits ("1").
**Cost.** Two `--retime` passes over all 236 clips, about 20 minutes, and one re-recorded clip.
**Prevent by.** All three are now pinned in `tts/test_narrate.py`:
- `_join` measures the audio it read;
- pronunciations apply per phrase (`said_words`);
- number words match their digits.

For future acts: run `narrate.py --only` on two lines (one with a pronunciation) and inspect the manifest before a full recording.
**Seen before.** None found.

## The listening page the navigator was asked to use played nothing

**What happened.** The page built to let the navigator hear a sample of clips with the word highlight showed no sound when ▶ was pressed, twice:
- first, a stray `)` in its script left the buttons unwired;
- then its `file://` audio URLs pointed into another folder, which the navigator's browser would not load.

A headless check with an autoplay flag had passed both times.
**Cost.** Two round trips with the navigator.
**Prevent by.** For any listening or viewing check handed to the navigator, put the media beside the page and reference it relatively. Verify with a headless run without browser flags and with a page-error listener before sending the link.
**Seen before.** None found.

## The golden path stops one command short of completing the act

**What happened.** The script builder never reached the act-complete chapter page. The act still reported itself running after all of `ACT1_GOLDEN_PATH`.
**Why.** By design the golden path ends on the Road to Greendale, and `use map` completes the act. That fact lived only in the array's doc comment, and the integration test runs it separately.
**Cost.** About ten minutes of tracing the run state.
**Prevent by.** Done in this PR: `ACT1_COMPLETING_COMMAND` is exported beside `ACT1_GOLDEN_PATH`. Each act's golden path file should export its completing command the same way when its narration is recorded (rq-mh4.5).
**Seen before.** None found.
