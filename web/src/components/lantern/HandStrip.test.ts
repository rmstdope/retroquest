// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { setPictureProbe } from '@/lantern/roomPicture'
import { beltPictureUrl } from '@/lantern/beltPicture'
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
  afterEach(() => {
    w?.unmount()
    setPictureProbe(null)
  })

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
    expect(w.attributes('role')).toBe('status')
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

  describe('the copy by the pointer', () => {
    /** Mount with a mouse pointer moved, so the copy shows. */
    async function mountMoved(verb: Hand['verb']): Promise<VueWrapper> {
      const mounted = mount(HandStrip, {
        props: { hand: hand(verb), ghost: true },
        attachTo: document.body,
      })
      const move = new Event('pointermove')
      Object.assign(move, { clientX: 5, clientY: 5, pointerType: 'mouse' })
      document.dispatchEvent(move)
      await flushPromises()
      return mounted
    }

    it('is the picture of the thing in hand once it is painted', async () => {
      setPictureProbe(() => Promise.resolve(true))
      w = await mountMoved('give')
      const img = w.get('.lq-hand-ghost img')
      expect(img.attributes('src')).toBe(beltPictureUrl('item', 'bread'))
      expect(w.get('.lq-hand-ghost').text()).toBe('')
    })

    it('is the picture of the spell in hand once it is painted', async () => {
      setPictureProbe(() => Promise.resolve(true))
      w = await mountMoved('caston')
      expect(w.get('.lq-hand-ghost img').attributes('src')).toBe(
        beltPictureUrl('spell', 'light'),
      )
    })

    it('keeps the letter while the picture is not painted', async () => {
      setPictureProbe(() => Promise.resolve(false))
      w = await mountMoved('give')
      expect(w.find('.lq-hand-ghost img').exists()).toBe(false)
      expect(w.get('.lq-hand-ghost').text()).toBe('B')
    })
  })
})
