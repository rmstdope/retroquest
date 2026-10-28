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

  it('shows Mira at home without calling her wise', () => {
    const game = new Game([new Act3()])
    const hut = game.state.allRooms.MirasHut
    expect(hut.description).toContain(
      '[character_name]Mira[/character_name] moves between her shelves ' +
        'without looking, the way you cross your own kitchen in the dark.',
    )
    expect(hut.description).not.toContain('knowledge')
  })
})
