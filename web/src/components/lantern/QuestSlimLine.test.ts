// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import QuestSlimLine from './QuestSlimLine.vue'
import type { QuestNews } from '@/lantern/questNews'
import { useGameStore } from '@/stores/useGameStore'

const done: QuestNews = {
  kind: 'completed',
  name: 'Hint of magic',
  main: false,
  text: 'x',
  progress: { completed: 1, total: 11 },
}

describe('QuestSlimLine', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('tells a completion with a tick, no count, the name in bold and the journal link', () => {
    const w = mount(QuestSlimLine, { props: { news: done } })
    expect(w.get('.lq-slim-mark').text()).toBe('✓')
    expect(w.text().replace(/\s+/g, ' ')).toBe(
      '✓ Side quest complete · Hint of magic Open in journal',
    )
    expect(w.get('strong').text()).toBe('Hint of magic')
  })

  it('tells a new quest and an update without a tick', () => {
    const fresh = mount(QuestSlimLine, {
      props: { news: { kind: 'new', name: 'Magic', main: true, text: 'x' } },
    })
    expect(fresh.get('.lq-slim-mark').text()).toBe('')
    expect(fresh.text()).toContain('New main quest · Magic')
    const upd = mount(QuestSlimLine, {
      props: { news: { kind: 'updated', name: 'Cat', main: false, text: 'x' } },
    })
    expect(upd.text()).toContain('Quest updated · Cat')
  })

  it('opens the journal at the quest', async () => {
    const game = useGameStore()
    const w = mount(QuestSlimLine, { props: { news: done } })
    await w.get('button').trigger('click')
    expect(game.questToOpen).toBe('Hint of magic')
  })

  it('describes its button by the line', () => {
    const w = mount(QuestSlimLine, { props: { news: done } })
    const id = w.get('button').attributes('aria-describedby')
    expect(w.get(`[id="${id}"]`).text()).toContain('Hint of magic')
  })
})
