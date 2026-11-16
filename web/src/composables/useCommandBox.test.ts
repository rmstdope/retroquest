// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { effectScope, nextTick, ref, type EffectScope } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useCommandBox } from './useCommandBox'
import { useGameStore } from '@/stores/useGameStore'

function f1(): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key: 'F1',
    bubbles: true,
    cancelable: true,
  })
  window.dispatchEvent(event)
  return event
}

describe('useCommandBox', () => {
  let scope: EffectScope
  const canType = ref(true)

  beforeEach(() => {
    setActivePinia(createPinia())
    canType.value = true
    scope = effectScope()
  })
  afterEach(() => scope.stop())
  const make = (blocked: () => boolean = () => false) =>
    scope.run(() => useCommandBox(canType, blocked))!

  it('starts hidden', () => {
    expect(make().open.value).toBe(false)
  })

  it('F1 brings it up and F1 again hides it, and never opens the browser help', () => {
    const box = make()
    const first = f1()
    expect(box.open.value).toBe(true)
    expect(first.defaultPrevented).toBe(true)
    f1()
    expect(box.open.value).toBe(false)
  })

  it('does nothing on a phone, where there is no box', () => {
    canType.value = false
    const box = make()
    const event = f1()
    expect(box.open.value).toBe(false)
    expect(event.defaultPrevented).toBe(false)
  })

  it('goes away when the screen becomes a phone', async () => {
    const box = make()
    f1()
    canType.value = false
    await nextTick()
    expect(box.open.value).toBe(false)
  })

  it('is hidden again whenever a game begins, but hidden again at a restart; the box is not tied to loads, so a load leaves it as it was', async () => {
    const game = useGameStore()
    const box = make()
    f1()
    game.gameNumber++
    await nextTick()
    expect(box.open.value).toBe(false)
    f1()
    await nextTick()
    expect(box.open.value).toBe(true)
  })

  it('leaves F1 alone while the title page, a pop-up or a dialog is up', () => {
    let blocked = true
    const box = make(() => blocked)
    const event = f1()
    expect(box.open.value).toBe(false)
    expect(event.defaultPrevented).toBe(false)
    blocked = false
    f1()
    expect(box.open.value).toBe(true)
  })

  it('hide puts it away', () => {
    const box = make()
    f1()
    box.hide()
    expect(box.open.value).toBe(false)
  })
})
