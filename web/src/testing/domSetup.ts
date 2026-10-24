/**
 * Vitest setup: gives jsdom the layout API it lacks. jsdom does no layout, so
 * `Range.getClientRects` is missing; an empty list ("no boxes") is the honest
 * answer and lets components that measure text run under test.
 */
if (typeof Range !== 'undefined' && !Range.prototype.getClientRects) {
  Range.prototype.getClientRects = (): DOMRectList =>
    [] as unknown as DOMRectList
}
