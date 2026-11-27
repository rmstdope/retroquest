# Test architecture

Agreed with the navigator 2026-11-27.

## Unit             web/src/engine/**/*.test.ts, web/src/act<N>/**/*.test.ts (vitest, beside the code; not the Act<N>.integration files)
  Belongs here:    a rule of the engine; what one room, item, character, quest or spell does or says as the game's state changes, driven through the real Game
  Not here:        fixed wording restated word for word; the browser; files on disk; the clock
  Enough is:       every branch of a rule, and every state-dependent answer, once

## Component        web/src/components/**/*.test.ts, web/src/stores/**/*.test.ts, web/src/composables/**/*.test.ts (vitest, jsdom)
  Belongs here:    what a component, store or composable shows or does for a given state, timed behaviour included, on fake timers
  Not here:        layout and real CSS; the stylesheet's or a .vue file's text; the real clock; the engine's rules; a room's or quest's content
  Enough is:       every state and branch once, in the test of the part that owns it

## Integration      web/src/act<N>/Act<N>.integration.test.ts, web/src/act<N>/classes.test.ts
  Belongs here:    an act's golden path from start to finish with its quests joined up; a save and load on the way; every class of the act in its registry
  Not here:        a single room's, item's or character's branches off the golden path; wording
  Enough is:       the golden path once per act, one save/load round trip, the registry once

## Lists and scripts  web/src/lantern/**/*.test.ts, web/*.config.test.ts, deploy/test_container.py
  Belongs here:    the committed lists, scripts and manifests agree with the game and with each other (narration, pictures, music, effects, scenes); what a CI or commit script does; the production image answers
  Not here:        the navigator's own wording or choice of take, picture or mix; that every line or entry has a recording or an image
  Enough is:       each rule about a list once; each script's outcomes once

## System           web/e2e/*.spec.ts (Playwright, on the production build; the dev-only specs on the dev server)
  Belongs here:    one requirement each, named by its ID; and what only a real browser shows: layout at each screen size, real focus, real storage, a reload
  Not here:        text or logic that a unit or component test asserts on the same path; a sleep on the real clock where the browser's clock can be stepped
  Enough is:       every requirement once; each layout rule once per screen size it differs at
