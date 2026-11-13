import { describe, it, expect } from 'vitest'
import { Game, type Character } from '@/engine'
import { Act1 } from '../Act1'
import { Blacksmith } from './Blacksmith'
import { Deer } from './Deer'
import { Fisherman } from './Fisherman'
import { Merchant } from './Merchant'
import { Priest } from './Priest'
import { Shopkeeper } from './Shopkeeper'

/** An Act I game in the Village Square with `character` standing there. */
function gameWith(character: Character): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.VillageSquare
  game.state.currentRoom.addCharacter(character)
  return game
}

/**
 * The Act I characters named by what they are, not who (Borin and Hemlock
 * are named, see below): the engine's own
 * replies call them "the merchant" mid-sentence and "The merchant" at the
 * start of one, never "Merchant" as if it were a proper name.
 */
const COMMON_NOUNS = [
  ['merchant', (): Character => new Merchant()],
  ['deer', (): Character => new Deer()],
  ['fisherman', (): Character => new Fisherman()],
  ['priest', (): Character => new Priest()],
] as const

describe('the common-noun characters', () => {
  it('are "The" one at the start of a sentence', () => {
    const failures: string[] = []
    for (const [name, make] of COMMON_NOUNS) {
      const marked = `[character_name]${name}[/character_name]`
      const unknown = gameWith(make()).commandParser.parse(
        `say hello to ${name}`,
      )
      if (!unknown.includes(`The ${marked} `)) {
        failures.push(`${name}: answer to an unknown word reads ${unknown}`)
      }
      const sells = gameWith(make()).commandParser.parse(
        `buy rope from ${name}`,
      )
      if (sells !== `The ${marked} has nothing to sell you.`) {
        failures.push(`${name}: selling nothing reads ${sells}`)
      }
    }
    expect(failures).toEqual([])
  })
})

describe('Borin and Hemlock, named from the start', () => {
  it('are proper names, with no article', () => {
    const failures: string[] = []
    for (const [word, name, make] of [
      ['borin', 'Borin', (): Character => new Blacksmith()],
      ['hemlock', 'Hemlock', (): Character => new Shopkeeper()],
    ] as const) {
      const reply = gameWith(make()).commandParser.parse(`say hello to ${word}`)
      if (!reply.includes(`[character_name]${name}[/character_name] `)) {
        failures.push(`${name}: reply reads ${reply}`)
      }
    }
    expect(failures).toEqual([])
  })

  it('Borin sells nothing, and says so by name', () => {
    const game = gameWith(new Blacksmith())

    expect(game.commandParser.parse('buy rope from borin')).toBe(
      '[character_name]Borin[/character_name] has nothing to sell you.',
    )
  })
})
