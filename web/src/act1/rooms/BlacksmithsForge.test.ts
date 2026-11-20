import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../Act1'
import { executeCommands } from '@/testing/gameHelpers'

/** An Act I game standing in the Blacksmith's Forge. */
function gameInForge(): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.BlacksmithsForge
  return game
}

const LOG_FIRE =
  'A hot, smoky forge. A log fire burns on the hearthstone, and not all of ' +
  'its smoke finds the chimney.'
const HORSESHOE = ' A single horseshoe hangs on the wall.'
const BORIN =
  ' [character_name]Borin[/character_name] stands between the fire and the anvil, his hammer in his hand, ' +
  'watching the fire.'

describe("Blacksmith's Forge, as its picture shows it", () => {
  it('has a log fire, one horseshoe on the wall and Borin watching the fire', () => {
    const game = gameInForge()
    const text = game.state.currentRoom.descriptionFor(game.state)
    expect(text).toContain(LOG_FIRE + HORSESHOE + BORIN)
    expect(text).not.toMatch(/coals|hinges|ploughshares/i)
  })

  it('drops the horseshoe sentence once the horseshoe is taken', () => {
    const game = gameInForge()
    executeCommands(game, ['take horseshoe'])
    const text = game.state.currentRoom.descriptionFor(game.state)
    expect(text).toContain(LOG_FIRE + BORIN)
    expect(text).not.toContain('horseshoe')
  })

  it('looks at the fire and the tools, and no longer answers to coals or hinges', () => {
    const game = gameInForge()
    expect(executeCommands(game, ['examine fire'])).toContain(
      'Logs burn on a bed of red embers. Borin feeds them without looking.',
    )
    expect(executeCommands(game, ['examine tools'])).toContain(
      "Tongs and a coil of rope hang on the walls, each where Borin's hand " +
        'expects it to be.',
    )
    expect(executeCommands(game, ['examine coals'])).not.toContain('embers')
    expect(executeCommands(game, ['examine hinges'])).not.toContain('Tongs')
  })
})
