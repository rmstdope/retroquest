// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import StagePicture from './StagePicture.vue'
import { SCENE_HALF_MS, useSceneStore } from '@/stores/useSceneStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import type { MotionSpec } from '@/lantern/roomMotion'

const DUST: MotionSpec[] = [{ kind: 'dust' }]
const BOX = { x: 0.2, y: 0.2, width: 0.4, height: 0.4 }

describe('StagePicture movement', () => {
  let w: VueWrapper | undefined

  beforeEach(() => {
    globalThis.localStorage?.clear()
    setActivePinia(createPinia())
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  })
  afterEach(() => {
    w?.unmount()
    w = undefined
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  /** A stage with its picture up. */
  async function stage(
    props: Record<string, unknown> = {},
    slots: Record<string, string> = {},
  ): Promise<VueWrapper> {
    w = mount(StagePicture, { props: { src: '/a.png', ...props }, slots })
    await w.get('img.lq-loading').trigger('load')
    await nextTick()
    return w
  }

  it('drifts every picture, one with nothing floating or running too', async () => {
    const stagePic = await stage()
    expect(stagePic.find('.lq-drift.lq-drift-on').exists()).toBe(true)
    expect(stagePic.find('canvas').exists()).toBe(false)
  })

  it('carries the picture, its patches and what is put in the slot in the drift', async () => {
    const stagePic = await stage({}, { default: '<b class="mark">m</b>' })
    const drift = stagePic.get('.lq-drift')
    expect(drift.find('img.lq-pic-in').exists()).toBe(true)
    expect(drift.find('.mark').exists()).toBe(true)
  })

  it('drifts afresh with each room', async () => {
    const stagePic = await stage()
    const first = stagePic.get('.lq-drift').element
    await stagePic.setProps({ src: '/b.png' })
    await stagePic.get('img.lq-loading').trigger('load')
    await nextTick()
    expect(stagePic.get('.lq-drift').element).not.toBe(first)
  })

  it('lays a canvas over the picture that is scenery only', async () => {
    const stagePic = await stage({ motion: DUST })
    const canvas = stagePic.get('canvas.lq-motion')
    expect(stagePic.get('.lq-drift').element.contains(canvas.element)).toBe(
      true,
    )
    expect(canvas.attributes('aria-hidden')).toBe('true')
    expect(canvas.attributes('tabindex')).toBeUndefined()
    expect(stagePic.get('.lq-backdrop').attributes('aria-hidden')).toBe('true')
    expect(stagePic.findAll('button, a, input, [tabindex]')).toHaveLength(0)
  })

  it('has no movement and no drift where there is only the backdrop', async () => {
    w = mount(StagePicture, { props: { src: '', motion: DUST } })
    await nextTick()
    expect(w.find('canvas').exists()).toBe(false)
    expect(w.find('.lq-drift-on').exists()).toBe(false)
  })

  it('has none while the picture loads or when it is missing', async () => {
    w = mount(StagePicture, { props: { src: '/gone.png', motion: DUST } })
    expect(w.find('canvas').exists()).toBe(false)
    await w.get('img.lq-loading').trigger('error')
    await nextTick()
    expect(w.find('canvas').exists()).toBe(false)
    expect(w.find('.lq-drift-on').exists()).toBe(false)
  })

  it('shows just the painting under Reduce motion, and starts again when it is off', async () => {
    const settings = useSettingsStore()
    settings.reduceMotion = 'on'
    const stagePic = await stage({ motion: DUST })
    expect(stagePic.find('canvas').exists()).toBe(false)
    expect(stagePic.find('.lq-drift-on').exists()).toBe(false)
    settings.reduceMotion = 'off'
    await nextTick()
    await nextTick()
    expect(stagePic.find('canvas').exists()).toBe(true)
    expect(stagePic.find('.lq-drift-on').exists()).toBe(true)
    settings.reduceMotion = 'on'
    await nextTick()
    await nextTick()
    expect(stagePic.find('canvas').exists()).toBe(false)
    expect(stagePic.find('.lq-drift-on').exists()).toBe(false)
  })

  it('follows the device when the setting does', async () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    const stagePic = await stage({ motion: DUST })
    expect(stagePic.find('canvas').exists()).toBe(false)
    expect(stagePic.find('.lq-drift-on').exists()).toBe(false)
  })

  it('adds a movement the story calls for and takes the canvas off once the last has faded', async () => {
    vi.useFakeTimers()
    const stagePic = await stage({ motion: DUST })
    await stagePic.setProps({ motion: [] })
    expect(stagePic.find('canvas').exists()).toBe(true)
    await vi.advanceTimersByTimeAsync(1500)
    expect(stagePic.find('canvas').exists()).toBe(false)
    await stagePic.setProps({ motion: [{ kind: 'water', box: BOX }] })
    expect(stagePic.find('canvas').exists()).toBe(true)
    vi.useRealTimers()
  })

  it('leaves the old room its own movement until the dark, then lays the new one', async () => {
    vi.useFakeTimers()
    const stagePic = await stage({ motion: DUST })
    const scene = useSceneStore()
    scene.begin(1, '/b.png', () => {})
    await stagePic.setProps({ src: '/b.png', motion: [] })
    await stagePic.get('img.lq-loading').trigger('load')
    expect(stagePic.find('canvas').exists()).toBe(true)
    vi.advanceTimersByTime(SCENE_HALF_MS)
    await nextTick()
    await nextTick()
    expect(stagePic.find('canvas').exists()).toBe(false)
    vi.useRealTimers()
  })

  it('has the new room movement already under way as the dark lifts', async () => {
    vi.useFakeTimers()
    const stagePic = await stage({ motion: [] })
    const scene = useSceneStore()
    scene.begin(1, '/b.png', () => {})
    await stagePic.setProps({ src: '/b.png', motion: DUST })
    await stagePic.get('img.lq-loading').trigger('load')
    expect(stagePic.find('canvas').exists()).toBe(false)
    vi.advanceTimersByTime(SCENE_HALF_MS)
    await nextTick()
    await nextTick()
    expect(stagePic.find('canvas').exists()).toBe(true)
    vi.useRealTimers()
  })
})
