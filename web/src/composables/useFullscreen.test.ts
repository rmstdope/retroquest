// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest'
import { effectScope } from 'vue'
import { useFullscreen } from './useFullscreen'

function browser(enabled: boolean) {
  Object.defineProperty(document, 'fullscreenEnabled', {
    configurable: true,
    value: enabled,
  })
  let element: Element | null = null
  Object.defineProperty(document, 'fullscreenElement', {
    configurable: true,
    get: () => element,
  })
  const enter = vi.fn(() => {
    element = document.documentElement
    document.dispatchEvent(new Event('fullscreenchange'))
    return Promise.resolve()
  })
  const exit = vi.fn(() => {
    element = null
    document.dispatchEvent(new Event('fullscreenchange'))
    return Promise.resolve()
  })
  document.documentElement.requestFullscreen = enter
  document.exitFullscreen = exit
  return { enter, exit }
}

describe('useFullscreen', () => {
  let scope = effectScope()
  afterEach(() => {
    scope.stop()
    scope = effectScope()
  })

  it('knows whether the browser can go full screen', () => {
    browser(false)
    expect(scope.run(() => useFullscreen())!.supported).toBe(false)
  })

  it('goes full screen and back', () => {
    const { enter, exit } = browser(true)
    const fullscreen = scope.run(() => useFullscreen())!
    expect(fullscreen.supported).toBe(true)
    expect(fullscreen.active.value).toBe(false)

    fullscreen.toggle()
    expect(enter).toHaveBeenCalledOnce()
    expect(fullscreen.active.value).toBe(true)

    fullscreen.toggle()
    expect(exit).toHaveBeenCalledOnce()
    expect(fullscreen.active.value).toBe(false)
  })
})
