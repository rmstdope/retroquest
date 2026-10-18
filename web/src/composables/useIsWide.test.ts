// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest'
import { effectScope } from 'vue'
import { useIsWide, WIDE_QUERY } from './useIsWide'

function fakeMatchMedia(initial: boolean) {
  const listeners: Array<(e: { matches: boolean }) => void> = []
  const query = {
    matches: initial,
    addEventListener: (_: string, fn: (e: { matches: boolean }) => void) =>
      listeners.push(fn),
    removeEventListener: vi.fn(),
  }
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => query),
  )
  return {
    change(matches: boolean) {
      query.matches = matches
      listeners.forEach((fn) => fn({ matches }))
    },
    query,
  }
}

describe('useIsWide', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('asks for at least 1024px', () => {
    expect(WIDE_QUERY).toBe('(min-width: 1024px)')
  })

  it('follows the window width', () => {
    const media = fakeMatchMedia(true)
    const scope = effectScope()
    const wide = scope.run(() => useIsWide())!

    expect(wide.value).toBe(true)
    media.change(false)
    expect(wide.value).toBe(false)
    scope.stop()
    expect(media.query.removeEventListener).toHaveBeenCalled()
  })

  it('is narrow when the browser cannot tell', () => {
    vi.stubGlobal('matchMedia', undefined)
    const scope = effectScope()
    expect(scope.run(() => useIsWide())!.value).toBe(false)
    scope.stop()
  })
})
