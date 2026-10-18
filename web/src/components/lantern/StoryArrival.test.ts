// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StoryArrival from './StoryArrival.vue'
import type { Arrival } from '@/stores/useGameStore'

const FIELD: Arrival = {
  room: 'Vegetable Field',
  description: 'Rows of withered crops and a [item_name]rusty hoe[/item_name].',
  characters: ['old farmer'],
  items: ['rusty hoe', 'dull knife'],
  exits: { north: "Elior's Cottage", south: 'Chicken Coop' },
}

function mountArrival(command: string | null, arrival: Partial<Arrival> = {}) {
  return mount(StoryArrival, {
    props: { command, arrival: { ...FIELD, ...arrival } },
  })
}

describe('StoryArrival', () => {
  it('names the room and the direction of a move in the divider', () => {
    const divider = mountArrival('go south').get('[data-testid="divider"]')

    expect(divider.text()).toContain('South')
    expect(divider.text()).toContain('Vegetable Field')
  })

  it('understands short move commands', () => {
    expect(mountArrival('n').get('[data-testid="divider"]').text()).toContain(
      'North',
    )
  })

  it('understands every move form the engine accepts', () => {
    const divider = (command: string) =>
      mountArrival(command).get('[data-testid="divider"]').text()

    expect(divider('move west')).toContain('West')
    expect(divider('  GO   East ')).toContain('East')
    expect(divider('go secret_passage')).toContain('Secret Passage')
  })

  it('hides the direction arrows from screen readers', () => {
    const w = mountArrival('go south')
    const arrows = w.findAll('.lq-arrow')

    expect(arrows.length).toBe(3)
    for (const arrow of arrows) {
      expect(arrow.attributes('aria-hidden')).toBe('true')
    }
  })

  it('names non-compass exits readably', () => {
    const exits = mountArrival('go south', {
      exits: { secret_passage: 'Residential Quarter' },
    }).get('[data-testid="exits"]')

    expect(exits.text()).toContain('secret passage')
  })

  it('shows only the room when the arrival was not a move', () => {
    const divider = mountArrival(null).get('[data-testid="divider"]')

    expect(divider.text()).toBe('Vegetable Field')
  })

  it('renders the room description with its inline tags', () => {
    const description = mountArrival('go south').get('.lq-arrival-text')

    expect(description.find('.theme-item_name').text()).toBe('rusty hoe')
  })

  it('lists who and what is here with display names', () => {
    const here = mountArrival('go south').get('[data-testid="here"]')
    const chips = here.findAll('.lq-here-chip').map((c) => c.text())

    expect(chips).toEqual(['Old Farmer', 'Rusty Hoe', 'Dull Knife'])
    expect(here.find('.lq-here-character').text()).toBe('Old Farmer')
  })

  it('lists the exits with their destinations', () => {
    const exits = mountArrival('go south').get('[data-testid="exits"]')

    expect(exits.text()).toContain('north')
    expect(exits.text()).toContain("Elior's Cottage")
    expect(exits.text()).toContain('south')
    expect(exits.text()).toContain('Chicken Coop')
  })

  it('leaves out the here-box parts that are empty', () => {
    const w = mountArrival('go south', { characters: [], items: [], exits: {} })

    expect(w.find('[data-testid="here"]').exists()).toBe(false)
    expect(w.find('[data-testid="exits"]').exists()).toBe(false)
  })

  it('offers Read more for a long description and expands it', async () => {
    const w = mountArrival('go south', {
      description: 'Long text. '.repeat(40),
    })
    const toggle = w.get('button.lq-read-more')
    expect(toggle.text()).toBe('Read more')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(w.get('.lq-arrival-text').classes()).toContain('lq-clamp')

    await toggle.trigger('click')

    expect(toggle.text()).toBe('Show less')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(w.get('.lq-arrival-text').classes()).not.toContain('lq-clamp')
  })

  it('has no Read more for a short description', () => {
    expect(mountArrival('go south').find('button.lq-read-more').exists()).toBe(
      false,
    )
  })

  it('marks the room name as a heading for screen-reader navigation', () => {
    const heading = mountArrival('go south').get('h3')

    expect(heading.text()).toBe('Vegetable Field')
  })

  it('keeps the direction and the room name as separate words', () => {
    const divider = mountArrival('go south').get('[data-testid="divider"]')

    expect(divider.element.textContent).toMatch(/South\s+Vegetable Field/)
  })

  it('links Read more to the description it expands', () => {
    const w = mountArrival('go south', {
      description: 'Long text. '.repeat(40),
    })
    const text = w.get('.lq-arrival-text')

    expect(text.attributes('id')).toBeTruthy()
    expect(w.get('button.lq-read-more').attributes('aria-controls')).toBe(
      text.attributes('id'),
    )
  })
})
