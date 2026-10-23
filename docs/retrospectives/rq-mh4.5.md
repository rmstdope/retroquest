# rq-mh4.5

## A Fish disconnect killed a recording run, and the audio PR is too big for `gh pr diff`

**What happened.** `narrate.py` died mid-act twice on `RemoteProtocolError: Server disconnected` (Act II after ~118 lines, Act III after ~157); the shell loop moved on and the failure was only visible in the log. Separately, `gh pr diff` refused the PR (HTTP 406, over 300 files, ~800 MP3 clips), so the reviewer needed a hand-made diff without the audio.

**Why.** `_synthesise` had no retry; Act I's 236 lines never hit a drop. A recorded-audio PR has one file per line.

**Cost.** About 20 minutes of recording re-run, and a reviewer brief that had to point at a local diff file.

**Prevent by.** `narrate.py` now retries a dropped connection (done in this PR). For the diff: a producer opening an audio PR gives the reviewer `git diff origin/main...HEAD -- . ':!web/public/audio/narration/*/*.mp3'` in a file (step to add to `produce-bead`'s review section).

**Seen before.** Nothing like it yet.
