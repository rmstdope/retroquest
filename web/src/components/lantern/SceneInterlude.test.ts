// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SceneInterlude from './SceneInterlude.vue'
import { SCENE_HALF_MS, useSceneStore } from '@/stores/useSceneStore'

/** The component's own source (Vitest replaces its styles with nothing). */
const SOURCE = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'SceneInterlude.vue'),
  'utf8',
)

describe('SceneInterlude', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
  })

  /** Bring the scene to its dark, telling `markup`. */
  function inTheDark(markup: string): void {
    const scene = useSceneStore()
    scene.settled('a.png')
    scene.begin(4, 'b.png', () => {}, 2, { unit: 2, markup })
    vi.advanceTimersByTime(SCENE_HALF_MS)
  }

  it('tells nothing while no interlude is in the dark', () => {
    const w = mount(SceneInterlude)
    expect(w.find('[data-testid="scene-interlude"]').exists()).toBe(false)
  })

  it('tells the interlude in the middle with the hint to go on', async () => {
    const w = mount(SceneInterlude)
    inTheDark('The dark lets go of you.')
    await w.vm.$nextTick()
    expect(w.get('.lq-interlude-text').text()).toBe('The dark lets go of you.')
    expect(w.get('.lq-interlude-hint').text()).toBe(
      'Click to continue · Hold to skip',
    )
  })

  it('says "Tap to continue · Hold to skip" on a phone', async () => {
    const w = mount(SceneInterlude, { props: { phone: true } })
    inTheDark('The dark lets go of you.')
    await w.vm.$nextTick()
    expect(w.get('.lq-interlude-hint').text()).toBe(
      'Tap to continue · Hold to skip',
    )
  })

  it('lights the spoken word as the arrival on the picture does', () => {
    expect(SOURCE).toMatch(/:deep\(\.lq-w-now\)\s*\{[^}]*background/)
  })

  it('fades its words out over the time the dark waits for them', () => {
    expect(SOURCE).toMatch(
      /\.lq-interlude-leave-active\s*\{[^}]*calc\(1\.2s \* var\(--lq-motion\)\)/,
    )
  })
})
