# rq-2xos

## The agreed "words, exactly" example contradicted its own rule

**What happened.** The acceptance said only the article and the quoted name change and the rest of
each reply stays word for word, then gave "You don't have a 'useful stone' to use." as shipping
text. The reply in `web/src/engine/Game.ts` ends "to use, and there isn't one here."; the mockup
shows the short form too.

**Why.** Not established. The examples read as written from memory of the replies rather than
copied from the engine's output.

**Cost.** A few minutes deciding which half wins; the producer kept the full reply and listed it
under *Decided by me* and in the PR body.

**Prevent by.** `agree-experience`: a step that copies every "words, exactly" string that changes an
existing line from the source (or a run of the engine) before recording it.

**Seen before.** Nothing like it found in `docs/retrospectives/`.
