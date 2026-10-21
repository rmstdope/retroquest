import { describe, it, expect } from 'vitest'
import { Game, type Item } from '@/engine'
import { Act2 } from '../Act2'
import { CityMap } from './CityMap'
import { expectMarkupWellFormed } from '../../testing/gameHelpers'

const MARKS =
  'Someone has been over it in grey ink, in a small, careful hand. ' +
  '[room_name]The Silver Stag Inn[/room_name] is circled twice. ' +
  'In the Residential Quarter, at the end of one lane, a cross has been ' +
  'drawn, and beside it a single word: [italic]cellar?[/italic]'

const EXAMINE =
  "You examine the city map closely. It's a professional cartographer's work, " +
  'showing detailed street layouts, building locations, and district ' +
  `boundaries. ${MARKS}`

const USE =
  'You study the city map carefully. The detailed layout shows the Main ' +
  'Square at the center, with the Market District to the east, Castle ' +
  'Approach to the north, and various other important locations clearly ' +
  `marked. ${MARKS}`

/** An Act II game carrying the city map. */
function gameWithMap(): Game {
  const game = new Game([new Act2()])
  game.state.addItemToInventory(new CityMap())
  return game
}

/** The city map in the player's bag. */
function mapIn(game: Game): Item {
  const map = game.state.inventory.find((i) => i.name === 'city map')
  if (!map) throw new Error('no city map in the bag')
  return map
}

describe('CityMap', () => {
  it('shows the stranger’s marks when examined', () => {
    const game = gameWithMap()
    const answer = mapIn(game).examine(game.state)
    expect(answer).toBe(EXAMINE)
    expectMarkupWellFormed(answer)
  })

  it('shows the same marks when used, again and again, and stays in the bag', () => {
    const game = gameWithMap()
    const map = mapIn(game)
    expect(map.use(game.state)).toBe(USE)
    expect(map.use(game.state)).toBe(USE)
    expect(map.examine(game.state)).toBe(EXAMINE)
    expect(game.state.hasItem('city map')).toBe(true)
    expectMarkupWellFormed(USE)
  })

  it('still loads a map carried in a save', () => {
    const reloaded = new Game([new Act2()])
    expect(reloaded.loadSaveData(gameWithMap().toSaveData())).toContain(
      'loaded successfully',
    )
    expect(mapIn(reloaded).examine(reloaded.state)).toBe(EXAMINE)
  })
})
