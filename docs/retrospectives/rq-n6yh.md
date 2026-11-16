# rq-n6yh

## What happened
`web-e2e (2/3)` failed twice on a colour-only change: `menuKeys.spec.ts` "Help scrolls with the keys" timed out at the End-key poll on the first attempt and passed on Playwright's retry; `failOnFlakyTests` turns that into a red job. It passed 18 times locally, then failed once in 24 after I added a focus wait, which showed the focus wait was not the cause.

## Why
End scrolls to the body's `scrollHeight` at the moment of the key press; the test pressed it right after shrinking the viewport to 300px, before the layout had settled.

## Cost
One bare re-run, one fix attempt, about 25 minutes.

## Prevent by
In e2e specs, wait for the layout a key depends on (`scrollHeight > clientHeight`) before pressing it, after any `setViewportSize`.

## Seen before
Nothing like it yet.
