// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LanternLayout from './LanternLayout.vue'
import { useGameStore } from '@/stores/useGameStore'
import { ROOM_TITLE_MS, useRoomTitleStore } from '@/stores/useRoomTitleStore'
import { useArrivalStore } from '@/stores/useArrivalStore'
import { startedHoldStore } from '@/testing/holdGame'
import { setPictureProbe } from '@/lantern/roomPicture'
import { SHORT_QUERY } from '@/composables/useMediaQuery'

/**
 * The room's title on the picture stage: "You are in" and the name over the
 * middle of the picture while it is up, the corner's name away meanwhile, and
 * any key or press settling it into the corner.
 */
describe('LanternLayout: the room title', () => {
  let w: VueWrapper

  /** Mount a started game on the laptop stage (or the text page, `wide` false and short). */
  async function stage(wide = true): Promise<void> {
    setActivePinia(createPinia())
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: wide ? query.includes('min-width') : query === SHORT_QUERY,
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
    if (wide) await w.get('img.lq-loading').trigger('load')
    useRoomTitleStore().settle()
    await w.vm.$nextTick()
  }

  /** Put the title up for the room the player is in. */
  async function greet(): Promise<void> {
    useRoomTitleStore().greet(useGameStore().roomName)
    await w.vm.$nextTick()
  }

  const title = () => w.find('[data-testid="room-title"]')
  const plate = () => w.get('.lq-stage-plate')

  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    w.unmount()
    setPictureProbe(null)
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('tells "You are in" and the room over the picture, the corner name away meanwhile', async () => {
    await stage()
    expect(title().exists()).toBe(false)
    expect(plate().classes()).not.toContain('lq-plate-away')
    await greet()
    expect(title().text()).toContain('You are in')
    expect(title().get('.lq-room-title-name').text()).toBe('Hall')
    expect(title().attributes('aria-hidden')).toBe('true')
    expect(plate().classes()).toContain('lq-plate-away')
    expect(w.get('.lq-main').classes()).toContain('lq-titled')
  })

  it('settles into the corner after its time', async () => {
    await stage()
    await greet()
    vi.advanceTimersByTime(ROOM_TITLE_MS)
    await w.vm.$nextTick()
    expect(useRoomTitleStore().name).toBeNull()
    expect(plate().classes()).not.toContain('lq-plate-away')
    expect(w.get('.lq-main').classes()).not.toContain('lq-titled')
  })

  it('settles at once on any key', async () => {
    await stage()
    await greet()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    await w.vm.$nextTick()
    expect(useRoomTitleStore().name).toBeNull()
  })

  it('settles at once on a press anywhere, which still does what it does', async () => {
    await stage()
    await greet()
    const press = vi.fn()
    const button = w.get('.lq-stage-buttons button').element
    button.addEventListener('pointerdown', press)
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await w.vm.$nextTick()
    expect(useRoomTitleStore().name).toBeNull()
    expect(press).toHaveBeenCalled()
  })

  it('keeps the corner name away while an arrival is told on the picture', async () => {
    await stage()
    const arrival = useArrivalStore()
    arrival.show(
      useGameStore().turns.at(-1)!.id,
      [{ kind: 'description', lines: [], voiced: false }],
      false,
    )
    await w.vm.$nextTick()
    expect(plate().classes()).toContain('lq-plate-away')
    arrival.clear()
    await w.vm.$nextTick()
    expect(plate().classes()).not.toContain('lq-plate-away')
  })

  it('greets the room when a game is loaded in it, once its picture is up', async () => {
    await stage()
    const game = useGameStore()
    // A loaded story is not narrated again (as restoreStory leaves it).
    game.turns = game.turns.map((turn) => ({ ...turn, narrate: undefined }))
    game.loadNumber++
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    const loading = w.find('img.lq-loading')
    if (loading.exists()) await loading.trigger('load')
    await w.vm.$nextTick()
    expect(useRoomTitleStore().name).toBe('Hall')
    expect(title().text()).toContain('Hall')
  })

  it('keeps the corner name while the picture tells no room (news, what happens)', async () => {
    await stage()
    useArrivalStore().show(
      useGameStore().turns.at(-1)!.id,
      [
        {
          kind: 'events',
          lines: [{ unit: 0, markup: 'A bell.' }],
          voiced: false,
        },
      ],
      false,
    )
    await w.vm.$nextTick()
    expect(useArrivalStore().active).toBe(true)
    expect(plate().classes()).not.toContain('lq-plate-away')
  })

  it('has no title on the text page', async () => {
    await stage(false)
    expect(useRoomTitleStore().staged).toBe(false)
    expect(title().exists()).toBe(false)
  })
})
