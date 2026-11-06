// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
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

  it('treats an exit named like an object property as a named exit', () => {
    useGameStore().exits = { north: 'Hall', constructor: 'Odd Place' }

    const other = mountCompass().get('.lq-other-exits [data-dir="constructor"]')
    expect(other.text()).toContain('Odd Place')
    expect(other.get('.lq-exit-dir').text()).toBe('• Constructor')
  })

  it('has no heading beside the story on laptops', () => {
    expect(mountCompass().find('h2').exists()).toBe(false)
  })

  it('can show a Map heading (phone section)', () => {
    wrapper = mount(CompassPanel, { props: { heading: true } })

    expect(wrapper.get('h2').text()).toBe('Map')
  })
})

describe('CompassPanel on the stage', () => {
  it('names the middle cell "Here" only', () => {
    setActivePinia(createPinia())
    useGameStore().roomName = 'Village Square'
    const wrapper = mount(CompassPanel, { props: { stage: true } })
    expect(wrapper.get('.lq-grid .lq-here').text()).toBe('Here')
  })
})

describe('CompassPanel: the bigger map', () => {
  let wrapper: VueWrapper | undefined

  /** Pretend the window is wide (the laptop layout) or narrow. */
  function stubWidth(wide: boolean): void {
    vi.stubGlobal('matchMedia', (media: string) => ({
      matches: wide && media.includes('min-width: 1024px'),
      addEventListener: (): void => {},
      removeEventListener: (): void => {},
    }))
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    const game = useGameStore()
    game.acceptInput = true
    game.roomName = 'Village Well'
    game.exits = { east: 'Forge' }
    game.questProgress = {
      completed: 0,
      total: 1,
      actNumber: 1,
      mainQuest: null,
    }
    game.mapPlaces = [
      {
        key: 'Well',
        name: 'Village Well',
        visited: true,
        current: true,
        exits: { east: { to: 'Forge', label: 'Forge' } },
      },
      {
        key: 'Forge',
        name: 'Forge',
        visited: false,
        current: false,
        exits: {},
      },
    ]
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    vi.unstubAllGlobals()
  })

  function mountStage(): VueWrapper {
    wrapper = mount(CompassPanel, {
      props: { stage: true },
      attachTo: document.body,
    })
    return wrapper
  }

  it('has a full-width Bigger map button under the compass on a wide stage', () => {
    stubWidth(true)
    const button = mountStage().get('[data-bigger-map]')
    expect(button.text()).toBe('⤢ Bigger map')
  })

  it('has no button on a narrow window or beside the story', () => {
    stubWidth(false)
    expect(mountStage().find('[data-bigger-map]').exists()).toBe(false)
    wrapper?.unmount()
    stubWidth(true)
    wrapper = mount(CompassPanel)
    expect(wrapper.find('[data-bigger-map]').exists()).toBe(false)
  })

  it('opens the bigger map, and closing it gives focus back to the button', async () => {
    stubWidth(true)
    const w = mountStage()
    await w.get('[data-bigger-map]').trigger('click')
    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog?.textContent).toContain('Map')
    expect(dialog?.textContent).toContain('You are here')
    document.querySelector<HTMLButtonElement>('.lq-dialog-close')?.click()
    await nextTick()
    await nextTick()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(document.activeElement).toBe(w.get('[data-bigger-map]').element)
    expect(w.find('.lq-grid').exists()).toBe(true)
  })

  it('is still pressable while the game is busy', () => {
    stubWidth(true)
    useGameStore().acceptInput = false
    expect(
      mountStage().get('[data-bigger-map]').attributes('disabled'),
    ).toBeUndefined()
  })
})
