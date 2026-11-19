# rq-v29l.6 — retrospective

- **Implementer:** Bishop
- **Date:** 2026-11-20
- **PR:** #1305

## An unrelated e2e check went red because it relied on a stray ring press

**What happened.** The fast gate and the ring and belt specs were green locally. In CI, web-e2e shard 2 failed on `e2e/noSelection.spec.ts` › "the picture, the interface and the story cannot be selected": it waited for `.lq-block-text` in the Journal drawer and found none. Main passed the same check, so it was not a flake.

**Why.** `expectUnselectable` clicks the picture once, twice and three times at a single spot 12px below its top. On main, the first click opens a ring that slides down, and its top button lands under that spot, so the second click pressed it and sent a command. That command's answer was the only turn whose text carries `.lq-block-text`. This bead stops a ring from putting a button on the spot pressed, so the command was never sent. I found it by bisecting: reverting `PressRing.vue` and `pressRing.ts` alone made the check pass.

**Cost.** One CI fix attempt and about 40 minutes of local bisecting, including two `update-branch` round trips while main moved.

**Prevent by.** In `web/e2e/`, a spec that presses the picture for some other reason (selection, focus, hurrying words) must not then assert on story content without producing that content itself, by typing a command, as `enterCommand(page, 'look')` does. Before opening the PR, a bead that changes `ringLayout` or `PressRing` should run every spec that clicks `.lq-stage-picture` (`grep -l "lq-stage-picture" web/e2e/*.ts`), not just the ring and belt specs.

**Seen before.** rq-6koz (e2e fixtures relied on a stray Enter pressing a verb).
