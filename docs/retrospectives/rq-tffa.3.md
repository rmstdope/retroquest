# rq-tffa.3 — a jsdom click on a just-rendered element was sometimes ignored

## What happened
Layout tests that clicked a button the moment it rendered (the "▴ Narration" tab, "Hide") failed about one run in three, with the handler never called. I first suspected my own focus code and lost several runs adding traces.

## Why
Vue ignores an event stamped earlier than the moment its listener was attached; jsdom can stamp the event before that. Not proven beyond the traces: the handler was simply not called in the failing runs, and a 15 ms wait before the click removed the failures (8 clean runs).

## Cost
About six test runs and a pushed commit that was red until fixed.

## Prevent by
In a test, wait a moment (a real `setTimeout` of ~15 ms) between an element rendering and a bare `element.click()`; `LanternLayout.paper.test.ts` has the `settle()` helper.

## Seen before
Nothing like it yet.
