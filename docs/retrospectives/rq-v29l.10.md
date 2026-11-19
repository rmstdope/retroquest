# rq-v29l.10 — retrospective

## A name fading out counted as a cover-up on CI only

**What happened:** `e2e/coverUps.spec.ts` › "no name lies over a bag picture's caption" passed locally (also under `E2E_CPU_THROTTLE=4`) but failed twice on CI: the overlapping "name" was the bread's own, still fading out where it stood after the bread was taken, under the caption that appeared over it.

**Why:** the marks and names leave through a `TransitionGroup` fade, so a name stays in the DOM, at its old place, for the length of the fade after its thing is gone. A geometry check over `[data-area-name]` counts it. On the slower CI runner the caption came up while the fade was still running.

**Cost:** one red CI run (a fix attempt) and a re-run of the e2e job, about 15 minutes.

**Prevent by:** a spec that measures `[data-area-name]` / `[data-area-mark]` boxes right after a thing leaves the room waits for that thing's name to reach count 0 first (as `coverUps.spec.ts` now does), or skips elements in their leave transition.

**Seen before:** nothing like it in `docs/retrospectives/`.

## A flake seen on the way

`e2e/areaNames.spec.ts` › "on the smallest sideways phone › every name stays inside the picture" failed once locally with a null bounding box (a name gone between `all()` and `boundingBox()`), then passed 3/3 on repeat; untouched by this change.
