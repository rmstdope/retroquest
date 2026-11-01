// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import StagePicture from './StagePicture.vue'

describe('StagePicture', () => {
  afterEach(() => vi.useRealTimers())

  it('shows the paper backdrop when the room has no picture', () => {
    const w = mount(StagePicture, { props: { src: '' } })
    expect(w.find('.lq-backdrop').exists()).toBe(true)
    expect(w.find('img.lq-pic').exists()).toBe(false)
  })

  it('keeps the backdrop while the picture loads, then shows it', async () => {
    const w = mount(StagePicture, { props: { src: '/a.png' } })
    expect(w.find('img.lq-pic').exists()).toBe(false)
    await w.get('img.lq-loading').trigger('load')
    expect(w.get('img.lq-pic').attributes('src')).toBe('/a.png')
    expect(w.find('img.lq-loading').exists()).toBe(false)
  })

  it('keeps the backdrop when the picture is not there', async () => {
    const w = mount(StagePicture, { props: { src: '/missing.png' } })
    await w.get('img.lq-loading').trigger('error')
    expect(w.find('img.lq-pic').exists()).toBe(false)
    expect(w.find('img.lq-loading').exists()).toBe(false)
  })

  it('fades the next room in over the old picture, then lets the old one go', async () => {
    vi.useFakeTimers()
    const w = mount(StagePicture, { props: { src: '/a.png' } })
    await w.get('img.lq-loading').trigger('load')
    await w.setProps({ src: '/b.png' })
    await w.get('img.lq-loading').trigger('load')
    expect(w.findAll('img.lq-pic').map((i) => i.attributes('src'))).toEqual([
      '/a.png',
      '/b.png',
    ])
    vi.advanceTimersByTime(400)
    await nextTick()
    expect(w.findAll('img.lq-pic').map((i) => i.attributes('src'))).toEqual([
      '/b.png',
    ])
  })

  it('goes back to the backdrop when the next room has no picture', async () => {
    const w = mount(StagePicture, { props: { src: '/a.png' } })
    await w.get('img.lq-loading').trigger('load')
    await w.setProps({ src: '' })
    expect(w.find('img.lq-pic').exists()).toBe(false)
  })

  it('says whether a picture is shown, or only the backdrop', async () => {
    const w = mount(StagePicture, { props: { src: '/a.png' } })
    await w.get('img.lq-loading').trigger('load')
    expect(w.emitted('pictured')?.at(-1)).toEqual([true])
    await w.setProps({ src: '' })
    expect(w.emitted('pictured')?.at(-1)).toEqual([false])
  })

  it('says at once that there is only the backdrop', () => {
    const w = mount(StagePicture, { props: { src: '' } })
    expect(w.emitted('pictured')?.at(-1)).toEqual([false])
  })

  it('is decorative', () => {
    const w = mount(StagePicture, { props: { src: '' } })
    expect(w.attributes('aria-hidden')).toBe('true')
  })
})
