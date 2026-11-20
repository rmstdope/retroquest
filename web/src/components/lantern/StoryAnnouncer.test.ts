// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import StoryAnnouncer from './StoryAnnouncer.vue'
import { useNarrationStore } from '@/stores/useNarrationStore'
import type { Turn } from '@/stores/useGameStore'

function turn(id: number, text: string): Turn {
  return {
    id,
    command: null,
    text,
    room: 'x',
    description: null,
    gained: [],
    lost: [],
    arrival: null,
  }
}

describe('StoryAnnouncer', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('is a polite, unfocusable log that says nothing for the turns already there', async () => {
    const w = mount(StoryAnnouncer, { props: { turns: [turn(1, 'Old.')] } })
    await nextTick()
    const log = w.get('[role="log"]')
    expect(log.attributes('aria-live')).toBe('polite')
    expect(log.attributes('tabindex')).toBeUndefined()
    expect(w.findAll('p')).toHaveLength(0)
  })

  it('adds one paragraph for each bubble of a new turn, quotes with the speaker first', async () => {
    const w = mount(StoryAnnouncer, { props: { turns: [turn(1, 'Old.')] } })
    await w.setProps({
      turns: [
        turn(1, 'Old.'),
        turn(
          2,
          'You speak with [character_name]Mira[/character_name].\n[dialogue]Hello.[/dialogue]',
        ),
      ],
    })
    await nextTick()
    await nextTick()
    expect(w.findAll('p').map((p) => p.text())).toEqual([
      'You speak with Mira.',
      'Mira: Hello.',
    ])
  })

  it('does not read out the story a load restores', async () => {
    const w = mount(StoryAnnouncer, { props: { turns: [turn(1, 'Old.')] } })
    await w.setProps({
      turns: [{ ...turn(7, 'Restored bubble.'), restored: true as const }],
    })
    await nextTick()
    await nextTick()
    expect(w.findAll('p')).toHaveLength(0)
  })

  it('leaves out a turn the recorded narration voice is telling', async () => {
    const w = mount(StoryAnnouncer, { props: { turns: [] } })
    const narration = useNarrationStore()
    narration.narrates = (id: number): boolean => id === 2
    await w.setProps({ turns: [turn(2, 'Spoken by the voice.')] })
    await nextTick()
    await nextTick()
    expect(w.findAll('p')).toHaveLength(0)
  })
})
