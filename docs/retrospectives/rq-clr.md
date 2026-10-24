# rq-clr — a bug bead's acceptance contradicted three agreed experiences

## What happened

Psylocke filed rq-clr while verifying rq-a0t, at bb1aa2c4. Its acceptance was: "when an item has its own pickup line, taking it shows only that line". The fix was built to that acceptance. The cold review then found that rq-xud.2, rq-xud.4 and rq-xud.5, all closed and agreed, say the opposite: a grey, silent "You take the X." marker, followed by the item's line, read aloud. The report also quoted lines that rq-xud.5 had already removed by the time the fix was built. The navigator had to settle the conflict in the review phase, and chose the bead's acceptance.

## Why

A bug bead never goes through UX. Nothing between the verifier filing it and the bugfixer building it compares its expected behaviour with the agreed experiences of beads already closed on the same surface. The bugfixer read `design/Voice.md`, which said too little to show the conflict. It did not read the closed rq-xud acceptances.

## Cost

One review round turned into a navigator question after the fix was built and the PR was open. If the navigator had chosen the agreed marker instead, the fix and its tests would have been redone.

## Prevent by

In `skills/fix-bug` contract step 1, before choosing the test, find the closed beads whose agreed experience covers the same text or surface, for example `bd search` on the quoted line or on the engine message, and compare their acceptance with the bug bead's expected behaviour. If they conflict, ask the navigator in the design phase, before building.

## Seen before

Nothing like it in `docs/retrospectives/`.
