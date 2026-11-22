# rq-zfes

## An arrival spec failed once in CI, green locally

**What happened**: `web-e2e (1/3)` failed `arrival.spec.ts:351` ("keeps a speaker's quote on the page…", `.lq-arrival-card` count 0 for 15 s) on both tries of PR #1362, which only changes bag picture CSS. Run alone locally it passed, and the full local suite passed (259). One re-run of the failed job went green.

**Why**: not established (timing in the shared CI runner is the guess; nothing in the diff touches the arrival).

**Cost**: one re-run, about 10 minutes.

**Prevent by**: not established; if it recurs, give that spec a look at how it waits for the card.

**Seen before**: nothing like it yet.

## An e2e guard for the 256px bug could not be made to fail

**What happened**: the review asked for a bounding-box assertion in `e2e/belt.spec.ts` for the verification failure (pictures at natural size). Against the old rules it still passed, because the one-item cottage bag does not show the overflow (it appeared with eight items). It was dropped; only the source-level test guards the fix.

**Why**: the e2e suite has no state with several bag items on a painted belt.

**Cost**: about 15 minutes.

**Prevent by**: an e2e that fills the bag (e.g. the Village Well state) and checks `img.lq-belt-face` width, written against the old rules to see it fail.

**Seen before**: nothing like it yet.
