// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import QuitDialog from './QuitDialog.vue'
import { useGameStore } from '@/stores/useGameStore'

describe('QuitDialog', () => {
  let wrapper: VueWrapper | undefined
  let order: string[]

  beforeEach(() => {
    setActivePinia(createPinia())
    const game = useGameStore()
    game.quitAsked = true
    order = []
    vi.spyOn(game, 'saveGame').mockImplementation(() => order.push('save'))
    vi.spyOn(game, 'restartGame').mockImplementation(() =>
      order.push('restart'),
    )
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  function mountQuit() {
    wrapper = mount(QuitDialog, { attachTo: document.body })
    return wrapper
  }

  function button(w: VueWrapper, label: string) {
    return w.findAll('button').find((b) => b.text() === label)!
  }

  it('asks whether to save before quitting', () => {
    const w = mountQuit()

    expect(w.get('[role="dialog"] h2').text()).toBe('Quit game?')
    expect(w.text()).toContain('A new game then starts from Act I.')
  })

  it('saves, then starts again', async () => {
    const w = mountQuit()

    await button(w, 'Save and quit').trigger('click')

    expect(order).toEqual(['save', 'restart'])
  })

  it('starts again without saving', async () => {
    const w = mountQuit()

    await button(w, 'Quit without saving').trigger('click')

    expect(order).toEqual(['restart'])
  })

  it('goes back to the game with Cancel or Escape', async () => {
    const w = mountQuit()
    const game = useGameStore()

    await button(w, 'Cancel').trigger('click')
    expect(game.quitAsked).toBe(false)

    game.quitAsked = true
    await w.get('[role="dialog"]').trigger('keydown', { key: 'Escape' })
    expect(game.quitAsked).toBe(false)
    expect(order).toEqual([])
  })

  it('starts with focus on Cancel', async () => {
    const w = mountQuit()
    await w.vm.$nextTick()

    expect(document.activeElement).toBe(button(w, 'Cancel').element)
  })
})
