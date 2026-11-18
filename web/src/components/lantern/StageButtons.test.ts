// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import StageButtons from './StageButtons.vue'
import { useGameStore } from '@/stores/useGameStore'

describe('StageButtons', () => {
  let w: VueWrapper | undefined
  const mountButtons = (compact = false) =>
    (w = mount(StageButtons, {
      props: { compact },
      attachTo: document.body,
    }))

  beforeEach(() => {
    setActivePinia(createPinia())
    useGameStore().acceptInput = true
  })
  afterEach(() => {
    w?.unmount()
  })

  it('has Hint and the round ☰ only: the journey and the map are in the menu', () => {
    const labels = mountButtons()
      .findAll('button.lq-stage-btn')
      .map((b) => b.text())
    expect(labels).toEqual(['💡 Hint', '☰'])
  })

  it('sends hint from the first button, a round 💡 when compact', async () => {
    const game = useGameStore()
    const submit = vi.spyOn(game, 'submitCommand').mockImplementation(() => {})
    const full = mountButtons().get('[data-button="hint"]')
    await full.trigger('click')
    expect(submit).toHaveBeenCalledWith('hint')
    w?.unmount()
    const round = mountButtons(true).get('[data-button="hint"]')
    expect(round.text()).toBe('💡')
    expect(round.attributes('aria-label')).toBe('Hint')
  })

  it('asks for the menu from ☰, which is named Menu', async () => {
    const w = mountButtons()
    const menu = w.get('[data-button="menu"]')
    expect(menu.attributes('aria-label')).toBe('Menu')
    expect(menu.attributes('title')).toBe('Menu')
    await menu.trigger('click')
    expect(w.emitted('menu')).toHaveLength(1)
  })

  it('has no Bag, Spells, Quests, Story so far or Map button, and nothing to fly to', () => {
    const w = mountButtons()
    for (const name of ['bag', 'spells', 'quests', 'story', 'map'])
      expect(w.find(`[data-button="${name}"]`).exists()).toBe(false)
    expect(w.find('[data-flight-target]').exists()).toBe(false)
    expect(w.find('.lq-compass').exists()).toBe(false)
  })

  it('puts the amber dot on ☰ while a quest has news, and says so', () => {
    expect(mountButtons().find('.lq-dot').exists()).toBe(false)
    w?.unmount()
    useGameStore().questsHaveNew = true
    const menu = mountButtons().get('[data-button="menu"]')
    expect(menu.find('.lq-dot').exists()).toBe(true)
    expect(menu.attributes('aria-label')).toBe('Menu')
    const note = document.getElementById(
      menu.attributes('aria-describedby') ?? '',
    )
    expect(note?.textContent).toBe('A quest has news')
  })
})
