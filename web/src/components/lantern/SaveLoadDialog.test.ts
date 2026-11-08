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
  let named: SaveSlot[]

  beforeEach(() => {
    setActivePinia(createPinia())
    const game = useGameStore()
    slots = Array.from({ length: 8 }, (_, i) => slot(i + 1, i === 1))
    vi.spyOn(game, 'getSaveSlots').mockImplementation(() => slots)
    named = []
    vi.spyOn(game, 'getNamedSaves').mockImplementation(() => named)
    vi.spyOn(game, 'loadNamedGame').mockImplementation(() => {})
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

  it('closes, with no failure, when the save opens the act page waiting for narration', async () => {
    const game = useGameStore()
    game.actEndPending = true
    vi.mocked(game.saveToSlot).mockReturnValue(false)
    const w = mountDialog('save')

    await card(w, '1').get('button').trigger('click')

    expect(game.saveToSlot).toHaveBeenCalledWith(1)
    expect(w.find('[role="alert"]').exists()).toBe(false)
    expect(w.emitted('close')).toHaveLength(1)
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

  describe('a save from an older version', () => {
    const REASON = "Made by an older version · can't be loaded"

    beforeEach(() => {
      slots[2] = {
        slot: 3,
        act: 'Act 3',
        room: 'The Whispering Marsh',
        timestamp: null,
        quests: null,
        outdated: true,
      }
      vi.mocked(useGameStore().getQuickSave).mockReturnValue({
        ...slot(0, true),
        outdated: true,
      })
    })

    it('is dimmed with its reason and cannot be picked when loading', async () => {
      const w = mountDialog('load')
      const old = card(w, '3')

      expect(old.classes()).toContain('lq-slot-old')
      expect(old.text()).toContain('Act III')
      expect(old.text()).toContain('The Whispering Marsh')
      expect(old.get('.lq-slot-why').text()).toBe(REASON)
      expect(old.find('.lq-slot-lock').exists()).toBe(true)
      expect(old.get('button').attributes()).toHaveProperty('disabled')
      expect(old.get('button').attributes('aria-label')).toBe(
        `Load slot 3: Act III, The Whispering Marsh. ${REASON}`,
      )
      expect(card(w, 'Q').get('button').attributes()).toHaveProperty('disabled')
      expect(card(w, 'Q').get('.lq-slot-why').text()).toBe(REASON)

      await old.get('button').trigger('click')
      expect(old.find('[role="group"]').exists()).toBe(false)
      expect(useGameStore().loadFromSlot).not.toHaveBeenCalled()
    })

    it('leaves loadable saves and the top line as they are', () => {
      const w = mountDialog('load')

      expect(w.get('.lq-intro').text()).toBe('Pick a save to go back to.')
      const good = card(w, '2')
      expect(good.classes()).not.toContain('lq-slot-old')
      expect(good.find('.lq-slot-why').exists()).toBe(false)
      expect(good.get('button').attributes()).not.toHaveProperty('disabled')
    })

    it('asks before replacing it when saving, and is a normal save after', async () => {
      const w = mountDialog('save')
      const old = card(w, '3')

      expect(old.get('.lq-slot-why').text()).toBe(REASON)
      expect(old.get('button').attributes()).not.toHaveProperty('disabled')
      await old.get('button').trigger('click')
      const ask = old.get('[role="group"]')
      expect(ask.text()).toContain('Replace this save with your current game?')
      expect(useGameStore().saveToSlot).not.toHaveBeenCalled()

      await ask
        .findAll('button')
        .find((b) => b.text() === 'Replace')!
        .trigger('click')

      expect(useGameStore().saveToSlot).toHaveBeenCalledWith(3)
      expect(card(w, '3').classes()).not.toContain('lq-slot-old')
      expect(card(w, '3').text()).toContain('Just saved')
    })
  })

  describe('opened from the title page', () => {
    it('loads a picked save at once, with no question', async () => {
      const game = useGameStore()
      const load = vi.spyOn(game, 'loadFromTitle').mockReturnValue(true)
      const w = mount(SaveLoadDialog, {
        props: { mode: 'load', fromTitle: true },
        attachTo: document.body,
      })
      wrapper = w
      await w.get('[data-slot="2"] .lq-slot-btn').trigger('click')

      expect(load).toHaveBeenCalledWith(2)
      expect(w.find('.lq-ask').exists()).toBe(false)
      expect(w.emitted('close')).toHaveLength(1)
    })

    it('loads the quick save as slot 0', async () => {
      const game = useGameStore()
      const load = vi.spyOn(game, 'loadFromTitle').mockReturnValue(true)
      const w = mount(SaveLoadDialog, {
        props: { mode: 'load', fromTitle: true },
        attachTo: document.body,
      })
      wrapper = w
      await w.get('[data-slot="0"] .lq-slot-btn').trigger('click')
      expect(load).toHaveBeenCalledWith(0)
    })

    it('stays open and says why when the load fails', async () => {
      const game = useGameStore()
      vi.spyOn(game, 'loadFromTitle').mockImplementation(() => {
        game.titleLoadError = 'No save file found.'
        return false
      })
      const w = mount(SaveLoadDialog, {
        props: { mode: 'load', fromTitle: true },
        attachTo: document.body,
      })
      wrapper = w
      await w.get('[data-slot="2"] .lq-slot-btn').trigger('click')

      expect(w.emitted('close')).toBeUndefined()
      expect(w.get('[role="alert"]').text()).toBe('No save file found.')
    })
  })
  describe('saves you named', () => {
    const mirrors: SaveSlot = {
      slot: -1,
      name: 'before-the-mirrors',
      act: 'Act 3',
      room: 'Mount Ember',
      timestamp: new Date(2026, 9, 19, 14, 51).toISOString(),
      quests: { completed: 5, total: 7 },
    }
    const oldrun: SaveSlot = {
      slot: -1,
      name: 'oldrun',
      act: null,
      room: null,
      timestamp: new Date(2026, 10, 3, 20, 5).toISOString(),
      quests: null,
    }

    function namedCard(w: VueWrapper, name: string) {
      const found = w
        .findAll('.lq-named .lq-slot')
        .find((c) => c.text().includes(name))
      if (!found) throw new Error(`No named save ${name}`)
      return found
    }

    it('shows no heading and no list when there are none', () => {
      const w = mountDialog('load')
      expect(w.find('.lq-named').exists()).toBe(false)
      expect(w.text()).not.toContain('Saves you named')
    })

    it('lists them under a heading, in the order given, below the slots', () => {
      named = [mirrors, oldrun]
      const w = mountDialog('load')
      expect(w.get('h3').text()).toBe('Saves you named')
      const cards = w.findAll('.lq-named .lq-slot')
      expect(cards).toHaveLength(2)
      expect(cards[0].get('.lq-slot-badge').text()).toBe('✎')
      expect(cards[0].text()).toContain('before-the-mirrors')
      expect(cards[0].text()).toContain('Act III · Mount Ember')
      expect(cards[0].text()).toContain('5 of 7 quests')
      expect(cards[0].text()).toContain('14:51')
      expect(w.findAll('.lq-slots')[0].findAll('.lq-slot')).toHaveLength(9)
    })

    it('names the card for screen readers, with and without details', () => {
      named = [mirrors, oldrun]
      const w = mountDialog('load')
      expect(
        namedCard(w, 'before-the-mirrors')
          .get('button')
          .attributes('aria-label'),
      ).toMatch(
        /^Load before-the-mirrors: Act III, Mount Ember, 5 of 7 quests, .*14:51$/,
      )
      expect(
        namedCard(w, 'oldrun').get('button').attributes('aria-label'),
      ).toMatch(/^Load oldrun: 3 Nov · 20:05$/)
    })

    it('is not listed when saving', () => {
      named = [mirrors]
      const w = mountDialog('save')
      expect(w.find('.lq-named').exists()).toBe(false)
    })

    it('asks first in the game, with focus on Cancel, then loads by name', async () => {
      named = [mirrors]
      const w = mountDialog('load')
      const c = namedCard(w, 'before-the-mirrors')
      await c.get('button').trigger('click')
      expect(c.get('[role="group"]').attributes('aria-label')).toBe(
        'Load before-the-mirrors',
      )
      expect(c.get('.lq-ask-text').text()).toBe(
        'Load this save? Anything since your last save is lost.',
      )
      expect(document.activeElement?.textContent?.trim()).toBe('Cancel')
      await c
        .findAll('[role="group"] button')
        .find((b) => b.text() === 'Load')!
        .trigger('click')
      expect(useGameStore().loadNamedGame).toHaveBeenCalledWith(
        'before-the-mirrors',
      )
      expect(w.emitted('close')).toHaveLength(1)
    })

    it('cancels the question with Escape before closing', async () => {
      named = [mirrors]
      const w = mountDialog('load')
      const c = namedCard(w, 'before-the-mirrors')
      await c.get('button').trigger('click')
      await c.get('[role="group"]').trigger('keydown', { key: 'Escape' })
      expect(c.find('[role="group"]').exists()).toBe(false)
      expect(w.emitted('close')).toBeUndefined()
    })

    it('loads at once from the title page, by name', async () => {
      named = [mirrors]
      const game = useGameStore()
      const load = vi.spyOn(game, 'loadFromTitle').mockReturnValue(true)
      const w = mount(SaveLoadDialog, {
        props: { mode: 'load', fromTitle: true },
        attachTo: document.body,
      })
      wrapper = w
      await namedCard(w, 'before-the-mirrors').get('button').trigger('click')
      expect(load).toHaveBeenCalledWith(-1, 'before-the-mirrors')
      expect(w.find('.lq-ask').exists()).toBe(false)
      expect(w.emitted('close')).toHaveLength(1)
    })

    it('stays open and shows the line when a title load fails', async () => {
      named = [mirrors]
      const game = useGameStore()
      vi.spyOn(game, 'loadFromTitle').mockImplementation(() => {
        game.titleLoadError = 'No save file found.'
        return false
      })
      const w = mount(SaveLoadDialog, {
        props: { mode: 'load', fromTitle: true },
        attachTo: document.body,
      })
      wrapper = w
      await namedCard(w, 'before-the-mirrors').get('button').trigger('click')
      expect(w.emitted('close')).toBeUndefined()
      expect(w.get('[role="alert"]').text()).toBe('No save file found.')
    })

    it('dims one from an older version, with its reason, and cannot be picked', () => {
      named = [{ ...mirrors, outdated: true }]
      const w = mountDialog('load')
      const c = namedCard(w, 'before-the-mirrors')
      expect(c.classes()).toContain('lq-slot-old')
      expect(c.text()).toContain("Made by an older version · can't be loaded")
      expect(c.text()).toContain('⊘')
      expect(c.get('button').attributes()).toHaveProperty('disabled')
      expect(c.get('button').attributes('aria-label')).toMatch(
        /\. Made by an older version · can't be loaded$/,
      )
    })
  })
})
