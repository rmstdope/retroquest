// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import QuestCompleteContent from './QuestCompleteContent.vue'

describe('QuestCompleteContent', () => {
  const news = {
    kind: 'completed' as const,
    name: 'Hint of Magic',
    main: false,
    text: 'Your [item_name]journey[/item_name] has begun.',
    progress: { completed: 5, total: 11 },
  }

  it('shows the completion text (its title is in the dialog header)', () => {
    const w = mount(QuestCompleteContent, { props: { news } })

    expect(w.get('.lq-complete-text .theme-item_name').text()).toBe('journey')
    expect(w.find('h2').exists()).toBe(false)
    expect(w.get('.lq-seal').attributes('aria-hidden')).toBe('true')
  })

  it('shows how many quests of the act are done', () => {
    const w = mount(QuestCompleteContent, { props: { news } })

    const bar = w.get('[role="progressbar"]')
    expect(bar.attributes('aria-valuenow')).toBe('5')
    expect(bar.attributes('aria-valuemax')).toBe('11')
    expect(bar.attributes('aria-label')).toBe('Quests completed')
    expect(w.get('.lq-complete-count').text()).toBe('5 of 11 quests')
  })
})
