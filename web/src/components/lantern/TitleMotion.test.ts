// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import TitleMotion from './TitleMotion.vue'
import { useSettingsStore } from '@/stores/useSettingsStore'
import type { MotionSpec } from '@/lantern/roomMotion'

const DUST: MotionSpec[] = [{ kind: 'dust' }]

describe('TitleMotion', () => {
  let w: VueWrapper | undefined

  beforeEach(() => {
    globalThis.localStorage?.clear()
    setActivePinia(createPinia())
    useSettingsStore().reduceMotion = 'off'
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  })
  afterEach(() => {
    w?.unmount()
    w = undefined
    vi.restoreAllMocks()
  })

  function mountMotion(motion: MotionSpec[]): VueWrapper {
    w = mount(TitleMotion, { props: { motion, src: '/title.png' } })
    return w
  }

  it('lays a canvas that is scenery only when there is movement', () => {
    const motion = mountMotion(DUST)
    const canvas = motion.get('canvas.lq-title-motion')
    expect(canvas.attributes('aria-hidden')).toBe('true')
    expect(canvas.attributes('tabindex')).toBeUndefined()
  })

  it('has no canvas when the studio has saved no movement', () => {
    expect(mountMotion([]).find('canvas').exists()).toBe(false)
  })

  it('has no canvas under Reduce motion, and takes it away at once when it is switched on', async () => {
    const motion = mountMotion(DUST)
    expect(motion.find('canvas').exists()).toBe(true)
    useSettingsStore().reduceMotion = 'on'
    await nextTick()
    expect(motion.find('canvas').exists()).toBe(false)
    useSettingsStore().reduceMotion = 'off'
    await nextTick()
    expect(motion.find('canvas').exists()).toBe(true)
  })

  it('runs frames while it is up and stops them when it goes', async () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => {
      frames.push(f)
      return frames.length
    })
    const cancel = vi.fn()
    vi.stubGlobal('cancelAnimationFrame', cancel)
    mountMotion(DUST)
    await nextTick()
    expect(frames.length).toBeGreaterThan(0)
    useSettingsStore().reduceMotion = 'on'
    await nextTick()
    expect(cancel).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
