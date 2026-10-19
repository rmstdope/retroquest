// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GameMenu from './GameMenu.vue'
import { useGameStore } from '@/stores/useGameStore'

describe('GameMenu', () => {
  let wrapper: VueWrapper | undefined

  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  function mountMenu() {
    wrapper = mount(GameMenu, { attachTo: document.body })
    return wrapper
  }

  function item(w: VueWrapper, label: string) {
    const found = w.findAll('button').find((b) => b.text().startsWith(label))
    if (!found) throw new Error(`No ${label}`)
    return found
  }

  it('is the game menu dialog', () => {
    const w = mountMenu()

    expect(w.get('[role="dialog"] h2').text()).toBe('Game')
  })

  it('saves and loads quickly, then closes', async () => {
    const game = useGameStore()
    const save = vi.spyOn(game, 'saveGame').mockImplementation(() => true)
    const load = vi.spyOn(game, 'loadGame').mockImplementation(() => {})
    const w = mountMenu()

    await item(w, 'Quick save').trigger('click')
    await item(w, 'Quick load').trigger('click')

    expect(save).toHaveBeenCalledOnce()
    expect(load).toHaveBeenCalledOnce()
    expect(w.emitted('close')).toHaveLength(2)
  })

  it('opens Save, Load, Stats and Help', async () => {
    const w = mountMenu()

    await item(w, 'Save game').trigger('click')
    await item(w, 'Load game').trigger('click')
    await item(w, 'Stats').trigger('click')
    await item(w, 'Help').trigger('click')

    expect(w.emitted('open')).toEqual([['save'], ['load'], ['stats'], ['help']])
  })

  it('closes with its close button', async () => {
    const w = mountMenu()

    await w.get('button[aria-label="Close"]').trigger('click')

    expect(w.emitted('close')).toHaveLength(1)
  })
})
