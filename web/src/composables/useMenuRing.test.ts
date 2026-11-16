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

  it('a pointer entering a stop rings it, unless focus is already inside', () => {
    const ring = useMenuRing('.stop')
    const root = dialog()
    const a = root.querySelector<HTMLElement>('#a')!
    const b = root.querySelector<HTMLElement>('#b')!
    ring.onHover({ currentTarget: b } as unknown as MouseEvent)
    expect(document.activeElement).toBe(b)
    root.querySelector<HTMLElement>('#a1')!.focus()
    ring.onHover({ currentTarget: a } as unknown as MouseEvent)
    expect(document.activeElement?.id).toBe('a1')
  })

  it('plays the latch for a choice', () => {
    useMenuRing('.stop').choose()
    expect(choose).toHaveBeenCalledOnce()
  })
})
