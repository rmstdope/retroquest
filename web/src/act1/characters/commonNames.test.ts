import { describe, it, expect } from 'vitest'
import { Game, type Character } from '@/engine'
import { Act1 } from '../Act1'
import { Deer } from './Deer'
import { Fisherman } from './Fisherman'
import { Merchant } from './Merchant'

/** An Act I game in the Village Square with `character` standing there. */
function gameWith(character: Character): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.VillageSquare
  game.state.currentRoom.addCharacter(character)
  return game
}

/**
 * The Act I characters named by what they are, not who: the engine's own
 * replies call them "the merchant" mid-sentence and "The merchant" at the
 * start of one, never "Merchant" as if it were a proper name.
 */
describe.each([
  ['merchant', (): Character => new Merchant()],
  ['deer', (): Character => new Deer()],
  ['fisherman', (): Character => new Fisherman()],
])('the %s, a common-noun character', (name, make) => {
  const marked = `[character_name]${name}[/character_name]`

  it('is "the" one mid-sentence when it does not understand', () => {
    const game = gameWith(make())

    expect(game.commandParser.parse(`say hello to ${name}`)).toContain(
      `You say 'hello' to the ${marked}, but`,
    )
  })

  it('is "The" one at the start of a sentence when it sells nothing', () => {
    const game = gameWith(make())

    expect(game.commandParser.parse(`buy rope from ${name}`)).toBe(
      `The ${marked} has nothing to sell you.`,
    )
  })
})
