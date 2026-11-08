// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useGameStore } from '@/stores/useGameStore'
import { useStageSpeechStore } from '@/stores/useStageSpeechStore'
import { useBridge, type ActClass } from '@/composables/useBridge'
import { Act1 } from '@/act1/Act1'

/**
 * The room picture keeps up with the story over the real engine: the patch of
 * a thing Elior takes is laid over the picture, without a fade for what was
 * already so when the room came up, with one for what the story changes.
 */
describe('LanternLayout: patches of the room picture', () => {
  let w: VueWrapper
  let game: ReturnType<typeof useGameStore>

  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query.includes('min-width'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    // jsdom plays no sound: the quest chime's audio needs a play() that answers.
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.stubGlobal('localStorage', {
      getItem: (): null => null,
      setItem: (): void => {},
      removeItem: (): void => {},
    })
    game = useGameStore()
    game.setBridge(useBridge(async (): Promise<ActClass[]> => [Act1]))
    await game.initGame()
    game.dismissModal()
    game.imageManifest = {
      'act1-eliors-cottage': {
        patches: { 'bread-taken': { file: 'x.png' }, 'lantern-lit': {} },
      },
    }
    w = mount(LanternLayout, { attachTo: document.body })
    await w.vm.$nextTick()
    game.submitCommand('talk to voice')
    await w.vm.$nextTick()
    await w.get('img.lq-loading').trigger('load')
  })
  afterEach(() => {
    w.unmount()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  const patches = (): string[] =>
    w.findAll('img.lq-patch').map((i) => i.attributes('src') ?? '')

  it('lays the patch of the bread once it is taken, with a fade, and nothing before', async () => {
    expect(patches()).toEqual([])
    game.submitCommand('take bread')
    await w.vm.$nextTick()
    const loader = w.get('img.lq-patch-loading')
    expect(loader.attributes('src')).toContain('bread-taken')
    await loader.trigger('load')
    expect(patches()).toHaveLength(1)
    expect(w.get('img.lq-patch').classes()).not.toContain('lq-patch-still')
  })

  it('does not lay a patch the studio has not made', async () => {
    game.imageManifest = { 'act1-eliors-cottage': {} }
    game.submitCommand('take bread')
    await w.vm.$nextTick()
    expect(w.find('img.lq-patch-loading').exists()).toBe(false)
    expect(patches()).toEqual([])
  })

  it('keeps the old patches while an unnarrated telling goes on, and changes them as its last line appears', async () => {
    // The stage's telling is stood in for: the turn's last line has not appeared until we say so.
    let lastLineAppears: (() => void) | null = null
    vi.spyOn(useStageSpeechStore(), 'observe').mockImplementation(
      (_turn, _change, lastLine) => {
        lastLineAppears = lastLine ?? null
      },
    )
    game.submitCommand('take bread')
    await w.vm.$nextTick()
    expect(lastLineAppears).toBeTypeOf('function')
    expect(w.find('img.lq-patch-loading').exists()).toBe(false)
    lastLineAppears!()
    await w.vm.$nextTick()
    expect(w.get('img.lq-patch-loading').attributes('src')).toContain(
      'bread-taken',
    )
  })

  it('lays the changes of a loaded save in the same room without a fade, and takes away those it no longer has', async () => {
    const kept: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: (k: string): string | null => kept[k] ?? null,
      setItem: (k: string, v: string): void => {
        kept[k] = v
      },
      removeItem: (k: string): void => {
        delete kept[k]
      },
    })
    game.submitCommand('save')
    await w.vm.$nextTick()
    game.submitCommand('take bread')
    await w.vm.$nextTick()
    await w.get('img.lq-patch-loading').trigger('load')
    expect(patches()).toHaveLength(1)
    // Loading the earlier save in this room takes the bread's patch away at once.
    game.submitCommand('load')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(patches()).toEqual([])
  })
})
