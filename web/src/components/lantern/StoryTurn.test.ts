// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StoryTurn from './StoryTurn.vue'
import type { Turn } from '@/stores/useGameStore'

function turn(partial: Partial<Turn>): Turn {
  return {
    id: 1,
    command: null,
    text: '',
    room: 'Village Square',
    roomChanged: false,
    gained: [],
    lost: [],
    ...partial,
  }
}

function mountTurn(partial: Partial<Turn>) {
  return mount(StoryTurn, { props: { turn: turn(partial) } })
}

describe('StoryTurn', () => {
  it('echoes the command the player gave', () => {
    const w = mountTurn({ command: 'take bucket', text: 'Taken.' })

    expect(w.get('[data-testid="command"]').text()).toBe('› take bucket')
  })

  it('shows no echo for system output', () => {
    const w = mountTurn({ text: 'You look around.' })

    expect(w.find('[data-testid="command"]').exists()).toBe(false)
  })

  it('renders narration with its inline tags', () => {
    const w = mountTurn({
      text: 'You find a [item_name]faded photograph[/item_name].',
    })

    const text = w.get('.lq-block-text')
    expect(text.text()).toBe('You find a faded photograph.')
    expect(text.find('.theme-item_name').text()).toBe('faded photograph')
  })

  it('renders events and failures as their own blocks', () => {
    const w = mountTurn({
      text: "[event]You take a look around.[/event]\n[failure]You can't go that way.[/failure]",
    })

    expect(w.get('.lq-block-event').text()).toContain('You take a look around.')
    expect(w.get('.lq-block-failure').text()).toContain(
      "You can't go that way.",
    )
  })

  it('shows dialogue with a capitalised speaker label', () => {
    const w = mountTurn({
      text:
        '[event]You speak with [character_name]innkeeper marcus[/character_name].[/event]\n' +
        "[dialogue]'Welcome, traveller.'[/dialogue]",
    })

    const speech = w.get('.lq-block-dialogue')
    expect(speech.get('.lq-speaker').text()).toBe('Innkeeper Marcus')
    expect(speech.get('.lq-quote').text()).toBe("'Welcome, traveller.'")
  })

  it('shows dialogue without a label when the speaker is unknown', () => {
    const w = mountTurn({ text: "[dialogue]'Who goes there?'[/dialogue]" })

    expect(w.get('.lq-block-dialogue').find('.lq-speaker').exists()).toBe(false)
  })

  it('renders a checklist with done and not-yet items', () => {
    const w = mountTurn({
      text: '[success] * Warm clothing[/success]\n[pending] * Sturdy footwear[/pending]',
    })

    const items = w.findAll('.lq-block-checklist li')
    expect(items).toHaveLength(2)
    expect(items[0].text()).toContain('Warm clothing')
    expect(items[0].text()).toContain('done')
    expect(items[1].text()).toContain('Sturdy footwear')
    expect(items[1].text()).toContain('not yet')
  })

  it('shows gained and lost chips with display names and counts', () => {
    const w = mountTurn({
      command: 'cast greater_heal',
      text: 'Done.',
      gained: [
        { kind: 'item', name: 'bucket', count: 1 },
        { kind: 'spell', name: 'greater_heal', count: 1 },
      ],
      lost: [{ kind: 'item', name: 'coin', count: 2 }],
    })

    const chips = w.findAll('[data-testid="chip"]').map((c) => c.text())
    expect(chips).toEqual(['+ Bucket', '+ Greater Heal', '− Coin ×2'])
    expect(w.get('.lq-chip-spell').text()).toBe('+ Greater Heal')
  })

  it('shows no chip row when nothing changed', () => {
    expect(mountTurn({ text: 'Nothing.' }).find('.lq-chips').exists()).toBe(
      false,
    )
  })
})
