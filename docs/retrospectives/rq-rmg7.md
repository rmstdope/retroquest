# rq-rmg7: green unit suite, red e2e from a ResizeObserver loop

## What happened
Widening the layer's ResizeObserver from the panels to every marked element (first every obstacle, then panels plus keep-clear) kept all 6450 unit tests green. CI's e2e `cardEnd.spec.ts` failed with "ResizeObserver loop completed with undelivered notifications". It reproduced locally in that one spec.

## Why
The composer (keep-clear) changes size as a result of the layout, so observing it made `measure()` run inside the observer's own frame. jsdom has no ResizeObserver behaviour, so no unit test could see it.

## Cost
One CI round and one fix commit.

## Prevent by
Run the e2e specs that watch the console (`cardEnd.spec.ts`) before the PR whenever an observer's target set changes; the plan's validation named only areaNames, namesTab and hideWords.

## Seen before
Not established.
