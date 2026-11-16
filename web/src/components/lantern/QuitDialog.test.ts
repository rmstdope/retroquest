// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import QuitDialog from './QuitDialog.vue'
import { useGameStore } from '@/stores/useGameStore'

const sounds = vi.hoisted(() => ({ move: vi.fn(), choose: vi.fn() }))
vi.mock('@/composables/useUiSounds', () => ({
  useUiSounds: () => ({ playMove: sounds.move, playChoose: sounds.choose }),
}))

describe('QuitDialog', () => {
  let wrapper: VueWrapper | undefined
  let order: string[]

  beforeEach(() => {
    setActivePinia(createPinia())
    const game = useGameStore()
    game.quitAsked = true
    order = []
    vi.spyOn(game, 'saveGame').mockImplementation(() => {
      order.push('save')
      return true
    })
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

    expect(w.get('[role="dialog"] h2').text()).toBe('Quit to the main menu?')
    expect(w.get('.lq-dialog-eyebrow').text()).toBe('Menu')
    expect(w.text()).toContain(
      'Save before you go? Anything since your last save is lost otherwise.',
    )
    expect(w.text()).not.toContain('Act')
    expect(w.get('.lq-dialog-layer').classes()).toContain('lq-dialog-centered')
  })

  it('saves, then quits to the main menu', async () => {
    const w = mountQuit()

    await button(w, 'Save and quit').trigger('click')

    expect(order).toEqual(['save', 'restart'])
  })

  it('does not quit when the save fails', async () => {
    const game = useGameStore()
    vi.mocked(game.saveGame).mockImplementation(() => {
      order.push('save')
      return false
    })
    const w = mountQuit()

    await button(w, 'Save and quit').trigger('click')

    expect(order).toEqual(['save'])
    expect(game.quitAsked).toBe(true)
    expect(w.get('[role="alert"]').text()).toContain(
      'could not be saved, so it was not quit',
    )
  })

  it('quits to the main menu without saving', async () => {
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

  describe('from the keyboard', () => {
    function press(key: string): void {
      document.activeElement?.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      )
    }

    beforeEach(() => {
      sounds.move.mockClear()
      sounds.choose.mockClear()
    })

    it('opens with the ring on Cancel', async () => {
      const w = mountQuit()
      await w.vm.$nextTick()
      await w.vm.$nextTick()
      expect(document.activeElement).toBe(button(w, 'Cancel').element)
    })

    it('moves between the buttons with the arrows, wrapping round', async () => {
      const w = mountQuit()
      await w.vm.$nextTick()
      await w.vm.$nextTick()
      press('ArrowRight')
      expect(document.activeElement).toBe(button(w, 'Save and quit').element)
      press('ArrowLeft')
      expect(document.activeElement).toBe(button(w, 'Cancel').element)
      press('ArrowLeft')
      expect(document.activeElement).toBe(
        button(w, 'Quit without saving').element,
      )
      press('ArrowDown')
      expect(document.activeElement).toBe(button(w, 'Cancel').element)
      press('ArrowUp')
      expect(document.activeElement).toBe(
        button(w, 'Quit without saving').element,
      )
    })

    it('a pointer entering a button puts the ring on it', async () => {
      const w = mountQuit()
      await w.vm.$nextTick()
      await button(w, 'Save and quit').trigger('mouseenter')
      expect(document.activeElement).toBe(button(w, 'Save and quit').element)
    })

    it('latches when a button is chosen', async () => {
      const w = mountQuit()
      await button(w, 'Quit without saving').trigger('click')
      expect(sounds.choose).toHaveBeenCalledOnce()
    })

    it('carries the key line for the question', () => {
      const w = mountQuit()
      const hints = w.getComponent({ name: 'KeyLine' }).props('hints')
      expect(hints).toEqual([
        { keys: ['←', '→'], word: 'move' },
        { keys: ['Enter'], word: 'choose' },
        { keys: ['Esc'], word: 'back' },
      ])
    })
  })
})
