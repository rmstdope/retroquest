// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { effectScope } from 'vue'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useReducedMotion } from './useReducedMotion'

/** Stand in for the device: `matches` is whether it asks for less motion. */
function device(matches: boolean): { change(next: boolean): void } {
  const listeners: Array<(e: { matches: boolean }) => void> = []
  const query = {
    matches,
    addEventListener: (_: string, fn: (e: { matches: boolean }) => void) =>
      listeners.push(fn),
    removeEventListener: vi.fn(),
  }
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => query),
  )
  return {
    change(next) {
      listeners.forEach((fn) => fn({ matches: next }))
    },
  }
}

describe('useReducedMotion', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.unstubAllGlobals())

  it('follows the device while the setting follows the device', () => {
    const phone = device(true)
    const reduced = effectScope().run(() => useReducedMotion())!
    expect(reduced.value).toBe(true)
    phone.change(false)
    expect(reduced.value).toBe(false)
  })

  it('is what the player chose, whatever the device says', () => {
    device(true)
    const settings = useSettingsStore()
    const reduced = effectScope().run(() => useReducedMotion())!
    settings.reduceMotion = 'off'
    expect(reduced.value).toBe(false)
    settings.reduceMotion = 'on'
    expect(reduced.value).toBe(true)
  })
})
