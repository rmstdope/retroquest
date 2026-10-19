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

  it('names the completed quest as the dialog title', () => {
    const w = mount(QuestCompleteContent, {
      props: { news, titleId: 'lq-dialog-title' },
    })

    expect(w.get('.lq-kicker').text()).toBe('Side quest complete')
    const title = w.get('h2')
    expect(title.text()).toBe('Hint of Magic')
    expect(title.attributes('id')).toBe('lq-dialog-title')
    expect(w.get('.lq-complete-text .theme-item_name').text()).toBe('journey')
  })

  it('shows how many quests of the act are done', () => {
    const w = mount(QuestCompleteContent, {
      props: { news, titleId: 't' },
    })

    const bar = w.get('[role="progressbar"]')
    expect(bar.attributes('aria-valuenow')).toBe('5')
    expect(bar.attributes('aria-valuemax')).toBe('11')
    expect(bar.attributes('aria-label')).toBe('Quests completed')
    expect(w.get('.lq-complete-count').text()).toBe('5 of 11 quests')
  })

  it('says main quest for the act main quest', () => {
    const w = mount(QuestCompleteContent, {
      props: { news: { ...news, main: true }, titleId: 't' },
    })

    expect(w.get('.lq-kicker').text()).toBe('Main quest complete')
  })
})
