// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import HandStrip from './HandStrip.vue'
import type { Hand } from '@/lantern/belt'

const hand = (verb: Hand['verb']): Hand => ({
  kind: verb === 'caston' ? 'spell' : 'item',
  name: verb === 'caston' ? 'light' : 'bread',
  label: verb === 'caston' ? 'Light' : 'Bread',
  verb,
})

describe('HandStrip', () => {
  let w: VueWrapper | undefined
  afterEach(() => w?.unmount())

  it('says what the next press will do, with a ✕ Cancel', () => {
    w = mount(HandStrip, { props: { hand: hand('usewith') } })
    expect(w.get('.lq-hand-text').text()).toBe('Use Bread with…')
    expect(w.get('button').text()).toBe('✕ Cancel')
    w.unmount()
    w = mount(HandStrip, { props: { hand: hand('give') } })
    expect(w.get('.lq-hand-text').text()).toBe('Give Bread to…')
    w.unmount()
    w = mount(HandStrip, { props: { hand: hand('caston') } })
    expect(w.get('.lq-hand-text').text()).toBe('Cast Light on…')
  })

  it('is announced to a screen reader', () => {
    w = mount(HandStrip, { props: { hand: hand('give') } })
    expect(w.get('.lq-hand').attributes('role')).toBe('status')
  })

  it('asks to cancel', async () => {
    w = mount(HandStrip, { props: { hand: hand('give') } })
    await w.get('button').trigger('click')
    expect(w.emitted('cancel')).toHaveLength(1)
  })

  it('has a small copy of the picture ride by the pointer on a laptop', async () => {
    w = mount(HandStrip, {
      props: { hand: hand('give'), ghost: true },
      attachTo: document.body,
    })
    expect(w.find('.lq-hand-ghost').exists()).toBe(false)
    const move = new Event('pointermove')
    Object.assign(move, { clientX: 100, clientY: 50, pointerType: 'mouse' })
    document.dispatchEvent(move)
    await w.vm.$nextTick()
    const ghost = w.get('.lq-hand-ghost')
    expect(ghost.text()).toBe('B')
    expect(ghost.attributes('style')).toContain('left: 112px')
  })

  it('has no copy for touch or when not asked', async () => {
    w = mount(HandStrip, {
      props: { hand: hand('give'), ghost: false },
      attachTo: document.body,
    })
    const move = new Event('pointermove')
    Object.assign(move, { clientX: 1, clientY: 1, pointerType: 'mouse' })
    document.dispatchEvent(move)
    await w.vm.$nextTick()
    expect(w.find('.lq-hand-ghost').exists()).toBe(false)
  })
})
