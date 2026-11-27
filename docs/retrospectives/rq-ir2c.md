# rq-ir2c — retrospective

- **Implementer:** Storm
- **Date:** 2026-11-27
- **PR:** #1424

## A resting Playwright mouse now holds a card

**What happened.** With cards waiting under the mouse pointer, three specs that passed before failed in the full e2e run: `arrival.spec.ts` (rq-mfb1) and `continue.spec.ts` clicked a card and left the mouse where the next one came up, so it never left; `pressRing.spec.ts` (rq-v29l.6) pressed a thing while the last card was still fading, which is now the card's press.

**Why.** Playwright's mouse stays where the last click put it, in the middle of the picture, where cards are drawn. The specs relied on cards leaving by their own time.

**Cost.** Two further full e2e runs (about 12 minutes each).

**Prevent by.** A note in `web/e2e/fixtures.ts`: after pressing a card, move the mouse off (`page.mouse.move(0, 0)`) before expecting a card to go by itself, and wait for `.lq-arrival-card` to be gone before pressing the picture.

**Seen before.** None found.

## roomMotion.spec.ts:46 failed once in a full local run

**What happened.** `with the device asking for less motion the cottage is just the painting` found no `.lq-stage-picture img.lq-pic-in` in 15 s, once in a full run; 10 of 10 passed run alone, and it passed in the two full runs before.

**Why.** Not established.

**Cost.** A few minutes.

**Prevent by.** A Testing bead on `e2e/roomMotion.spec.ts:46` if it is seen again.

**Seen before.** None found.

## The review packet was too large to paste

**What happened.** `scripts/review-packet` printed 77 KB; the produce-bead skill says to paste it whole into the sub-agent's prompt. The reviewer was given the unedited file's path instead.

**Why.** A prompt is typed out by the producer, so pasting means rewriting some 20,000 tokens with the risk of altering them.

**Cost.** None here.

**Prevent by.** `produce-bead`, *The review loop*: allow the packet to be handed over as the path of the script's unedited output.

**Seen before.** None found.
