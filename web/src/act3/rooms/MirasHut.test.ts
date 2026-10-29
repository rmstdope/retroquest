import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'

describe("Mira's Hut (Act III)", () => {
  it('is searched without "the" before her name', () => {
    const game = new Game([new Act3()])
    const hut = game.state.allRooms.MirasHut
    expect(hut.search(game.state)).toBe(
      "You search around [room_name]Mira's Hut[/room_name], but find nothing " +
        'of interest beyond what you can already see.',
    )
  })

  it('reads as it did in Act I, with the dark kitchen kept', () => {
    const game = new Game([new Act3()])
    expect(game.state.allRooms.MirasHut.description).toBe(
      'A small hut hung with drying herbs: lavender, sage, and roots in ' +
        'bundles from the rafters. Shelves of bottles line the walls, every ' +
        'one labelled. ' +
        '[character_name]Mira[/character_name] moves among them without ' +
        'looking, the way you cross your own kitchen in the dark.',
    )
  })

  it('shows the new wording to a save that stored the old one', () => {
    const game = new Game([new Act3()])
    game.state.allRooms.MirasHut.description =
      'A fragrant hut. Sunlight streams.'
    const fresh = new Game([new Act3()])
    fresh.loadSaveData(game.toSaveData())
    expect(fresh.state.allRooms.MirasHut.description).not.toContain('Sunlight')
    expect(fresh.state.allRooms.MirasHut.description).toContain(
      'every one labelled',
    )
  })
})
