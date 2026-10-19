// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DockBar from './DockBar.vue'
import { useGameStore } from '@/stores/useGameStore'

describe('DockBar', () => {
  let submit: ReturnType<typeof vi.fn<(command: string) => void>>

  beforeEach(() => {
    setActivePinia(createPinia())
    const game = useGameStore()
    game.acceptInput = true
    game.exits = { north: "Mira's Hut", secret_passage: 'Hidden Library' }
    submit = vi.fn<(command: string) => void>()
    vi.spyOn(game, 'submitCommand').mockImplementation(submit)
  })

  it('offers the exits as small arrow buttons', async () => {
    const w = mount(DockBar)
    const north = w.get(`button[aria-label="Go north to Mira's Hut"]`)

    expect(north.text()).toBe('↑')
    await north.trigger('click')
    expect(submit).toHaveBeenCalledWith('go north')
    expect(
      w
        .find('button[aria-label="Go secret passage to Hidden Library"]')
        .exists(),
    ).toBe(true)
  })

  it('opens the actions', async () => {
    const w = mount(DockBar)

    await w.get('button.lq-dock-open').trigger('click')

    expect(w.get('button.lq-dock-open').text()).toBe('Actions ▴')
    expect(w.emitted('open')).toEqual([['actions']])
  })

  it('opens straight into typing', async () => {
    const w = mount(DockBar)

    await w.get('button[aria-label="Type a command"]').trigger('click')

    expect(w.emitted('open')).toEqual([['type']])
  })

  it('disables the exits while the game is not accepting input', () => {
    useGameStore().acceptInput = false

    expect(
      mount(DockBar).get('button[aria-label^="Go north"]').attributes(),
    ).toHaveProperty('disabled')
  })

  it('can put focus on the Actions button', () => {
    const w = mount(DockBar, { attachTo: document.body })

    ;(w.vm as unknown as { focus: () => void }).focus()

    expect(document.activeElement).toBe(w.get('button.lq-dock-open').element)
    w.unmount()
  })
})
