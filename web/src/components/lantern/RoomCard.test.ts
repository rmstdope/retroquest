// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RoomCard from './RoomCard.vue'
import { useGameStore } from '@/stores/useGameStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { narrationKey } from '@/lantern/narrationKey'
import { narrationWords } from '@/lantern/narrationManifest'
import { SCENE_PAUSE_MS, turnUnits } from '@/lantern/narrationUnits'

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

  it('stays silent and cut while the room is read in the story', async () => {
    const game = useGameStore()
    const description = 'A long room. '.repeat(40).trim()
    game.roomDescription = description
    const arrival = {
      room: 'Village Square',
      description,
      characters: [],
      items: [],
      exits: {},
    }
    game.turns = [
      {
        id: 4,
        command: 'go north',
        text: 'You go north.',
        room: 'Village Square',
        description: { moved: true, firstVisit: false },
        gained: [],
        lost: [],
        arrival,
      },
    ]
    const clipOf = (markup: string) => ({
      file: 'a.mp3',
      speaker: 'narrator',
      duration: 5,
      words: narrationWords(markup).map((word, i) => ({
        word,
        start: i,
        end: i + 1,
      })),
    })
    const manifest = {
      [narrationKey('narrator', 'Village Square')]: clipOf('Village Square'),
      [narrationKey('narrator', description)]: clipOf(description),
    }
    const narration = useNarrationStore()
    narration.setAudioFactory(() => ({
      play: () => Promise.resolve(),
      pause: () => undefined,
      volume: 1,
      currentTime: 0,
      onended: null,
      onerror: null,
    }))
    const w = mount(RoomCard)
    narration.begin(
      4,
      turnUnits({ text: 'You go north.', arrival }, true, manifest),
      'act1',
    )
    await new Promise((r) => setTimeout(r, SCENE_PAUSE_MS + 50))
    await nextTick()
    expect(narration.speaking(4)?.unit).toBe(1)
    expect(w.get('.lq-room-card').classes()).not.toContain('lq-speaking')
    expect(w.get('.lq-room-text').classes()).toContain('lq-clamp')
    expect(w.findAll('.lq-room-text .lq-w')).toHaveLength(0)
  })

  it('lists identical items without a duplicate-key warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const game = useGameStore()
    game.characters = []
    game.items = ['Mounted Lantern', 'Mounted Lantern', 'Mounted Lantern']
    const w = mount(RoomCard)

    game.items = ['Rope', 'Mounted Lantern', 'Mounted Lantern', 'Key']
    await nextTick()
    game.items = ['Key', 'Mounted Lantern', 'Mounted Lantern', 'Rope']
    await nextTick()

    const warnings = warn.mock.calls.map((args) => String(args[0]))
    warn.mockRestore()
    expect(warnings.filter((m) => m.includes('Duplicate keys'))).toEqual([])
    expect(w.findAll('.lq-here-chip').map((c) => c.text())).toEqual([
      'Key',
      'Mounted Lantern',
      'Mounted Lantern',
      'Rope',
    ])
  })
})
