# rq-tffa.2: a capture-phase handler that changed state lost the first typed character

## What happened

`LanternLayout.vue` cleared the arrival on the picture with `@input.capture` on the action composer. In jsdom the layout tests were green (a command typed through `setValue` went through). In Chrome, `redLine.spec.ts` failed: the first `fill()` of the command box came back empty and the command was never sent.

## Why

On a native event the browser runs a microtask checkpoint after each listener. The capture listener changed a store, Vue flushed its render before the box's own `v-model` listener had read `el.value`, and the render wrote the old (empty) bound value back into the input. jsdom's scripted `dispatchEvent` keeps the stack non-empty, so microtasks never ran between listeners there.

## Cost

About an hour: the e2e failure looked like a debug-script race (the last turn was the old command), and a second attempt at the same text worked.

## Prevent by

A reactive change on an ancestor must listen in the bubbling phase (`@input`, not `@input.capture`) so the field's own `v-model` has read first. `web/e2e/arrival.spec.ts` ("clears when the player types, and keeps what was typed") types with real key presses into a box while an arrival is up.

## Seen before

Nothing like it yet.
