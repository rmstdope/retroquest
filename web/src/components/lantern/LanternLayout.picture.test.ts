// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useGameStore } from '@/stores/useGameStore'
import { useSceneStore, SCENE_HALF_MS } from '@/stores/useSceneStore'
import { startedHoldStore } from '@/testing/holdGame'
import { setPictureProbe } from '@/lantern/roomPicture'
import { readingPauseMs } from '@/lantern/stageSpeech'

/**
 * A room that changes its own picture (the hall, once its gem is taken; the
 * shed's door opening) on the picture stage over the real engine: the first
 * paragraph is told over the old picture, the picture goes through the dark,
 * and the rest is told over the new one. The room, its name and its music stay.
 */
describe('LanternLayout: a room changes its own picture', () => {
  let w: VueWrapper
  const FIRST = 'You pocket the gem.'

  /** Mount the started hall on the stage with its picture up; the other picture is `painted` or not. */
  async function stage(
    painted: boolean,
  ): Promise<ReturnType<typeof useGameStore>> {
    setActivePinia(createPinia())
    setPictureProbe(() => Promise.resolve(painted))
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query.includes('min-width'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    const game = await startedHoldStore()
    game.showTitle = false
    w = mount(LanternLayout, { attachTo: document.body })
    await w.vm.$nextTick()
    game.musicRoomKey = 'Hall'
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    await w.get('img.lq-loading').trigger('load')
    return game
  }

  /** Let the picture check and the render settle. */
  async function settle(): Promise<void> {
    await vi.advanceTimersByTimeAsync(0)
    await w.vm.$nextTick()
  }

  beforeEach(() => {
    vi.useFakeTimers()
    // Taking the gem starts a quest, whose chime plays a sound.
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  })
  afterEach(() => {
    w.unmount()
    setPictureProbe(null)
    document.documentElement.style.removeProperty('--lq-motion')
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('tells the first paragraph over the old picture, goes through the dark, then tells the rest', async () => {
    const game = await stage(true)
    const scene = useSceneStore()
    game.submitCommand('take gem')
    await settle()
    const turn = game.turns.at(-1)!
    expect(turn.pictureChanged).toBe(true)
    expect(scene.turn).toBeNull()
    expect(scene.holds(turn.id, 0)).toBe(false)
    expect(scene.holds(turn.id, 1)).toBe(true)
    expect(scene.shown).not.toContain('lit')
    await vi.advanceTimersByTimeAsync(readingPauseMs(FIRST))
    await settle()
    expect(scene.turn).toBe(turn.id)
    // The room's name does not flicker: it is the same room.
    expect(game.roomName).toBe('Hall')
    await w.get('img.lq-loading').trigger('load')
    vi.advanceTimersByTime(SCENE_HALF_MS)
    await w.vm.$nextTick()
    expect(scene.holds(turn.id, 1)).toBe(true)
    vi.advanceTimersByTime(SCENE_HALF_MS)
    await w.vm.$nextTick()
    expect(scene.holds(turn.id, 1)).toBe(false)
    expect(scene.shown).toContain('hall-lit')
    expect(game.roomName).toBe('Hall')
    expect(game.musicRoomKey).toBe('Hall')
  })

  it('brings the inside up at once on Enter', async () => {
    const game = await stage(true)
    const scene = useSceneStore()
    game.submitCommand('take gem')
    await settle()
    await vi.advanceTimersByTimeAsync(readingPauseMs(FIRST))
    await settle()
    expect(scene.turn).not.toBeNull()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(scene.turn).toBeNull()
    expect(scene.holds(game.turns.at(-1)!.id, 1)).toBe(false)
  })

  it('tells a picture not painted yet straight through, with no dark', async () => {
    const game = await stage(false)
    const scene = useSceneStore()
    game.submitCommand('take gem')
    await settle()
    const turn = game.turns.at(-1)!
    await vi.advanceTimersByTimeAsync(readingPauseMs(FIRST))
    await settle()
    expect(scene.turn).toBeNull()
    expect(scene.phase).toBe('idle')
    expect(scene.holds(turn.id, 1)).toBe(false)
    expect(scene.shown).toContain('hall')
    expect(scene.shown).not.toContain('lit')
    expect(game.roomPicture).toBe(scene.shown)
  })

  it('does not change scene under Reduce motion', async () => {
    const game = await stage(true)
    const scene = useSceneStore()
    document.documentElement.style.setProperty('--lq-motion', '0')
    game.submitCommand('take gem')
    await settle()
    const turn = game.turns.at(-1)!
    expect(scene.turn).toBeNull()
    expect(scene.holds(turn.id, 1)).toBe(false)
  })
})
