import { afterEach, beforeEach } from 'vitest'
import { disposePinia, getActivePinia } from 'pinia'
import { createMemoryStorage, setAppStorage } from '@/storage/appStorage'

/**
 * Vitest setup: gives jsdom the layout API it lacks. jsdom does no layout, so
 * `Range.getClientRects` is missing; an empty list ("no boxes") is the honest
 * answer and lets components that measure text run under test.
 */
if (typeof Range !== 'undefined' && !Range.prototype.getClientRects) {
  Range.prototype.getClientRects = (): DOMRectList =>
    [] as unknown as DOMRectList
}

/**
 * Every test starts with an empty in-memory storage behind `appStorage` and
 * hands it back afterwards, so a saved setting never leaks from one test into
 * the next, locally or in CI.
 */
beforeEach(() => setAppStorage(createMemoryStorage()))
afterEach(() => setAppStorage(null))

/**
 * Every test ends with the active pinia disposed, which stops every store's
 * scope and so every timer a store armed: a store callback never fires into a
 * later test.
 */
afterEach(() => {
  const pinia = getActivePinia()
  if (pinia) disposePinia(pinia)
})
