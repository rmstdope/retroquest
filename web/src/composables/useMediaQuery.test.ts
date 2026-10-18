// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest'
import { effectScope } from 'vue'
import { useMediaQuery, WIDE_QUERY, SHORT_QUERY } from './useMediaQuery'

function fakeMatchMedia(initial: boolean) {
  const listeners: Array<(e: { matches: boolean }) => void> = []
  const query = {
    matches: initial,
    addEventListener: (_: string, fn: (e: { matches: boolean }) => void) =>
      listeners.push(fn),
    removeEventListener: vi.fn(),
  }
  const matchMedia = vi.fn(() => query)
  vi.stubGlobal('matchMedia', matchMedia)
  return {
    change(matches: boolean) {
      query.matches = matches
      listeners.forEach((fn) => fn({ matches }))
    },
    query,
    matchMedia,
  }
}

describe('useMediaQuery', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('uses the laptop layout from 1024 × 560', () => {
    expect(WIDE_QUERY).toBe('(min-width: 1024px) and (min-height: 560px)')
  })

  it('treats a screen under 520px tall as short (phone landscape)', () => {
    expect(SHORT_QUERY).toBe('(max-height: 519px)')
  })

  it('follows the query until its scope ends', () => {
    const media = fakeMatchMedia(true)
    const scope = effectScope()
    const matches = scope.run(() => useMediaQuery('(min-width: 1px)'))!

    expect(media.matchMedia).toHaveBeenCalledWith('(min-width: 1px)')
    expect(matches.value).toBe(true)
    media.change(false)
    expect(matches.value).toBe(false)
    scope.stop()
    expect(media.query.removeEventListener).toHaveBeenCalled()
  })

  it('does not match when the browser cannot tell', () => {
    vi.stubGlobal('matchMedia', undefined)
    const scope = effectScope()
    expect(scope.run(() => useMediaQuery(WIDE_QUERY))!.value).toBe(false)
    scope.stop()
  })
})
