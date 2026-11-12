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

  it('names the room alone, as the current location', () => {
    const w = mount(RoomPlate)
    expect(w.get('h2').text()).toBe('Village Square')
    expect(w.attributes('aria-label')).toBe('Current location')
    expect(w.text()).not.toContain('You are in')
  })

  it('lists no one and nothing that is here: the picture marks them', () => {
    const w = mount(RoomPlate)
    expect(w.find('.lq-here').exists()).toBe(false)
    expect(w.find('[data-name-kind]').exists()).toBe(false)
    expect(w.text()).not.toContain('Villager')
  })

  it('shows while nothing is over the picture, and steps away while something is', async () => {
    const w = mount(RoomPlate)
    expect(w.classes()).not.toContain('lq-plate-away')
    await w.setProps({ away: true })
    expect(w.classes()).toContain('lq-plate-away')
  })

  it('has no Story so far button unless the phone stage asks for it', () => {
    expect(mount(RoomPlate).find('.lq-story-so-far').exists()).toBe(false)
  })

  it('shows "⟲ Story so far" beside the name on the phone stage, and says when it is pressed', async () => {
    const w = mount(RoomPlate, { props: { storyButton: true } })
    expect(w.get('.lq-story-so-far').text()).toBe('⟲ Story so far')
    await w.get('.lq-story-so-far').trigger('click')
    expect(w.emitted('story')).toHaveLength(1)
  })

  it('is smaller on a phone held sideways (compact)', () => {
    expect(mount(RoomPlate, { props: { compact: true } }).classes()).toContain(
      'lq-plate-compact',
    )
    expect(mount(RoomPlate).classes()).not.toContain('lq-plate-compact')
  })
})
