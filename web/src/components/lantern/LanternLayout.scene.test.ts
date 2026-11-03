// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useGameStore } from '@/stores/useGameStore'
import { useSceneStore, SCENE_HALF_MS } from '@/stores/useSceneStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { useArrivalStore } from '@/stores/useArrivalStore'
import { startedHoldStore } from '@/testing/holdGame'

/**
 * The change of scene on the picture stage over the real engine: a move to a
 * room with another picture fades through the dark, and the move's words wait
 * until the new picture is fully up.
 */
describe('LanternLayout: change of scene', () => {
  let w: VueWrapper

  /** Mount a started game on the laptop stage (or the phone's), the Hall's picture up. */
  async function stage(
    phone = false,
  ): Promise<ReturnType<typeof useGameStore>> {
    setActivePinia(createPinia())
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: !phone && query.includes('min-width'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    const game = await startedHoldStore()
    game.showTitle = false
    w = mount(LanternLayout, { attachTo: document.body })
    await w.vm.$nextTick()
    // The Hall's picture loads and is up.
    game.musicRoomKey = 'Hall'
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    await w.get('img.lq-loading').trigger('load')
    return game
  }

  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    w.unmount()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('moves through the dark and holds the words until the picture is up', async () => {
    const game = await stage()
    const scene = useSceneStore()
    expect(scene.shown).toContain('hall')
    game.submitCommand('go north')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    const turn = game.turns.at(-1)!
    expect(scene.turn).toBe(turn.id)
    expect(scene.holds(turn.id)).toBe(true)
    expect(useNarrationStore().revealed(turn.id, 0)).toBe(false)
    // The new picture loads out of sight; the old one stays under the veil.
    await w.get('img.lq-loading').trigger('load')
    expect(w.classes('lq-scene-out') || w.find('.lq-scene-out').exists()).toBe(
      true,
    )
    // The room's name changes at the darkest moment.
    expect(game.roomName).toBe('Hall')
    vi.advanceTimersByTime(SCENE_HALF_MS)
    await w.vm.$nextTick()
    expect(game.roomName).toBe('Garden')
    expect(scene.holds(turn.id)).toBe(true)
    vi.advanceTimersByTime(SCENE_HALF_MS)
    await w.vm.$nextTick()
    expect(scene.holds(turn.id)).toBe(false)
    expect(useNarrationStore().revealed(turn.id, 0)).toBe(true)
    expect(scene.shown).toContain('garden')
  })

  it('brings the new room up at once on Enter', async () => {
    const game = await stage()
    const scene = useSceneStore()
    game.submitCommand('go north')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(scene.turn).not.toBeNull()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(scene.turn).toBeNull()
    expect(scene.phase).toBe('idle')
  })

  it('brings the new room up at once on a click on the picture', async () => {
    const game = await stage()
    const scene = useSceneStore()
    game.submitCommand('go north')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    await w.get('.lq-stage-picture').trigger('click')
    expect(scene.turn).toBeNull()
  })

  it('changes the room name when the change is skipped before the dark', async () => {
    const game = await stage()
    game.submitCommand('go north')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(game.roomName).toBe('Hall')
    await w.get('.lq-stage-picture').trigger('click')
    expect(game.roomName).toBe('Garden')
  })

  it('skips on an Enter pressed in an empty command box', async () => {
    const game = await stage()
    const scene = useSceneStore()
    game.submitCommand('go north')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    const input = w.find('input')
    if (input.exists()) await input.trigger('keydown', { key: 'Enter' })
    else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(scene.turn).toBeNull()
  })

  it('on a phone skips on an Enter on the folded Actions, which stays folded', async () => {
    const game = await stage(true)
    const scene = useSceneStore()
    game.submitCommand('go north')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(scene.turn).not.toBeNull()
    const actions = w.get('.lq-dock-open').element
    const enter = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    })
    actions.dispatchEvent(enter)
    expect(scene.turn).toBeNull()
    // Handled: the browser does not also press the button and open the sheet.
    expect(enter.defaultPrevented).toBe(true)
  })

  it('on a phone skips on a Space on the folded Actions, which stays folded', async () => {
    const game = await stage(true)
    const scene = useSceneStore()
    game.submitCommand('go north')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(scene.turn).not.toBeNull()
    const actions = w.get('.lq-dock-open').element
    const space = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true,
    })
    actions.dispatchEvent(space)
    expect(scene.turn).toBeNull()
    // Handled, key-up too: the browser does not also press the button and
    // open the sheet.
    expect(space.defaultPrevented).toBe(true)
    const up = new KeyboardEvent('keyup', {
      key: ' ',
      bubbles: true,
      cancelable: true,
    })
    actions.dispatchEvent(up)
    expect(up.defaultPrevented).toBe(true)
  })

  it('a command during the change skips it and leaves the new room up', async () => {
    const game = await stage()
    const scene = useSceneStore()
    game.submitCommand('go north')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    const first = scene.turn
    game.submitCommand('look')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(first).not.toBeNull()
    expect(scene.holds(first!)).toBe(false)
    // The room now up is the Garden's: looking again changes nothing.
    expect(scene.shown).toContain('garden')
    expect(scene.turn).toBeNull()
  })

  it('does not change scene under Reduce motion', async () => {
    const game = await stage()
    const scene = useSceneStore()
    document.documentElement.style.setProperty('--lq-motion', '0')
    game.submitCommand('go north')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(scene.turn).toBeNull()
    expect(game.roomName).toBe('Garden')
    document.documentElement.style.removeProperty('--lq-motion')
  })

  it('does not change scene when the picture stays the same', async () => {
    const game = await stage()
    const scene = useSceneStore()
    game.submitCommand('look')
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(scene.turn).toBeNull()
    expect(useArrivalStore().active).toBe(false)
  })
})
