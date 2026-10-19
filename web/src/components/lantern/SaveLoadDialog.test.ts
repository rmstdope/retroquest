// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SaveLoadDialog from './SaveLoadDialog.vue'
import { useGameStore } from '@/stores/useGameStore'
import type { SaveSlot } from '@/types/bridge'

function slot(n: number, filled: boolean): SaveSlot {
  return filled
    ? {
        slot: n,
        act: 'Act 2',
        room: 'Forest Path',
        timestamp: null,
        quests: { completed: 3, total: 12 },
      }
    : { slot: n, act: null, room: null, timestamp: null, quests: null }
}

describe('SaveLoadDialog', () => {
  let wrapper: VueWrapper | undefined
  let slots: SaveSlot[]

  beforeEach(() => {
    setActivePinia(createPinia())
    const game = useGameStore()
    slots = Array.from({ length: 8 }, (_, i) => slot(i + 1, i === 1))
    vi.spyOn(game, 'getSaveSlots').mockImplementation(() => slots)
    vi.spyOn(game, 'getQuickSave').mockReturnValue({
      ...slot(0, true),
      room: 'Village Square',
    })
    vi.spyOn(game, 'saveToSlot').mockImplementation((n: number) => {
      slots[n - 1] = slot(n, true)
      return true
    })
    vi.spyOn(game, 'loadFromSlot').mockImplementation(() => {})
    vi.spyOn(game, 'loadGame').mockImplementation(() => {})
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  function mountDialog(mode: 'save' | 'load') {
    wrapper = mount(SaveLoadDialog, {
      props: { mode },
      attachTo: document.body,
    })
    return wrapper
  }

  function card(w: VueWrapper, badge: string) {
    const found = w
      .findAll('.lq-slot')
      .find((c) => c.get('.lq-slot-badge').text() === badge)
    if (!found) throw new Error(`No slot ${badge}`)
    return found
  }

  it('shows each save with its act, room and quests', () => {
    const w = mountDialog('save')

    expect(w.get('[role="dialog"] h2').text()).toBe('Save game')
    expect(w.findAll('.lq-slot')).toHaveLength(8)
    const filled = card(w, '2')
    expect(filled.text()).toContain('Act II')
    expect(filled.text()).toContain('Forest Path')
    expect(filled.text()).toContain('3 of 12 quests')
    expect(card(w, '1').text()).toContain('Empty slot · tap to save here')
  })

  it('saves to an empty slot at once and marks it', async () => {
    const w = mountDialog('save')

    await card(w, '1').get('button').trigger('click')

    expect(useGameStore().saveToSlot).toHaveBeenCalledWith(1)
    expect(card(w, '1').text()).toContain('Just saved')
    expect(w.emitted('close')).toBeUndefined()
  })

  it('says so, and marks nothing, when a save fails', async () => {
    vi.mocked(useGameStore().saveToSlot).mockReturnValue(false)
    const w = mountDialog('save')

    await card(w, '1').get('button').trigger('click')

    expect(card(w, '1').text()).not.toContain('Just saved')
    expect(card(w, '1').text()).toContain('Empty slot')
    expect(w.get('[role="alert"]').text()).toContain('could not be saved')
    expect(w.emitted('close')).toBeUndefined()
  })

  it('asks in the card before replacing a save', async () => {
    const w = mountDialog('save')
    const filled = card(w, '2')

    await filled.get('button').trigger('click')
    const ask = filled.get('[role="group"]')
    expect(ask.attributes('aria-label')).toBe('Replace slot 2')
    expect(ask.text()).toContain('Replace this save with your current game?')
    expect(useGameStore().saveToSlot).not.toHaveBeenCalled()

    await ask
      .findAll('button')
      .find((b) => b.text() === 'Replace')!
      .trigger('click')
    expect(useGameStore().saveToSlot).toHaveBeenCalledWith(2)
  })

  it('puts focus on Cancel when it asks', async () => {
    const w = mountDialog('save')
    const filled = card(w, '2')

    await filled.get('button').trigger('click')
    await w.vm.$nextTick()

    expect(document.activeElement?.textContent?.trim()).toBe('Cancel')
  })

  it('keeps focus on the slot after replacing it', async () => {
    const w = mountDialog('save')
    await card(w, '2').get('button').trigger('click')
    await w.vm.$nextTick()

    await card(w, '2')
      .findAll('[role="group"] button')
      .find((b) => b.text() === 'Replace')!
      .trigger('click')
    await w.vm.$nextTick()

    expect(document.activeElement).toBe(card(w, '2').get('button').element)
  })

  it('cancels the question with Escape before closing', async () => {
    const w = mountDialog('save')
    const filled = card(w, '2')
    await filled.get('button').trigger('click')
    await w.vm.$nextTick()

    await filled.get('.lq-ask-cancel').trigger('keydown', { key: 'Escape' })

    expect(filled.find('[role="group"]').exists()).toBe(false)
    expect(w.emitted('close')).toBeUndefined()
    await w.vm.$nextTick()
    expect(document.activeElement).toBe(card(w, '2').get('button').element)
  })

  it('cancels the question', async () => {
    const w = mountDialog('save')
    const filled = card(w, '2')
    await filled.get('button').trigger('click')

    await filled
      .findAll('[role="group"] button')
      .find((b) => b.text() === 'Cancel')!
      .trigger('click')

    expect(filled.find('[role="group"]').exists()).toBe(false)
    await w.vm.$nextTick()
    expect(document.activeElement).toBe(card(w, '2').get('button').element)
  })

  it('lists the quick save first when loading, and empty slots cannot be picked', () => {
    const w = mountDialog('load')

    expect(w.get('[role="dialog"] h2').text()).toBe('Load game')
    const badges = w.findAll('.lq-slot-badge').map((b) => b.text())
    expect(badges[0]).toBe('Q')
    expect(badges).toHaveLength(9)
    expect(card(w, '1').get('button').attributes()).toHaveProperty('disabled')
  })

  it('loads after asking, then closes', async () => {
    const w = mountDialog('load')
    const quick = card(w, 'Q')
    await quick.get('button').trigger('click')
    expect(quick.get('[role="group"]').text()).toContain(
      'Anything since your last save is lost.',
    )

    await quick
      .findAll('[role="group"] button')
      .find((b) => b.text() === 'Load')!
      .trigger('click')

    expect(useGameStore().loadGame).toHaveBeenCalledOnce()
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('loads a slot', async () => {
    const w = mountDialog('load')
    const filled = card(w, '2')
    await filled.get('button').trigger('click')

    await filled
      .findAll('[role="group"] button')
      .find((b) => b.text() === 'Load')!
      .trigger('click')

    expect(useGameStore().loadFromSlot).toHaveBeenCalledWith(2)
  })

  it('loads an older quick save that has no details', async () => {
    vi.mocked(useGameStore().getQuickSave).mockReturnValue(slot(0, false))
    const w = mountDialog('load')
    const quick = card(w, 'Q')

    expect(quick.get('button').attributes()).not.toHaveProperty('disabled')
    expect(quick.get('button').attributes('aria-label')).toBe(
      'Load the quick save',
    )
    await quick.get('button').trigger('click')
    await quick
      .findAll('[role="group"] button')
      .find((b) => b.text() === 'Load')!
      .trigger('click')

    expect(useGameStore().loadGame).toHaveBeenCalledOnce()
  })

  it('names a card with its quests and time', () => {
    slots[1] = { ...slot(2, true), timestamp: new Date().toISOString() }
    const w = mountDialog('load')

    expect(card(w, '2').get('button').attributes('aria-label')).toMatch(
      /^Load slot 2: Act II, Forest Path, 3 of 12 quests, Today · \d\d:\d\d$/,
    )
  })

  it('says where the saves are kept', () => {
    expect(mountDialog('save').text()).toContain(
      'Saves are kept in this browser only.',
    )
  })
})
