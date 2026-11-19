// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import DragGhost from './DragGhost.vue'
import type { Hand } from '@/lantern/belt'

const hand: Hand = {
  kind: 'item',
  name: 'bread',
  label: 'Bread',
  verb: 'usewith',
}
const bounds = { left: 100, top: 50, right: 700, bottom: 450 }

describe('DragGhost', () => {
  let w: VueWrapper | undefined
  const show = (
    props: Partial<InstanceType<typeof DragGhost>['$props']> = {},
  ): VueWrapper =>
    (w = mount(DragGhost, {
      props: {
        hand,
        x: 300,
        y: 200,
        pill: 'Use Bread with…',
        bounds,
        ...props,
      },
      attachTo: document.body,
    }))
  afterEach(() => {
    w?.unmount()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('draws a round copy at the pointer and the pill saying what letting go does', () => {
    show()
    const ghost = w!.get('[data-drag-ghost]')
    expect(ghost.attributes('style')).toContain('left: 300px')
    expect(ghost.attributes('style')).toContain('top: 200px')
    expect(ghost.attributes('aria-hidden')).toBe('true')
    expect(w!.get('[data-drag-pill]').text()).toBe('Use Bread with…')
    expect(w!.get('.lq-drag-letter').text()).toBe('B')
  })

  it('puts the pill under a mouse and above a finger', () => {
    show()
    expect(w!.get('[data-drag-pill]').attributes('style')).toContain('top:')
    w!.unmount()
    show({ touch: true })
    const style = w!.get('[data-drag-pill]').attributes('style')
    expect(style).toContain('bottom:')
    expect(style).not.toContain('top:')
  })

  it('keeps the pill inside the picture at its edges, and one line', async () => {
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(120)
    show({ x: 105 })
    await nextTick()
    // Centred on 105 it would start at 45, left of the picture's 100: it slides in to 108.
    expect(w!.get('[data-drag-pill]').attributes('style')).toContain(
      `left: ${108 - 105}px`,
    )
    await w!.setProps({ x: 698 })
    await nextTick()
    expect(w!.get('[data-drag-pill]').attributes('style')).toContain(
      `left: ${700 - 8 - 120 - 698}px`,
    )
    expect(w!.get('[data-drag-pill]').attributes('style')).toContain(
      'max-width: 584px',
    )
  })

  it('flips the pill to the other side where it would leave the picture', async () => {
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(26)
    show({ y: 440 })
    await nextTick()
    // A mouse near the foot: no room under it (440 + 42 + 26 > 442), so it rides above.
    expect(w!.get('[data-drag-pill]').attributes('style')).toContain('bottom:')
    await w!.setProps({ y: 60, touch: true })
    await nextTick()
    // A finger near the top: no room above it, so the pill rides under.
    expect(w!.get('[data-drag-pill]').attributes('style')).toContain('top:')
  })

  it('glides to the pocket and says done', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('getComputedStyle', () => ({
      getPropertyValue: () => '1',
    }))
    show()
    await w!.setProps({ to: { x: 150, y: 420 } })
    expect(w!.get('[data-drag-ghost]').classes()).toContain('lq-drag-glide')
    expect(w!.get('[data-drag-ghost]').attributes('style')).toContain(
      'left: 150px',
    )
    expect(w!.emitted('done')).toBeUndefined()
    vi.advanceTimersByTime(250)
    expect(w!.emitted('done')).toHaveLength(1)
  })

  it('is back at once under reduced motion', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('getComputedStyle', () => ({
      getPropertyValue: () => '0',
    }))
    show()
    await w!.setProps({ to: { x: 150, y: 420 } })
    expect(w!.get('[data-drag-ghost]').classes()).not.toContain('lq-drag-glide')
    vi.advanceTimersByTime(0)
    expect(w!.emitted('done')).toHaveLength(1)
  })
})
