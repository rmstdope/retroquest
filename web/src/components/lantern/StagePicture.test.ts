// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  INTERLUDE_FADE_MS,
  INTERLUDE_RISE_MS,
  SCENE_HALF_MS,
  useSceneStore,
} from '@/stores/useSceneStore'
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

  it('is decorative, but not what is put over it (the things that can be pressed)', () => {
    const w = mount(StagePicture, { props: { src: '' } })
    expect(w.attributes('aria-hidden')).toBeUndefined()
    expect(w.get('.lq-backdrop').attributes('aria-hidden')).toBe('true')
  })
})

describe('StagePicture during a change of scene', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('lifts the veil at the pace the change of scene rises at', async () => {
    const scene = useSceneStore()
    const w = mount(StagePicture, { props: { src: '/a.png' } })
    await w.get('img.lq-loading').trigger('load')
    expect(w.attributes('style')).toContain(`--lq-rise: ${SCENE_HALF_MS}ms`)
    scene.begin(1, '/b.png', () => {}, 0, { unit: 0, markup: 'Awake.' })
    await w.setProps({ src: '/b.png' })
    await w.get('img.lq-loading').trigger('load')
    vi.advanceTimersByTime(SCENE_HALF_MS)
    scene.endInterlude()
    vi.advanceTimersByTime(INTERLUDE_FADE_MS)
    await nextTick()
    expect(w.classes()).toContain('lq-scene-in')
    expect(w.attributes('style')).toContain(`--lq-rise: ${INTERLUDE_RISE_MS}ms`)
  })

  it('draws the veil lifting over the rise time', () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'StagePicture.vue'),
      'utf8',
    )
    const rule = source.match(/\.lq-scene-in \.lq-veil \{([^}]*)\}/)
    expect(rule?.[1]).toContain('calc(var(--lq-rise) * var(--lq-motion))')
  })

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

  it('shows the backdrop, never the old room, when skipped before the picture has loaded', async () => {
    const scene = useSceneStore()
    const w = mount(StagePicture, { props: { src: '/a.png' } })
    await w.get('img.lq-loading').trigger('load')
    scene.begin(1, '/b.png', () => {})
    await w.setProps({ src: '/b.png' })
    scene.skip()
    await nextTick()
    expect(w.find('img.lq-pic').exists()).toBe(false)
    expect(w.classes()).toContain('lq-scene-idle')
    await w.get('img.lq-loading').trigger('load')
    expect(w.get('img.lq-pic').attributes('src')).toBe('/b.png')
  })
})

describe('StagePicture patches', () => {
  const BUCKET = '/a.bucket-taken.png'
  const ROPE = '/a.rope-gone.png'
  const PATCH_WAIT = 1000

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  /** A mounted picture of /a.png, loaded, with `patches` asked for and the ones named loaded. */
  async function picture(patches: string[], loaded: string[] = patches) {
    const w = mount(StagePicture, { props: { src: '/a.png', patches } })
    await w.get('img.lq-loading').trigger('load')
    for (const url of loaded) await patchLoader(w, url).trigger('load')
    return w
  }

  function patchLoader(w: ReturnType<typeof mount>, url: string) {
    return w.get(`img.lq-patch-loading[src="${url}"]`)
  }

  function layers(w: ReturnType<typeof mount>): string[] {
    return w.findAll('img.lq-patch').map((i) => i.attributes('src') ?? '')
  }

  it('lays nothing when there are no patches', async () => {
    const w = await picture([])
    expect(w.find('img.lq-patch').exists()).toBe(false)
  })

  it('lays a patch with the picture, without a fade, when the room comes up', async () => {
    const w = await picture([BUCKET])
    expect(layers(w)).toEqual([BUCKET])
    expect(w.get('img.lq-patch').classes()).toContain('lq-patch-still')
    expect(w.get('img.lq-patch').classes()).toContain('lq-patch-on')
  })

  it('fades a patch in when the story changes the room Elior stands in', async () => {
    const w = await picture([])
    await w.setProps({ patches: [BUCKET] })
    await patchLoader(w, BUCKET).trigger('load')
    const layer = w.get('img.lq-patch')
    expect(layer.classes()).not.toContain('lq-patch-still')
    expect(layer.classes()).not.toContain('lq-patch-on')
    vi.advanceTimersByTime(50)
    await nextTick()
    expect(w.get('img.lq-patch').classes()).toContain('lq-patch-on')
  })

  it('fades a patch out when it no longer applies, then lets it go', async () => {
    const w = await picture([BUCKET])
    await w.setProps({ patches: [] })
    expect(w.get('img.lq-patch').classes()).not.toContain('lq-patch-on')
    // It came with the picture, yet it leaves with the slow fade, not at once.
    expect(w.get('img.lq-patch').classes()).not.toContain('lq-patch-still')
    vi.advanceTimersByTime(1300)
    await nextTick()
    expect(layers(w)).toEqual([])
  })

  it('fades several patches of one turn together', async () => {
    const w = await picture([])
    await w.setProps({ patches: [BUCKET, ROPE] })
    await patchLoader(w, BUCKET).trigger('load')
    await patchLoader(w, ROPE).trigger('load')
    // Both are laid at nothing first: neither jumps in at full strength.
    expect(w.findAll('img.lq-patch')).toHaveLength(2)
    expect(w.findAll('img.lq-patch.lq-patch-on')).toHaveLength(0)
    vi.advanceTimersByTime(50)
    await nextTick()
    expect(w.findAll('img.lq-patch.lq-patch-on')).toHaveLength(2)
  })

  it('lays no patch that cannot be fetched, and says nothing', async () => {
    const w = await picture([BUCKET], [])
    await patchLoader(w, BUCKET).trigger('error')
    expect(layers(w)).toEqual([])
    expect(w.text()).toBe('')
  })

  it('lets a slow patch fade in once it arrives', async () => {
    const w = await picture([BUCKET], [])
    vi.advanceTimersByTime(1500)
    await nextTick()
    expect(layers(w)).toEqual([])
    await patchLoader(w, BUCKET).trigger('load')
    expect(w.get('img.lq-patch').classes()).not.toContain('lq-patch-still')
  })

  it('shows the picture without a patch that is still slow after a second, when the first picture comes up', async () => {
    const w = mount(StagePicture, {
      props: { src: '/a.png', patches: [BUCKET] },
    })
    await w.get('img.lq-loading').trigger('load')
    expect(w.find('img.lq-pic').exists()).toBe(false)
    vi.advanceTimersByTime(1000)
    await nextTick()
    expect(w.get('img.lq-pic').attributes('src')).toBe('/a.png')
    expect(layers(w)).toEqual([])
  })

  it('puts the picture up with its patch when the patch arrives within that second', async () => {
    const w = mount(StagePicture, {
      props: { src: '/a.png', patches: [BUCKET] },
    })
    await w.get('img.lq-loading').trigger('load')
    await patchLoader(w, BUCKET).trigger('load')
    expect(w.get('img.lq-pic').attributes('src')).toBe('/a.png')
    expect(w.get('img.lq-patch').classes()).toContain('lq-patch-still')
  })

  it('does not show the next room patches over the old picture during a change of scene', async () => {
    const scene = useSceneStore()
    const w = await picture([BUCKET])
    scene.begin(1, '/b.png', () => {})
    await w.setProps({ src: '/b.png', patches: [ROPE] })
    expect(layers(w)).toEqual([BUCKET])
  })

  it('waits in the dark for the next room patches, then rises with them already there', async () => {
    const scene = useSceneStore()
    const w = await picture([BUCKET])
    scene.begin(1, '/b.png', () => {})
    await w.setProps({ src: '/b.png', patches: [ROPE] })
    await w.get('img.lq-loading').trigger('load')
    expect(scene.ready).toBeNull()
    await patchLoader(w, ROPE).trigger('load')
    expect(scene.ready).toBe(true)
    vi.advanceTimersByTime(SCENE_HALF_MS)
    await nextTick()
    expect(layers(w)).toEqual([ROPE])
    expect(w.get('img.lq-patch').classes()).toContain('lq-patch-still')
  })

  it('spends the wait for a slow patch in the dark even when the picture is already cached', async () => {
    const scene = useSceneStore()
    const w = await picture([BUCKET])
    scene.begin(1, '/b.png', () => {})
    await w.setProps({ src: '/b.png', patches: [ROPE] })
    // The picture loads at once, while the old one is still fading out.
    await w.get('img.lq-loading').trigger('load')
    vi.advanceTimersByTime(SCENE_HALF_MS + 900)
    await nextTick()
    expect(scene.phase).toBe('dark')
    expect(scene.ready).toBeNull()
    await patchLoader(w, ROPE).trigger('load')
    expect(scene.ready).toBe(true)
    expect(scene.phase).toBe('in')
  })

  it('gives up on a slow patch a second into the dark, not before', async () => {
    const scene = useSceneStore()
    const w = await picture([BUCKET])
    scene.begin(1, '/b.png', () => {})
    await w.setProps({ src: '/b.png', patches: [ROPE] })
    await w.get('img.lq-loading').trigger('load')
    vi.advanceTimersByTime(SCENE_HALF_MS)
    await nextTick()
    vi.advanceTimersByTime(1100)
    expect(scene.ready).toBe(true)
    expect(scene.phase).toBe('in')
  })

  it('lays the changes of a loaded save still, in the room Elior already stands in', async () => {
    const scene = useSceneStore()
    const w = await picture([])
    scene.reset()
    await w.setProps({ patches: [BUCKET] })
    await patchLoader(w, BUCKET).trigger('load')
    expect(layers(w)).toEqual([BUCKET])
    expect(w.get('img.lq-patch').classes()).toContain('lq-patch-still')
    expect(w.get('img.lq-patch').classes()).toContain('lq-patch-on')
  })

  it('takes away at once the changes a loaded save no longer has', async () => {
    const scene = useSceneStore()
    const w = await picture([BUCKET])
    scene.reset()
    await w.setProps({ patches: [] })
    expect(layers(w)).toEqual([])
  })

  it('fades a change that comes well after a load', async () => {
    const scene = useSceneStore()
    const w = await picture([])
    scene.reset()
    await w.setProps({ patches: [] })
    vi.advanceTimersByTime(PATCH_WAIT + 100)
    await w.setProps({ patches: [BUCKET] })
    await patchLoader(w, BUCKET).trigger('load')
    expect(w.get('img.lq-patch').classes()).not.toContain('lq-patch-still')
  })

  it('does not let a skipped change of scene wait for the patches of the next one', async () => {
    const scene = useSceneStore()
    const w = await picture([])
    scene.begin(1, '/b.png', () => {})
    await w.setProps({ src: '/b.png', patches: [ROPE] })
    await w.get('img.lq-loading').trigger('load')
    scene.skip()
    await nextTick()
    scene.begin(2, '/c.png', () => {})
    await w.setProps({ src: '/c.png', patches: [] })
    vi.advanceTimersByTime(SCENE_HALF_MS + 500)
    await nextTick()
    // The picture of /c.png has not loaded: its wait in the dark is its own.
    expect(scene.ready).toBeNull()
  })

  it('rises without a patch that is more than a second late, which fades in when it comes', async () => {
    const scene = useSceneStore()
    const w = await picture([BUCKET])
    scene.begin(1, '/b.png', () => {})
    await w.setProps({ src: '/b.png', patches: [ROPE] })
    await w.get('img.lq-loading').trigger('load')
    vi.advanceTimersByTime(SCENE_HALF_MS)
    await nextTick()
    vi.advanceTimersByTime(SCENE_HALF_MS)
    await nextTick()
    expect(scene.ready).toBe(true)
    expect(scene.target).toBe('/b.png')
    expect(layers(w)).toEqual([])
    await patchLoader(w, ROPE).trigger('load')
    expect(w.get('img.lq-patch').classes()).not.toContain('lq-patch-still')
  })

  it('keeps a patch laid just before an earlier clean-up fires', async () => {
    const w = await picture([BUCKET])
    await w.setProps({ patches: [] })
    vi.advanceTimersByTime(1290)
    await w.setProps({ patches: [ROPE] })
    await patchLoader(w, ROPE).trigger('load')
    vi.advanceTimersByTime(15)
    await nextTick()
    expect(layers(w)).toContain(ROPE)
  })

  it.each([
    ['the later-declared loading first', [ROPE, BUCKET], false],
    ['the earlier-declared loading first', [BUCKET, ROPE], false],
    [
      'the later-declared loading first, from a loaded save',
      [ROPE, BUCKET],
      true,
    ],
  ])(
    'stacks patches fading in together in their declared order, %s',
    async (_label, loading, loadedSave) => {
      const scene = useSceneStore()
      const w = await picture([])
      if (loadedSave) scene.reset()
      await w.setProps({ patches: [BUCKET, ROPE] })
      for (const patch of loading) await patchLoader(w, patch).trigger('load')
      expect(layers(w)).toEqual([BUCKET, ROPE])
    },
  )

  it('lays a patch declared earlier under one already there', async () => {
    const w = await picture([ROPE])
    await w.setProps({ patches: [BUCKET, ROPE] })
    await patchLoader(w, BUCKET).trigger('load')
    expect(layers(w)).toEqual([BUCKET, ROPE])
  })

  it('takes away only the patch that no longer applies, the other staying on', async () => {
    const w = await picture([BUCKET, ROPE])
    await w.setProps({ patches: [BUCKET] })
    vi.advanceTimersByTime(1300)
    await nextTick()
    expect(layers(w)).toEqual([BUCKET])
    expect(w.get('img.lq-patch').classes()).toContain('lq-patch-on')
  })
})
