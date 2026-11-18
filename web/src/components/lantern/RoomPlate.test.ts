// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RoomPlate from './RoomPlate.vue'
import { useGameStore } from '@/stores/useGameStore'

describe('RoomPlate', () => {
  let submit: ReturnType<typeof vi.fn<(command: string) => void>>
  beforeEach(() => {
    setActivePinia(createPinia())
    const game = useGameStore()
    game.acceptInput = true
    submit = vi.fn<(command: string) => void>()
    vi.spyOn(game, 'submitCommand').mockImplementation(submit)
    game.roomName = 'Village Square'
    game.characters = ['villager']
    game.items = ['old notice', 'bucket']
  })

  it('names the room alone, as the current location', () => {
    const w = mount(RoomPlate)
    expect(w.get('h2').text()).toBe('Village Square ▾')
    expect(w.attributes('aria-label')).toBe('Current location')
    expect(w.text()).not.toContain('You are in')
  })

  it('lists no one and nothing that is here: the picture marks them', () => {
    const w = mount(RoomPlate)
    expect(w.find('.lq-here').exists()).toBe(false)
    expect(w.find('[data-name-kind]').exists()).toBe(false)
    expect(w.text()).not.toContain('Villager')
  })

  it('shows while nothing is over the picture, and steps away while something is', async () => {
    const w = mount(RoomPlate)
    expect(w.classes()).not.toContain('lq-plate-away')
    await w.setProps({ away: true })
    expect(w.classes()).toContain('lq-plate-away')
  })

  it('has no Journal button unless the phone stage asks for it', () => {
    expect(mount(RoomPlate).find('.lq-story-so-far').exists()).toBe(false)
  })

  it('shows "⟲ Journal" beside the name on the phone stage, and says when it is pressed', async () => {
    const w = mount(RoomPlate, { props: { storyButton: true } })
    expect(w.get('.lq-story-so-far').text()).toBe('⟲ Journal')
    await w.get('.lq-story-so-far').trigger('click')
    expect(w.emitted('story')).toHaveLength(1)
  })

  it('is smaller on a phone held sideways (compact)', () => {
    expect(mount(RoomPlate, { props: { compact: true } }).classes()).toContain(
      'lq-plate-compact',
    )
    expect(mount(RoomPlate).classes()).not.toContain('lq-plate-compact')
  })

  describe('the room name menu', () => {
    const open = async (props: Record<string, unknown> = {}) => {
      const w = mount(RoomPlate, { props, attachTo: document.body })
      await w.get('.lq-name-btn').trigger('click')
      return w
    }
    const pills = (w: ReturnType<typeof mount>) =>
      w.findAll('.lq-pill').map((p) => p.text())

    it('is a button named with what it opens, with ▾ and no pills while folded', () => {
      const w = mount(RoomPlate)
      const name = w.get('.lq-name-btn')
      expect(name.text()).toBe('Village Square ▾')
      expect(name.attributes('aria-label')).toBe(
        'Village Square — Look, Search, Rest, Hint',
      )
      expect(name.attributes('aria-expanded')).toBe('false')
      expect(w.findAll('.lq-pill')).toHaveLength(0)
    })

    it('fans out Look, Search, Rest and Hint, outlines the name and shows ▴', async () => {
      const w = await open()
      expect(pills(w)).toEqual(['👁 Look', '🔍 Search', '💤 Rest', '💡 Hint'])
      expect(w.get('.lq-name-btn').text()).toBe('Village Square ▴')
      expect(w.get('.lq-name-btn').attributes('aria-expanded')).toBe('true')
      expect(w.classes()).toContain('lq-plate-open')
      w.unmount()
    })

    it("sends the pill's command and folds", async () => {
      const w = await open()
      await w.findAll('.lq-pill')[1].trigger('click')
      expect(submit).toHaveBeenCalledWith('search')
      expect(w.findAll('.lq-pill')).toHaveLength(0)
      w.unmount()
    })

    it('asks for a hint from its last pill, as the Hint button did', async () => {
      const w = await open()
      await w.findAll('.lq-pill')[3].trigger('click')
      expect(submit).toHaveBeenCalledWith('hint')
      w.unmount()
    })

    it('folds, doing nothing, when the name is pressed again', async () => {
      const w = await open()
      await w.get('.lq-name-btn').trigger('click')
      expect(w.findAll('.lq-pill')).toHaveLength(0)
      expect(submit).not.toHaveBeenCalled()
      w.unmount()
    })

    it('folds on Escape, giving focus back to the name, and the key is taken', async () => {
      const w = await open()
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      })
      document.dispatchEvent(event)
      await w.vm.$nextTick()
      expect(w.findAll('.lq-pill')).toHaveLength(0)
      expect(event.defaultPrevented).toBe(true)
      expect(document.activeElement).toBe(w.get('.lq-name-btn').element)
      w.unmount()
    })

    it('folds when anything outside the plate is pressed, but not a press on a pill', async () => {
      const w = await open()
      w.get('.lq-pill').element.dispatchEvent(
        new Event('pointerdown', { bubbles: true }),
      )
      await w.vm.$nextTick()
      expect(w.findAll('.lq-pill')).toHaveLength(4)
      document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
      await w.vm.$nextTick()
      expect(w.findAll('.lq-pill')).toHaveLength(0)
      w.unmount()
    })

    it('folds when the room changes, the game restarts or a pop-up opens', async () => {
      const game = useGameStore()
      const w = await open()
      game.roomName = 'Forest Path'
      await w.vm.$nextTick()
      expect(w.findAll('.lq-pill')).toHaveLength(0)
      await w.get('.lq-name-btn').trigger('click')
      game.gameNumber++
      await w.vm.$nextTick()
      expect(w.findAll('.lq-pill')).toHaveLength(0)
      await w.get('.lq-name-btn').trigger('click')
      game.showModal = true
      await w.vm.$nextTick()
      expect(w.findAll('.lq-pill')).toHaveLength(0)
      w.unmount()
    })

    it('puts focus on Look when opened by keyboard, and arrow keys move between the pills', async () => {
      const w = mount(RoomPlate, { attachTo: document.body })
      await w.get('.lq-name-btn').trigger('click')
      await w.vm.$nextTick()
      const items = w.findAll('.lq-pill')
      expect(document.activeElement).toBe(items[0].element)
      await items[0].trigger('keydown', { key: 'ArrowDown' })
      expect(document.activeElement).toBe(items[1].element)
      await items[1].trigger('keydown', { key: 'ArrowUp' })
      expect(document.activeElement).toBe(items[0].element)
      await items[0].trigger('keydown', { key: 'ArrowUp' })
      expect(document.activeElement).toBe(items[3].element)
      w.unmount()
    })

    it('leaves focus where it is when the name is pressed with a pointer', async () => {
      const w = mount(RoomPlate, { attachTo: document.body })
      w.get('.lq-name-btn').element.dispatchEvent(
        new MouseEvent('click', { detail: 1, bubbles: true }),
      )
      await w.vm.$nextTick()
      await w.vm.$nextTick()
      expect(w.findAll('.lq-pill')).toHaveLength(4)
      expect(document.activeElement).not.toBe(w.get('.lq-pill').element)
      w.unmount()
    })

    it('dims the pills while the game takes no command, still focusable, and the name still opens', async () => {
      useGameStore().acceptInput = false
      const w = await open()
      const look = w.get('.lq-pill')
      expect(look.attributes('aria-disabled')).toBe('true')
      expect(look.attributes('disabled')).toBeUndefined()
      await look.trigger('click')
      expect(submit).not.toHaveBeenCalled()
      w.unmount()
    })

    it('folds when a save is loaded into the same room, and when focus leaves the plate', async () => {
      const game = useGameStore()
      const w = await open()
      game.loadNumber++
      await w.vm.$nextTick()
      expect(w.findAll('.lq-pill')).toHaveLength(0)
      await w.get('.lq-name-btn').trigger('click')
      const outside = document.createElement('button')
      document.body.appendChild(outside)
      w.get('.lq-pill').element.dispatchEvent(
        new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }),
      )
      await w.vm.$nextTick()
      expect(w.findAll('.lq-pill')).toHaveLength(0)
      outside.remove()
      w.unmount()
    })

    it('is out of reach while the name is away, and its pills are hurry-able commands', async () => {
      const w = mount(RoomPlate, { props: { away: true } })
      expect(w.get('.lq-name-wrap').attributes('inert')).toBeDefined()
      await w.setProps({ away: false })
      expect(w.get('.lq-name-wrap').attributes('inert')).toBeUndefined()
      await w.get('.lq-name-btn').trigger('click')
      expect(w.get('.lq-pill').attributes('data-hurry')).toBe('command')
      w.unmount()
    })

    it('opens for a room with no picture the same way', async () => {
      const w = await open({ bare: true })
      expect(pills(w)).toHaveLength(4)
      w.unmount()
    })
  })

  it('has no Hint of its own beside Journal: Hint is in the room menu', () => {
    const w = mount(RoomPlate, { props: { storyButton: true } })
    expect(w.find('[data-button="hint"]').exists()).toBe(false)
  })
})
