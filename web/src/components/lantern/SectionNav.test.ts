// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SectionNav, { type Section } from './SectionNav.vue'
import { useGameStore } from '@/stores/useGameStore'

describe('SectionNav', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function mountNav(modelValue: Section = 'story') {
    return mount(SectionNav, { props: { modelValue } })
  }

  it('offers Story, Bag, Spells, Quests and Map', () => {
    const labels = mountNav()
      .findAll('button')
      .map((b) => b.text())

    expect(labels).toEqual(['Story', 'Bag', 'Spells', 'Quests', 'Map'])
  })

  it('marks the current section', () => {
    const w = mountNav('map')

    expect(w.get('[aria-current="page"]').text()).toBe('Map')
    expect(w.findAll('[aria-current="page"]')).toHaveLength(1)
  })

  it('picks a section', async () => {
    const w = mountNav()

    await w.findAll('button')[2].trigger('click')

    expect(w.emitted('update:modelValue')).toEqual([['spells']])
  })

  it('shows a dot on Bag and Spells when something is new', () => {
    const game = useGameStore()
    game.bagHasNew = true
    game.spellsHaveNew = true
    const w = mountNav()

    const buttons = w.findAll('button')
    expect(buttons[1].find('.lq-dot').exists()).toBe(true)
    expect(buttons[1].text()).toBe('Bag (new)')
    expect(buttons[2].find('.lq-dot').exists()).toBe(true)
    expect(buttons[3].find('.lq-dot').exists()).toBe(false)
  })

  it('shows a dot on Quests when there is quest news', () => {
    useGameStore().questsHaveNew = true

    expect(mountNav().findAll('button')[3].text()).toBe('Quests (new)')
  })
})
