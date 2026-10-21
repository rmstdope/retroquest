import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { EntryPass } from '../items/EntryPass'
import type { GreendaleGates } from './GreendaleGates'

/** An Act II game with the player at the Greendale Gates holding the pass. */
function createGameAtGates(): { game: Game; gates: GreendaleGates } {
  const game = new Game([new Act2()])
  const gates = game.state.allRooms.GreendaleGates as GreendaleGates
  game.state.currentRoom = gates
  game.state.addItemToInventory(new EntryPass())
  return { game, gates }
}

describe('GreendaleGates', () => {
  it('blocks the search before the pass and points to the papers', () => {
    const { game } = createGameAtGates()

    const answer = game.commandParser.parse('search')

    expect(answer).toContain('improper to search while he observes you')
    expect(answer).toContain(
      'Perhaps he would relax if you showed him proper papers.',
    )
    expect(answer).not.toContain('speak with him')
  })

  it('finds the map by searching right after the pass is given', () => {
    const { game, gates } = createGameAtGates()
    game.commandParser.parse('give entry pass to gate captain')

    const answer = game.commandParser.parse('search')

    expect(answer).toContain("With the Gate Captain gone, you're free")
    expect(answer).toContain(
      'a detailed [item_name]city map[/item_name] of Greendale. ' +
        'Someone has drawn on it in grey ink.',
    )
    expect(answer).not.toContain('exactly what you need')
    expect(gates.items.map((i) => i.name)).toContain('city map')
    expect(gates.getExits(game.state)).toHaveProperty('north')
  })

  it('says it has been searched on the second search', () => {
    const { game } = createGameAtGates()
    game.commandParser.parse('give entry pass to gate captain')
    game.commandParser.parse('search')

    expect(game.commandParser.parse('search')).toContain(
      "You've already searched thoroughly",
    )
  })

  it('lets an older save search while the captain is still present', () => {
    const { game, gates } = createGameAtGates()
    gates.gateCaptain.entryPassGiven = true

    const answer = game.commandParser.parse('search')

    expect(gates.characters).toContain(gates.gateCaptain)
    expect(answer).toContain("you're free to look around")
  })

  it('keeps his departure and the found map through a save and load', () => {
    const { game } = createGameAtGates()
    game.commandParser.parse('give entry pass to gate captain')

    const reloaded = new Game([new Act2()])
    reloaded.loadSaveData(game.toSaveData())
    const gates = reloaded.state.currentRoom as GreendaleGates

    expect(gates.characters).toHaveLength(0)
    expect(reloaded.commandParser.parse('search')).toContain('city map')
  })
})
