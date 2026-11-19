// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { useBeltDrag } from './useBeltDrag'
import { dragHand, type DragOver } from '@/lantern/beltDrag'
import type { BeltPicture } from '@/lantern/belt'

const bread: BeltPicture = {
  key: 'item:bread',
  kind: 'item',
  name: 'bread',
  label: 'Bread',
  count: 1,
  note: '',
  letter: 'B',
}
const gran: DragOver = {
  from: 'room',
  name: 'grandmother',
  label: 'Grandmother',
}

function move(x: number, y: number, type = 'mouse'): void {
  const event = new Event('pointermove')
  Object.assign(event, { clientX: x, clientY: y, pointerType: type })
  document.dispatchEvent(event)
}
function up(x: number, y: number): void {
  const event = new Event('pointerup')
  Object.assign(event, { clientX: x, clientY: y, pointerType: 'mouse' })
  document.dispatchEvent(event)
}

function setup(over: DragOver | null = gran) {
  const scope = effectScope()
  const dropped = vi.fn()
  const api = scope.run(() =>
    useBeltDrag({ hitTest: () => over, onEnd: dropped }),
  )!
  return { api, dropped, scope }
}

afterEach(() => document.body.replaceChildren())

describe('useBeltDrag', () => {
  it('is idle until a picture is lifted', () => {
    const { api } = setup()
    expect(api.drag.value).toBeNull()
  })

  it('follows the pointer and says what it is over', () => {
    const { api } = setup()
    api.lift(bread, { x: 10, y: 10, pointerType: 'mouse' })
    expect(api.drag.value?.over).toEqual(gran)
    move(40, 50)
    expect(api.drag.value).toMatchObject({ x: 40, y: 50, over: gran })
  })

  it('sends the command on letting go over a target and stops listening', () => {
    const { api, dropped } = setup()
    api.lift(bread, { x: 0, y: 0, pointerType: 'mouse' })
    up(5, 5)
    expect(dropped).toHaveBeenCalledWith({
      hand: dragHand(bread),
      command: 'use bread with grandmother',
      pocketKey: 'item:bread',
      at: { x: 5, y: 5 },
      pointerType: 'mouse',
    })
    expect(api.drag.value).toBeNull()
    move(9, 9)
    expect(api.drag.value).toBeNull()
  })

  it('ends with no command over nothing', () => {
    const { api, dropped } = setup(null)
    api.lift(bread, { x: 0, y: 0, pointerType: 'mouse' })
    up(5, 5)
    expect(dropped).toHaveBeenCalledWith(
      expect.objectContaining({ command: null }),
    )
  })

  it.each([
    [
      'Escape',
      () =>
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })),
    ],
    ['pointercancel', () => document.dispatchEvent(new Event('pointercancel'))],
    ['blur', () => window.dispatchEvent(new Event('blur'))],
  ])('is a miss on %s', (_name, fire) => {
    const { api, dropped } = setup()
    api.lift(bread, { x: 0, y: 0, pointerType: 'mouse' })
    fire()
    expect(dropped).toHaveBeenCalledWith(
      expect.objectContaining({ command: null }),
    )
    expect(api.drag.value).toBeNull()
  })

  it('cancels on demand, and when its scope stops', () => {
    const { api, dropped, scope } = setup()
    api.lift(bread, { x: 0, y: 0, pointerType: 'mouse' })
    api.cancel()
    expect(dropped).toHaveBeenCalledTimes(1)
    api.lift(bread, { x: 0, y: 0, pointerType: 'mouse' })
    scope.stop()
    move(1, 1)
    up(1, 1)
    expect(dropped).toHaveBeenCalledTimes(1)
  })
})
