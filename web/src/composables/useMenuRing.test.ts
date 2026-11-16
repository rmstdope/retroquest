// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'

const move = vi.fn()
const choose = vi.fn()
vi.mock('./useUiSounds', () => ({
  useUiSounds: () => ({ playMove: move, playChoose: choose }),
}))

import { useMenuRing } from './useMenuRing'

function dialog(): HTMLElement {
  const root = document.createElement('div')
  root.innerHTML =
    '<button id="x">x</button><div class="stop" tabindex="-1" id="a"><button id="a1">1</button></div><div class="stop" tabindex="-1" id="b"></div>'
  document.body.append(root)
  return root
}

function focusIn(
  root: HTMLElement,
  target: string,
  from: Element | null,
  ring: ReturnType<typeof useMenuRing>,
): void {
  const event = new FocusEvent('focusin', {
    relatedTarget: from,
    bubbles: true,
  })
  Object.defineProperty(event, 'target', { value: root.querySelector(target) })
  Object.defineProperty(event, 'currentTarget', { value: root })
  ring.onFocusIn(event)
}

describe('useMenuRing', () => {
  beforeEach(() => {
    move.mockClear()
    choose.mockClear()
    document.body.innerHTML = ''
  })

  it('tings when the ring moves to another stop inside the dialog', () => {
    const ring = useMenuRing('.stop')
    const root = dialog()
    focusIn(root, '#b', root.querySelector('#a'), ring)
    expect(move).toHaveBeenCalledTimes(1)
    focusIn(root, '#a1', root.querySelector('#x'), ring)
    expect(move).toHaveBeenCalledTimes(2)
  })

  it('is silent on arrival, within one stop, and onto a non-stop', () => {
    const ring = useMenuRing('.stop')
    const root = dialog()
    focusIn(root, '#a', null, ring)
    focusIn(root, '#a1', root.querySelector('#a'), ring)
    focusIn(root, '#x', root.querySelector('#a'), ring)
    focusIn(root, '#a', document.body, ring)
    expect(move).not.toHaveBeenCalled()
  })

  /** A pointer event over a stop, at a screen position. */
  function over(stop: Element | null, x: number, y: number): MouseEvent {
    return {
      currentTarget: stop,
      screenX: x,
      screenY: y,
    } as unknown as MouseEvent
  }

  /** A pointer move as the browser delivers it: the stop first, then the dialog. */
  function pointer(
    ring: ReturnType<typeof useMenuRing>,
    stop: Element | null,
    x: number,
    y: number,
  ): void {
    if (stop) ring.onHover(over(stop, x, y))
    ring.track(over(null, x, y))
  }

  it('a pointer that moves over a stop rings it, unless focus is already inside', () => {
    const ring = useMenuRing('.stop')
    const root = dialog()
    const a = root.querySelector<HTMLElement>('#a')!
    const b = root.querySelector<HTMLElement>('#b')!
    pointer(ring, b, 10, 10)
    pointer(ring, b, 13, 10)
    expect(document.activeElement).toBe(b)
    root.querySelector<HTMLElement>('#a1')!.focus()
    pointer(ring, a, 20, 10)
    expect(document.activeElement?.id).toBe('a1')
  })

  it('a pointer that only rests while the list scrolls does not take the ring', () => {
    const ring = useMenuRing('.stop')
    const root = dialog()
    pointer(ring, root.querySelector('#a'), 10, 10)
    pointer(ring, root.querySelector('#b'), 10, 10)
    expect(document.activeElement?.id).not.toBe('b')
  })

  it('a pointer resting on something that is not a stop does not take the ring when a stop scrolls under it', () => {
    const ring = useMenuRing('.stop')
    const root = dialog()
    pointer(ring, root.querySelector('#a'), 10, 10)
    pointer(ring, null, 40, 40)
    pointer(ring, root.querySelector('#b'), 40, 40)
    expect(document.activeElement?.id).not.toBe('b')
  })

  it('hovering does not scroll the list', () => {
    const ring = useMenuRing('.stop')
    const root = dialog()
    const b = root.querySelector<HTMLElement>('#b')!
    b.scrollIntoView = vi.fn()
    pointer(ring, b, 1, 1)
    pointer(ring, b, 3, 3)
    expect(b.scrollIntoView).not.toHaveBeenCalled()
  })

  it('a choice hushes the ting that its own focus move would make', () => {
    const ring = useMenuRing('.stop')
    const root = dialog()
    ring.choose()
    focusIn(root, '#b', root.querySelector('#a'), ring)
    expect(move).not.toHaveBeenCalled()
    vi.useFakeTimers()
    vi.setSystemTime(Date.now() + 1000)
    focusIn(root, '#a', root.querySelector('#b'), ring)
    vi.useRealTimers()
    expect(move).toHaveBeenCalledTimes(1)
  })

  it('plays the latch for a choice', () => {
    useMenuRing('.stop').choose()
    expect(choose).toHaveBeenCalledOnce()
  })

  it('brings a stop reached by keyboard whole into view, a pointer one not', () => {
    const ring = useMenuRing('.stop')
    const root = dialog()
    const stop = root.querySelector<HTMLElement>('#b')!
    const scroll = vi.fn()
    stop.scrollIntoView = scroll
    const matches = vi.spyOn(stop, 'matches')
    matches.mockReturnValue(false)
    focusIn(root, '#b', root.querySelector('#a'), ring)
    expect(scroll).not.toHaveBeenCalled()
    matches.mockReturnValue(true)
    focusIn(root, '#b', root.querySelector('#a'), ring)
    expect(scroll).toHaveBeenCalledWith({ block: 'nearest' })
  })
})
