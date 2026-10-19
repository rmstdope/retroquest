// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import QuestNewsCard from './QuestNewsCard.vue'

describe('QuestNewsCard', () => {
  it('shows a new side quest as a card', () => {
    const w = mount(QuestNewsCard, {
      props: {
        news: {
          kind: 'new',
          name: 'Hint of Magic',
          main: false,
          text: 'A [character_name]force[/character_name] stirs.',
        },
      },
    })

    expect(w.get('.lq-kicker').text()).toBe('New side quest')
    expect(w.get('.lq-quest-title').text()).toBe('Hint of Magic')
    expect(w.get('.lq-quest-body .theme-character_name').text()).toBe('force')
    expect(w.attributes('aria-label')).toBe('New side quest: Hint of Magic')
  })

  it('names a new main quest', () => {
    const w = mount(QuestNewsCard, {
      props: { news: { kind: 'new', name: 'Shadows', main: true, text: 'x' } },
    })

    expect(w.get('.lq-kicker').text()).toBe('New main quest')
  })

  it('shows an update as a one-line banner that expands', async () => {
    const w = mount(QuestNewsCard, {
      props: {
        news: {
          kind: 'updated',
          name: 'Shadows',
          main: true,
          text: 'Villagers whisper.',
        },
      },
    })
    const banner = w.get('button.lq-update')
    expect(banner.text()).toContain('Quest updated · Shadows')
    expect(banner.attributes('aria-expanded')).toBe('false')
    expect(w.find('.lq-quest-body').exists()).toBe(false)

    await banner.trigger('click')

    expect(banner.attributes('aria-expanded')).toBe('true')
    expect(w.get('.lq-quest-body').text()).toBe('Villagers whisper.')
    expect(banner.text()).toContain('Hide')
  })
})
