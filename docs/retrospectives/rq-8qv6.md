# rq-8qv6 — main was red from a studio edit that a test pins word for word

## What happened

The fast gate failed in `web/src/lantern/imageStyle.test.ts`, which has nothing to do with the bug.
Main had been red since 2987250d ("Added content"): Content Studio added ", in a fantasy setting"
to every act's mood in `content-studio/images/edits.json`, and the test still expected the old
wording, word for word. CI on main had failed on both "Added content" pushes.

## Why

`imageStyle.test.ts` pins the exact mood strings, which belong to the navigator and change in the
studio. A studio save goes straight to main with no PR, so nothing runs the tests before it lands.

## Cost

One question to the navigator before the PR could be opened, and an extra, unrelated commit in a
bug-fix PR. Every builder that started while main was red would have hit the same thing.

## Prevent by

`web/src/lantern/imageStyle.test.ts`, *gives every act its agreed mood of light and colour*: check
that each act has a non-empty mood, not its exact words. The wording is the navigator's to change
in the studio. Or have the studio run that suite before it commits.

## Seen before

No earlier retrospective mentions `edits.json` or `imageStyle`.
