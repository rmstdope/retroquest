// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RoomPlate from './RoomPlate.vue'
import { useGameStore } from '@/stores/useGameStore'

describe('RoomPlate', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const game = useGameStore()
    game.roomName = 'Village Square'
    game.characters = ['villager']
    game.items = ['old notice', 'bucket']
  })

  it('says "You are in" over the room name', () => {
    const w = mount(RoomPlate)
    expect(w.text()).toContain('You are in')
    expect(w.get('h2').text()).toBe('Village Square')
  })

  it('lists who and what is here, characters blue and items green', () => {
    const chips = mount(RoomPlate).findAll('.lq-here-chip')
    expect(chips.map((c) => c.text())).toEqual([
      'Villager',
      'Old Notice',
      'Bucket',
    ])
    expect(chips[0].classes()).toContain('lq-here-character')
    expect(chips[1].classes()).toContain('lq-here-item')
  })

  it('carries what the name menu needs on each chip', () => {
    const chip = mount(RoomPlate).get('.lq-here-chip')
    expect(chip.attributes('data-name-kind')).toBe('character')
    expect(chip.attributes('data-name')).toBe('villager')
    expect(chip.attributes('aria-haspopup')).toBe('menu')
  })

  it('keeps chips of one name apart', () => {
    useGameStore().items = ['lantern', 'lantern', 'lantern']
    useGameStore().characters = []
    expect(mount(RoomPlate).findAll('.lq-here-chip')).toHaveLength(3)
  })

  it('shows only the name when nothing is here', () => {
    const game = useGameStore()
    game.characters = []
    game.items = []
    const w = mount(RoomPlate)
    expect(w.find('.lq-here').exists()).toBe(false)
    expect(w.get('h2').text()).toBe('Village Square')
  })
})
