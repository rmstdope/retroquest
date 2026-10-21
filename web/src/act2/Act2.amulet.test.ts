import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act2 } from './Act2'
import { AncientAmulet } from './items/AncientAmulet'

const EXAMINE_LINE =
  'A mysterious amulet inscribed with runes. At its centre is a worn sigil ' +
  'you cannot place. It is faintly warm in your hand.'

/** A new Act II game. */
function newGame(): Game {
  return new Game([new Act2()])
}

/** Whether the bag holds the Act II amulet. */
function carries(game: Game): boolean {
  return game.state.inventory.some((i) => i instanceof AncientAmulet)
}

describe('Act II ancient amulet', () => {
  it('is in the bag on the first turn', () => {
    const game = newGame()
    expect(carries(game)).toBe(true)
    const amulet = game.state.inventory.find((i) => i instanceof AncientAmulet)
    expect(amulet?.name).toBe('ancient amulet')
    expect(amulet?.description).toBe(EXAMINE_LINE)
  })

  it('shows the same examine line in every room', () => {
    const game = newGame()
    expect(executeCommands(game, ['examine amulet'])).toContain(EXAMINE_LINE)
    game.state.currentRoom = game.state.allRooms.GreendaleGates
    expect(executeCommands(game, ['examine ancient amulet'])).toContain(
      EXAMINE_LINE,
    )
  })

  it('can be dropped and taken again with the standard words', () => {
    const game = newGame()
    expect(executeCommands(game, ['drop amulet'])).toContain(
      'You drop the [item_name]ancient amulet[/item_name].',
    )
    expect(carries(game)).toBe(false)
    expect(
      game.state.currentRoom.items.some((i) => i instanceof AncientAmulet),
    ).toBe(true)
    expect(executeCommands(game, ['take amulet'])).toContain(
      'You take the [item_name]ancient amulet[/item_name].',
    )
    expect(carries(game)).toBe(true)
  })

  it('keeps its place through a save and load', () => {
    const game = newGame()
    const bag = newGame()
    expect(bag.loadSaveData(game.toSaveData())).toContain('loaded')
    expect(carries(bag)).toBe(true)
    executeCommands(game, ['drop amulet'])
    const room = newGame()
    room.loadSaveData(game.toSaveData())
    expect(carries(room)).toBe(false)
    expect(
      room.state.currentRoom.items.some((i) => i instanceof AncientAmulet),
    ).toBe(true)
  })

  it('is not added to a save made without it', () => {
    const game = newGame()
    game.state.inventory = game.state.inventory.filter(
      (i) => !(i instanceof AncientAmulet),
    )
    const loaded = newGame()
    loaded.loadSaveData(game.toSaveData())
    expect(carries(loaded)).toBe(false)
  })

  it('quotes only what Act I said, and names the amulet as an item', () => {
    const intro = new Act2().getActIntro()
    expect(intro).toContain(
      "Mira's parting words go with you: " +
        '[dialogue]Your road leads to Greendale, [character_name]Elior[/character_name]. Once there, show the ' +
        'amulet to no one lightly. Those who know what it is will find you.[/dialogue] ' +
        'The [item_name]Ancient Amulet[/item_name] your parents left you lies ' +
        'hidden under your shirt, warm against your chest. Someone came to ' +
        'Willowbrook looking for it, your grandmother said. Keep it hidden.',
    )
    expect(intro).toContain('As you crest the final ridge')
    expect(intro).toContain('Beyond Greendale, you glimpse')
    expect(intro).not.toContain('Seek out Sir Cedric')
    expect(intro).not.toContain('Cedric')
    expect(intro).not.toContain('feels warm')
  })
})
