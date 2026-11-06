import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import { Matches } from '../items/Matches'
import { LightSpell } from '../spells/LightSpell'

/** The chapel's sentence about the corner the candle has not lit yet. */
const DARK_CORNER = 'A dark corner by the altar swallows the light.'

/** An Act I game standing in the Village Chapel, knowing `light`. */
function gameInChapel(): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.VillageChapel
  game.state.learnSpell(new LightSpell())
  return game
}

/** Light the chapel candle with matches. */
function lightCandle(game: Game): void {
  game.state.addItemToInventory(new Matches())
  executeCommands(game, ['use candle with matches'])
}

describe('Village Chapel', () => {
  it('has a dark corner by the altar while the candle is cold', () => {
    const game = gameInChapel()
    expect(game.state.currentRoom.descriptionFor(game.state)).toContain(
      DARK_CORNER,
    )
  })

  it('loses its dark corner once the candle is lit', () => {
    const game = gameInChapel()
    lightCandle(game)
    const text = game.state.currentRoom.descriptionFor(game.state)
    expect(text).not.toContain('dark corner')
    expect(text).toContain('The candle burns on the altar')
  })

  it('stays without its dark corner after the locket is taken', () => {
    const game = gameInChapel()
    lightCandle(game)
    executeCommands(game, ['take locket'])
    expect(game.state.currentRoom.descriptionFor(game.state)).not.toContain(
      'dark corner',
    )
  })

  it('does not call itself well lit to the light spell while the corner is dark', () => {
    const game = gameInChapel()
    const text = executeCommands(game, ['cast light'])
    expect(text).not.toContain('already well lit')
    expect(text).toContain('dark corner')
    expect(game.state.currentRoom.getItemByName('locket')).toBeNull()
  })

  it('tells the light spell the candle already lights the corner once lit', () => {
    const game = gameInChapel()
    lightCandle(game)
    const text = executeCommands(game, ['cast light'])
    expect(text).toContain('The candle already lights the corner by the altar.')
  })
})
