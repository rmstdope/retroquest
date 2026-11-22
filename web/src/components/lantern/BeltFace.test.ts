// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { setPictureProbe } from '@/lantern/roomPicture'
import BeltFace from './BeltFace.vue'

describe('BeltFace', () => {
  let w: VueWrapper | undefined
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    w?.unmount()
    setPictureProbe(null)
    document.documentElement.style.removeProperty('--lq-motion')
    vi.useRealTimers()
  })

  /** Mounts a face of `name`, with every picture made unless `made` says which. */
  async function face(
    name: string,
    fade: boolean,
    made: (url: string) => boolean = () => true,
  ): Promise<VueWrapper> {
    setPictureProbe((url) => Promise.resolve(made(url)))
    w = mount(BeltFace, {
      props: { kind: 'item', name, pictureClass: 'pic', fade },
      slots: { default: '<span class="letter">L</span>' },
    })
    await flushPromises()
    return w
  }

  it('shows the letter until the picture is made, then the picture', async () => {
    const belt = await face('lantern', false, () => false)
    expect(belt.find('img').exists()).toBe(false)
    expect(belt.find('.letter').exists()).toBe(true)
  })

  it('shows the state picture at once, with no fade, when mounted', async () => {
    const belt = await face('lantern (lit)', true)
    expect(belt.findAll('img')).toHaveLength(1)
    expect(belt.get('img').attributes('src')).toMatch(/item-lantern-lit\.png$/)
    expect(belt.emitted('changed')).toBeUndefined()
  })

  it('cross-fades from the old picture to the new at a change, once', async () => {
    const belt = await face('lantern', true)
    await belt.setProps({ name: 'lantern (lit)' })
    await flushPromises()
    const pictures = belt.findAll('img')
    expect(pictures).toHaveLength(2)
    expect(pictures[0]?.attributes('src')).toMatch(/item-lantern\.png$/)
    expect(pictures[1]?.attributes('src')).toMatch(/item-lantern-lit\.png$/)
    expect(belt.emitted('changed')).toHaveLength(1)
    vi.advanceTimersByTime(600)
    await flushPromises()
    expect(belt.findAll('img')).toHaveLength(1)
    expect(belt.get('img').attributes('src')).toMatch(/item-lantern-lit\.png$/)
  })

  it('fades back when the state ends', async () => {
    const belt = await face('bucket (full)', true)
    await belt.setProps({ name: 'bucket' })
    await flushPromises()
    expect(belt.findAll('img')).toHaveLength(2)
    expect(belt.emitted('changed')).toHaveLength(1)
  })

  it('does nothing at a change while the state picture is not made', async () => {
    const belt = await face('lantern', true, (url) => !url.includes('-lit'))
    await belt.setProps({ name: 'lantern (lit)' })
    await flushPromises()
    expect(belt.findAll('img')).toHaveLength(1)
    expect(belt.emitted('changed')).toBeUndefined()
  })

  it('swaps with no fade where the face is not asked to fade', async () => {
    const belt = await face('lantern', false)
    await belt.setProps({ name: 'lantern (lit)' })
    await flushPromises()
    expect(belt.findAll('img')).toHaveLength(1)
    expect(belt.get('img').attributes('src')).toMatch(/item-lantern-lit\.png$/)
    expect(belt.emitted('changed')).toBeUndefined()
  })

  it('swaps instantly when the player wants less motion', async () => {
    document.documentElement.style.setProperty('--lq-motion', '0')
    const belt = await face('lantern', true)
    await belt.setProps({ name: 'lantern (lit)' })
    await flushPromises()
    expect(belt.findAll('img')).toHaveLength(1)
    expect(belt.emitted('changed')).toBeUndefined()
  })
})
