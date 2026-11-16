// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SaveLoadDialog from './SaveLoadDialog.vue'
import { useGameStore } from '@/stores/useGameStore'
import type { SaveSlot } from '@/types/bridge'

const sounds = vi.hoisted(() => ({ move: vi.fn(), choose: vi.fn() }))
vi.mock('@/composables/useUiSounds', () => ({
  useUiSounds: () => ({ playMove: sounds.move, playChoose: sounds.choose }),
}))

function slot(n: number, over: Partial<SaveSlot> = {}): SaveSlot {
  return {
    slot: n,
    act: null,
    room: null,
    timestamp: null,
    quests: null,
    ...over,
  }
}
function made(n: number, day: number, over: Partial<SaveSlot> = {}): SaveSlot {
  return slot(n, {
    act: 'Act 1',
    room: `Room ${n}`,
    timestamp: `2026-01-${String(day).padStart(2, '0')}T10:00:00Z`,
    ...over,
  })
}

describe('SaveLoadDialog from the keyboard', () => {
  let wrapper: VueWrapper | undefined
  let slots: SaveSlot[]
  let named: SaveSlot[]
  let columns: number
  let quick: SaveSlot | null
  let game: ReturnType<typeof useGameStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    game = useGameStore()
    columns = 2
    named = []
    quick = null
    slots = Array.from({ length: 8 }, (_, i) => slot(i + 1))
    vi.spyOn(game, 'getSaveSlots').mockImplementation(() => slots)
    vi.spyOn(game, 'getNamedSaves').mockImplementation(() => named)
    vi.spyOn(game, 'getQuickSave').mockImplementation(() => quick)
    vi.spyOn(game, 'saveToSlot').mockImplementation((n: number) => {
      slots[n - 1] = made(n, 28)
      return true
    })
    vi.spyOn(game, 'loadFromSlot').mockImplementation(() => {})
    vi.spyOn(game, 'loadGame').mockImplementation(() => {})
    sounds.move.mockClear()
    sounds.choose.mockClear()
    // jsdom draws nothing: lay the cards out as a grid of `columns`.
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: Element) {
        const all = [...document.querySelectorAll('.lq-slot')]
        const at = all.indexOf(this.closest('.lq-slot') ?? this)
        return {
          left: (at % columns) * 100,
          top: Math.floor(at / columns) * 50,
          width: 90,
          height: 40,
        } as DOMRect
      },
    )
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    vi.restoreAllMocks()
  })

  async function open(mode: 'save' | 'load', props = {}): Promise<VueWrapper> {
    wrapper = mount(SaveLoadDialog, {
      props: { mode, ...props },
      attachTo: document.body,
    })
    await flushPromises()
    return wrapper
  }

  function press(key: string): void {
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
    )
  }

  /** The key of the slot holding the ring: its badge. */
  function ringed(): string | undefined {
    return document.activeElement
      ?.closest('.lq-slot')
      ?.querySelector('.lq-slot-badge')?.textContent
  }

  it('Save starts on the first empty slot', async () => {
    slots[0] = made(1, 1)
    slots[1] = made(2, 2)
    await open('save')
    expect(ringed()).toBe('3')
  })

  it('Save with every slot full starts on the oldest save', async () => {
    slots = slots.map((_, i) => made(i + 1, 10 + i))
    slots[4] = made(5, 2)
    await open('save')
    expect(ringed()).toBe('5')
  })

  it('Load starts on the newest save, including the quick save', async () => {
    slots[0] = made(1, 3)
    slots[1] = made(2, 9)
    quick = made(0, 5, { room: null })
    quick.slot = 0
    await open('load')
    expect(ringed()).toBe('2')
    wrapper?.unmount()
    quick = made(0, 20)
    quick.slot = 0
    await open('load')
    expect(ringed()).toBe('Q')
  })

  it('follows the grid with the arrows and wraps', async () => {
    await open('save') // slots 1..8, two columns, ring on 1
    expect(ringed()).toBe('1')
    press('ArrowRight')
    expect(ringed()).toBe('2')
    press('ArrowRight')
    expect(ringed()).toBe('1')
    press('ArrowDown')
    expect(ringed()).toBe('3')
    press('ArrowUp')
    expect(ringed()).toBe('1')
    press('ArrowUp')
    expect(ringed()).toBe('8')
    press('ArrowDown')
    expect(ringed()).toBe('1')
  })

  it('one column on a phone: left and right move nothing', async () => {
    columns = 1
    await open('save')
    press('ArrowRight')
    expect(ringed()).toBe('1')
    expect(sounds.move).not.toHaveBeenCalled()
    press('ArrowDown')
    expect(ringed()).toBe('2')
  })

  it('tings when the ring moves and stays silent when nothing moves', async () => {
    slots = slots.map((_, i) => (i === 0 ? made(1, 1) : slot(i + 1)))
    await open('load')
    expect(sounds.move).not.toHaveBeenCalled()
    press('ArrowDown')
    press('ArrowRight')
    expect(ringed()).toBe('1')
    expect(sounds.move).not.toHaveBeenCalled()
  })

  it('Load skips empty and old-version slots', async () => {
    slots[0] = made(1, 3)
    slots[1] = made(2, 9, { outdated: true })
    slots[2] = made(3, 8)
    await open('load')
    expect(ringed()).toBe('3')
    press('ArrowUp')
    expect(ringed()).toBe('1')
    press('ArrowDown')
    expect(ringed()).toBe('3')
    expect(sounds.move).toHaveBeenCalledTimes(2)
  })

  it('the named saves continue the grid', async () => {
    slots[0] = made(1, 3)
    named = [made(-1, 12, { name: 'before the boss' })]
    await open('load')
    expect(ringed()).toBe('✎')
    press('ArrowUp')
    expect(ringed()).toBe('1')
  })

  it('a pointer entering a slot takes the ring', async () => {
    const w = await open('save')
    {
      const stop = w.findAll('.lq-slot-btn')[3]
      await stop.trigger('mousemove', { screenX: 1 })
      await stop.trigger('mousemove', { screenX: 9 })
    }
    expect(ringed()).toBe('4')
  })

  it('Enter on an empty slot saves with no question, and the ring stays there', async () => {
    const w = await open('save')
    press('ArrowRight')
    w.findAll('.lq-slot-btn')[1].element.dispatchEvent(new MouseEvent('click'))
    await flushPromises()
    expect(game.saveToSlot).toHaveBeenCalledWith(2)
    expect(ringed()).toBe('2')
    expect(sounds.choose).toHaveBeenCalledOnce()
  })

  it('a full slot asks with the ring on Cancel; arrows cycle the two buttons; Escape returns', async () => {
    slots = slots.map((_, i) => made(i + 1, 10 + i))
    slots[2] = made(3, 1)
    const w = await open('save')
    await w.findAll('.lq-slot-btn')[2].trigger('click')
    await flushPromises()
    expect(document.activeElement?.textContent?.trim()).toBe('Cancel')
    press('ArrowRight')
    expect(document.activeElement?.textContent?.trim()).toBe('Replace')
    press('ArrowDown')
    expect(document.activeElement?.textContent?.trim()).toBe('Cancel')
    press('ArrowLeft')
    expect(document.activeElement?.textContent?.trim()).toBe('Replace')
    press('Escape')
    await flushPromises()
    expect(ringed()).toBe('3')
    expect(w.find('.lq-ask').exists()).toBe(false)
  })

  it("pointing at the question's other button moves the ring onto it", async () => {
    slots = slots.map((_, i) => made(i + 1, 10 + i))
    const w = await open('save')
    await w.findAll('.lq-slot-btn')[2].trigger('click')
    await flushPromises()
    {
      const stop = w.get('.lq-ask-ok')
      await stop.trigger('mousemove', { screenX: 1 })
      await stop.trigger('mousemove', { screenX: 9 })
    }
    expect(document.activeElement?.textContent?.trim()).toBe('Replace')
    {
      const stop = w.findAll('.lq-slot-btn')[0]
      await stop.trigger('mousemove', { screenX: 1 })
      await stop.trigger('mousemove', { screenX: 9 })
    }
    expect(document.activeElement?.textContent?.trim()).toBe('Replace')
  })

  it('a choice that moves the ring on makes one sound, the latch', async () => {
    slots = slots.map((_, i) => made(i + 1, 10 + i))
    const w = await open('save')
    sounds.move.mockClear()
    await w.findAll('.lq-slot-btn')[2].trigger('click')
    await flushPromises()
    expect(sounds.move).not.toHaveBeenCalled()
  })

  it('with nothing loadable there is no ring, no sound, and the key line says only Esc back', async () => {
    slots[0] = made(1, 3, { outdated: true })
    const w = await open('load')
    expect(document.activeElement).toBe(w.get('.lq-dialog-panel').element)
    press('ArrowDown')
    press('Enter')
    expect(sounds.move).not.toHaveBeenCalled()
    expect(sounds.choose).not.toHaveBeenCalled()
    expect(w.getComponent({ name: 'KeyLine' }).props('hints')).toEqual([
      { keys: ['Esc'], word: 'back' },
    ])
  })

  it('its key line carries the arrows, Enter and Esc', async () => {
    const w = await open('save')
    expect(w.getComponent({ name: 'KeyLine' }).props('hints')).toEqual([
      { keys: ['↑', '↓', '←', '→'], word: 'move' },
      { keys: ['Enter'], word: 'choose' },
      { keys: ['Esc'], word: 'back' },
    ])
  })
})
