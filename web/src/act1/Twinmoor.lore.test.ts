import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act1 } from './Act1'
import { Villager } from './characters/Villager'
import { Locket } from './items/Locket'

/** An Act I game with Elior standing in the named room. */
function gameIn(room: string): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms[room]
  return game
}

const NAMING =
  'They came over the moor on a still night, and the moon lay in the moor ' +
  'water as bright as the one above it. Two moons, they said, one for the ' +
  'sky and one for the ground, and they named the land Twinmoor.'

const MOOR_LINE =
  'Your mother used to walk up to the moor on still nights to see the two ' +
  'moons. She came home with wet hems and not a word of sorry.'

describe('Twinmoor lore in Act I', () => {
  it('has the priest name the land between the mark and the relic, at his first talk', () => {
    const answer = executeCommands(gameIn('VillageChapel'), ['talk to priest'])
    const mark = answer.indexOf('the weather has nearly had it. ')
    const naming = answer.indexOf(NAMING)
    const relic = answer.indexOf('The relic passed quietly down their line')
    expect(mark).toBeGreaterThan(-1)
    expect(naming).toBeGreaterThan(mark)
    expect(relic).toBeGreaterThan(naming)
  })

  it('does not repeat the naming at his later talks', () => {
    const game = gameIn('VillageChapel')
    executeCommands(game, ['talk to priest'])
    expect(executeCommands(game, ['talk to priest'])).not.toContain(NAMING)
  })

  it('shows the shallower lower moon when the mark is examined', () => {
    const answer = executeCommands(gameIn('VillageChapel'), [
      'examine mark over the door',
    ])
    expect(answer).toContain(
      'The weather has worn it almost smooth. The lower moon is cut ' +
        'shallower than the upper, like a moon seen in water.',
    )
  })

  it("adds Tilda's saying as the last of her rumours", () => {
    const game = gameIn('VillageSquare')
    const tilda = game.state.currentRoom.characters.find(
      (c) => c instanceof Villager,
    ) as Villager
    expect(tilda.dialogueOptions).toHaveLength(7)
    expect(tilda.dialogueOptions[6]).toBe(
      'My mother used to say, two moons on the moor, no rain at the door. ' +
        "Still nights, she meant. We've not had a still night since the " +
        'fields went grey.',
    )
  })

  it('shows the moor from the road to Greendale', () => {
    const game = gameIn('RoadToGreendale')
    expect(game.state.currentRoom.descriptionFor(game.state)).toContain(
      'North of the road the land climbs onto the edge of the moor: ' +
        'heather, and still brown pools.',
    )
  })

  it('never names the Wardens or the oath in Act I', () => {
    const answer = executeCommands(gameIn('VillageChapel'), ['talk to priest'])
    expect(answer).not.toContain('What the Wardens bind')
  })
})

describe('Grandmother and the moor, once', () => {
  /** A cottage game where the locket has been given and the first talk is done. */
  function afterLocket(): Game {
    const game = gameIn('EliorsCottage')
    executeCommands(game, ['talk to grandmother'])
    game.state.addItemToInventory(new Locket())
    executeCommands(game, ['give locket to grandmother'])
    return game
  }

  it('does not say it before she has seen the locket', () => {
    const game = gameIn('EliorsCottage')
    executeCommands(game, ['talk to grandmother'])
    expect(executeCommands(game, ['talk to grandmother'])).not.toContain(
      MOOR_LINE,
    )
  })

  it('says it on the next talk after the locket, with the bread board, and then never again', () => {
    const game = afterLocket()
    const first = executeCommands(game, ['talk to grandmother'])
    expect(first).toContain(MOOR_LINE)
    expect(first).toContain('She pushes the bread board toward you.')
    expect(executeCommands(game, ['talk to grandmother'])).not.toContain(
      MOOR_LINE,
    )
  })

  it('does not say it again after a save made once it was said', () => {
    const game = afterLocket()
    executeCommands(game, ['talk to grandmother'])
    const loaded = new Game([new Act1()])
    loaded.loadSaveData(game.toSaveData())
    expect(executeCommands(loaded, ['talk to grandmother'])).not.toContain(
      MOOR_LINE,
    )
  })
})
