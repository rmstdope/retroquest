# rq-s8li: Playwright specs red in CI after a local run that looked green

## What happened
Rewording the Dream and the cottage left Playwright specs red in CI (old Dream sentences, "The dark lets go of you", "Grandmother looks up from the hearth", and three narrator specs that assumed the waking line has a recording). The local full run ended `252 passed` and listed names under it, which I took for a green run; the unit gate (`npm run test`) does not run `web/e2e/`.

## Why
Not established for the local summary. The narrator specs depend on a recorded waking line: with the line new and unrecorded the waking waits for a press, or has already been read by the time the spec looks.

## Cost
One CI round (about 20 minutes) and two extra commits.

## Prevent by
Grep `web/e2e/` for every old sentence of a changed room or line before the first push, and read the whole Playwright summary for a failed or flaky list.

## Seen before
Nothing like it yet.
