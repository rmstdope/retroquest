// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RoomCard from './RoomCard.vue'
import { useGameStore } from '@/stores/useGameStore'

describe('RoomCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const game = useGameStore()
    game.roomName = 'Village Square'
    game.roomDescription =
      'The heart of [room_name]Willowbrook[/room_name] bustles with life.'
    game.characters = ['villager']
    game.items = ['old notice', 'bucket']
  })

  it('names the room the player is in as a heading', () => {
    const w = mount(RoomCard)

    expect(w.text()).toContain('You are in')
    expect(w.get('h2').text()).toBe('Village Square')
  })

  it('renders the description with its inline tags', () => {
    expect(mount(RoomCard).find('.theme-room_name').text()).toBe('Willowbrook')
  })

  it('lists who and what is here with display names', () => {
    const chips = mount(RoomCard)
      .findAll('.lq-here-chip')
      .map((c) => c.text())

    expect(chips).toEqual(['Villager', 'Old Notice', 'Bucket'])
  })

  it('offers Read more for a long description', async () => {
    useGameStore().roomDescription = 'A long room. '.repeat(40)
    const w = mount(RoomCard)
    const toggle = w.get('button.lq-read-more')

    await toggle.trigger('click')

    expect(toggle.text()).toBe('Show less')
    expect(toggle.attributes('aria-expanded')).toBe('true')
  })
})
