import { describe, it, expect } from 'vitest'
import { Game, clue } from '@/engine'
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

describe('Village Chapel lane (rq-un37)', () => {
  it('opens on the end of the village lane and leads west to the store and east to the road', () => {
    const game = gameInChapel()
    const chapel = game.state.currentRoom
    expect(chapel.descriptionFor(game.state)).toContain(
      'A small stone chapel at the end of the village lane. ',
    )
    expect(chapel.getExits(game.state)).toEqual({
      west: 'GeneralStore',
      east: 'RoadToGreendale',
    })
  })

  it('gives a save made before the lane the new ways and words', () => {
    const game = gameInChapel()
    const rooms = game.state.allRooms
    rooms.VillageChapel.exits = {
      north: 'HiddenGlade',
      east: 'RoadToGreendale',
    }
    rooms.HiddenGlade.exits = { north: 'ForestPath', south: 'VillageChapel' }
    rooms.GeneralStore.exits = {
      west: 'VillageSquare',
      south: 'BlacksmithsForge',
    }
    rooms.VillageChapel.description = 'A small stone chapel.'
    const loaded = new Game([new Act1()])
    expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')
    const after = loaded.state.allRooms
    expect(loaded.state.currentRoom.name).toBe('Village Chapel')
    expect(after.VillageChapel.exits).toEqual({
      west: 'GeneralStore',
      east: 'RoadToGreendale',
    })
    expect(after.HiddenGlade.exits).toEqual({ north: 'ForestPath' })
    expect(after.GeneralStore.exits).toEqual({
      west: 'VillageSquare',
      east: 'VillageChapel',
      south: 'BlacksmithsForge',
    })
    expect(loaded.state.currentRoom.describe(loaded.state)).toContain(
      'at the end of the village lane',
    )
    loaded.state.currentRoom = after.HiddenGlade
    loaded.commandParser.parse('go south')
    expect(loaded.state.currentRoom.name).toBe('Hidden Glade')
  })
})

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
    expect(text).toBe(
      clue(
        'Your light goes into the dark corner by the altar and does not come ' +
          'out again. The corner keeps its dark.',
      ),
    )
    expect(game.state.currentRoom.getItemByName('locket')).toBeNull()
  })

  it('tells the light spell the candle already lights the corner once lit', () => {
    const game = gameInChapel()
    lightCandle(game)
    const text = executeCommands(game, ['cast light'])
    expect(text).toBe(
      '[failure]The candle already lights the corner by the altar.[/failure]',
    )
  })
})
