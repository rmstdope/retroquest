// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import F1Note, { F1_NOTE_MS } from './F1Note.vue'

describe('F1Note', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('says to press F1, with F1 drawn as a key', () => {
    const w = mount(F1Note)
    expect(w.text()).toBe('Press F1 to type commands')
    expect(w.get('kbd').text()).toBe('F1')
    expect(w.attributes('role')).toBe('note')
    w.unmount()
  })

  it('fades after a few seconds', () => {
    const w = mount(F1Note)
    vi.advanceTimersByTime(F1_NOTE_MS - 1)
    expect(w.emitted('done')).toBeUndefined()
    vi.advanceTimersByTime(1)
    expect(w.emitted('done')).toHaveLength(1)
    w.unmount()
  })

  it.each([
    ['pointerdown', new Event('pointerdown')],
    ['keydown', new KeyboardEvent('keydown', { key: 'a' })],
    ['F1', new KeyboardEvent('keydown', { key: 'F1' })],
  ])('goes at the first %s, once', (_name, event) => {
    const w = mount(F1Note)
    window.dispatchEvent(event)
    window.dispatchEvent(new Event('pointerdown'))
    expect(w.emitted('done')).toHaveLength(1)
    w.unmount()
  })
})
