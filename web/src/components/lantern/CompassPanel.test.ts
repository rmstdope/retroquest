// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CompassPanel from './CompassPanel.vue'
import { useGameStore } from '@/stores/useGameStore'

describe('CompassPanel', () => {
  let wrapper: VueWrapper | undefined
  let submit: ReturnType<typeof vi.fn<(command: string) => void>>

  beforeEach(() => {
    setActivePinia(createPinia())
    const game = useGameStore()
    game.acceptInput = true
    game.roomName = 'Village Square'
    game.exits = {
      north: "Mira's Hut",
      east: 'General Store',
      up: 'Bell Tower',
      secret_passage: 'Hidden Library',
    }
    submit = vi.fn<(command: string) => void>()
    vi.spyOn(game, 'submitCommand').mockImplementation(submit)
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  function mountCompass() {
    wrapper = mount(CompassPanel)
    return wrapper
  }

  it('places compass exits around the current room', () => {
    const w = mountCompass()

    expect(w.get('[data-dir="north"]').attributes('aria-label')).toBe(
      "Go north to Mira's Hut",
    )
    expect(w.get('[data-dir="east"]').text()).toContain('General Store')
    expect(w.get('.lq-here').text()).toContain('Village Square')
    expect(w.find('[data-dir="south"]').exists()).toBe(false)
  })

  it('moves when an exit is pressed', async () => {
    const w = mountCompass()

    await w.get('[data-dir="north"]').trigger('click')

    expect(submit).toHaveBeenCalledWith('go north')
  })

  it('shows up and down in the grid too', () => {
    expect(mountCompass().get('[data-dir="up"]').text()).toContain('Bell Tower')
  })

  it('lists exits that are not compass directions below the grid', async () => {
    const w = mountCompass()
    const other = w.get('.lq-other-exits [data-dir="secret_passage"]')

    expect(other.text()).toContain('Secret Passage')
    expect(other.text()).toContain('Hidden Library')
    await other.trigger('click')
    expect(submit).toHaveBeenCalledWith('go secret_passage')
  })

  it('disables the exits while the game is not accepting input', () => {
    useGameStore().acceptInput = false

    expect(
      mountCompass().get('[data-dir="north"]').attributes(),
    ).toHaveProperty('disabled')
  })

  it('says when there is no way out', () => {
    useGameStore().exits = {}

    expect(mountCompass().text()).toContain('No exits')
  })
})
