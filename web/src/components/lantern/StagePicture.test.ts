// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { SCENE_HALF_MS, useSceneStore } from '@/stores/useSceneStore'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import StagePicture from './StagePicture.vue'

describe('StagePicture', () => {
  beforeEach(() => setActivePinia(createPinia()))
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

describe('StagePicture during a change of scene', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('keeps the old picture under the veil, then puts the new one in place in the dark', async () => {
    const scene = useSceneStore()
    const w = mount(StagePicture, { props: { src: '/a.png' } })
    await w.get('img.lq-loading').trigger('load')
    expect(scene.shown).toBe('/a.png')
    scene.begin(1, '/b.png', () => {})
    await w.setProps({ src: '/b.png' })
    await w.get('img.lq-loading').trigger('load')
    expect(w.classes()).toContain('lq-scene-out')
    expect(w.findAll('img.lq-pic').map((i) => i.attributes('src'))).toEqual([
      '/a.png',
    ])
    vi.advanceTimersByTime(SCENE_HALF_MS)
    await nextTick()
    expect(w.classes()).toContain('lq-scene-in')
    expect(w.findAll('img.lq-pic').map((i) => i.attributes('src'))).toEqual([
      '/b.png',
    ])
    vi.advanceTimersByTime(SCENE_HALF_MS)
    await nextTick()
    expect(scene.shown).toBe('/b.png')
  })

  it('reports a missing picture and rises as the backdrop', async () => {
    const scene = useSceneStore()
    const w = mount(StagePicture, { props: { src: '/a.png' } })
    await w.get('img.lq-loading').trigger('load')
    scene.begin(1, '/gone.png', () => {})
    await w.setProps({ src: '/gone.png' })
    await w.get('img.lq-loading').trigger('error')
    vi.advanceTimersByTime(SCENE_HALF_MS)
    await nextTick()
    expect(w.find('img.lq-pic').exists()).toBe(false)
    expect(scene.target).toBe('')
  })

  it('fades to the backdrop when the next room has no picture', async () => {
    const scene = useSceneStore()
    const w = mount(StagePicture, { props: { src: '/a.png' } })
    await w.get('img.lq-loading').trigger('load')
    scene.begin(1, '', () => {})
    await w.setProps({ src: '' })
    expect(w.find('img.lq-pic').exists()).toBe(true)
    vi.advanceTimersByTime(SCENE_HALF_MS)
    await nextTick()
    expect(w.find('img.lq-pic').exists()).toBe(false)
  })
})
