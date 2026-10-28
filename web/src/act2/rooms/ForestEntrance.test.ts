import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act2 } from '../Act2'
import { EnhancedLantern } from '../items/EnhancedLantern'
import { ProtectiveCharm } from '../items/ProtectiveCharm'

const SOUTH_SPRITES = 'dance thick across it'
const SOUTH_OPEN = 'the forest sprites have drawn aside from it'
const EAST_DARK = 'To the east the undergrowth grows thick and dark.'
const EAST_LIT = "your lantern's blue light picks out a narrow path"
const TOO_DARK =
  'The undergrowth to the east is too thick and dark to find a way through.'
const LED_ASTRAY = 'exactly where you started'
const LANTERN_GREEN =
  '[success]A narrow path east, toward a tranquil glade, is now open.[/success]'
const CHARM_GREEN =
  '[success]The sprites draw aside. The path south, to the [room_name]Ancient Grove[/room_name], is now open.[/success]'
const CHARM_USE =
  'You hold up the charm. The sprites crowd round it, chiming, and settle ' +
  'on your sleeve one by one, then lift off again.'
const OLD_COMBINED = 'With both the protective charm'
const TEASE = 'The grove path? Walk it, walk it'
const NOTICE = 'Pretty light! Pretty light'
const STEP_ASIDE = "The hermit's mark"

/** A game standing at the Forest Entrance carrying the lantern and the charm. */
function atEntrance(): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom = game.state.allRooms.ForestEntrance
  game.state.inventory.push(new EnhancedLantern(), new ProtectiveCharm())
  return game
}

function describeRoom(game: Game): string {
  return game.state.currentRoom.describe(game.state)
}

function exitsOf(game: Game): string[] {
  return Object.keys(game.state.currentRoom.getExits(game.state))
}

describe('Forest Entrance paths', () => {
  it('nothing used: only west, sprites thick on the south path, dark east', () => {
    const game = atEntrance()
    expect(exitsOf(game)).toEqual(['west'])
    const text = describeRoom(game)
    expect(text).toContain(SOUTH_SPRITES)
    expect(text).toContain(EAST_DARK)
    expect(text).not.toContain('Two paths diverge')
  })

  it('lantern only: west and east, sprites still on the south path', () => {
    const game = atEntrance()
    executeCommands(game, ['use enhanced lantern'])
    expect(exitsOf(game)).toEqual(['west', 'east'])
    const text = describeRoom(game)
    expect(text).toContain(SOUTH_SPRITES)
    expect(text).toContain(EAST_LIT)
    expect(text).not.toContain(EAST_DARK)
  })

  it('charm only: west and south, east still dark', () => {
    const game = atEntrance()
    executeCommands(game, ['use protective charm'])
    expect(exitsOf(game)).toEqual(['west', 'south'])
    const text = describeRoom(game)
    expect(text).toContain(SOUTH_OPEN)
    expect(text).toContain(EAST_DARK)
  })

  it('both used in either order: west, south, east', () => {
    for (const order of [
      ['use enhanced lantern', 'use protective charm'],
      ['use protective charm', 'use enhanced lantern'],
    ]) {
      const game = atEntrance()
      executeCommands(game, order)
      expect(exitsOf(game)).toEqual(['west', 'south', 'east'])
      const text = describeRoom(game)
      expect(text).toContain(SOUTH_OPEN)
      expect(text).toContain(EAST_LIT)
    }
  })

  it('go east before the lantern gives the too-dark line and stays', () => {
    const game = atEntrance()
    const answer = executeCommands(game, ['go east'])
    expect(answer).toContain(TOO_DARK)
    expect(answer).not.toContain("can't go that way")
    expect(game.state.currentRoom.name).toBe('Forest Entrance')
  })

  it('go south before the charm leads astray, any number of times', () => {
    const game = atEntrance()
    executeCommands(game, ['use enhanced lantern'])
    for (let i = 0; i < 3; i++) {
      const answer = executeCommands(game, ['go south'])
      expect(answer).toContain(LED_ASTRAY)
      expect(answer).not.toContain('Forest Entrance')
      expect(game.state.currentRoom.name).toBe('Forest Entrance')
    }
  })

  it('other directions keep the plain refusal', () => {
    const game = atEntrance()
    expect(executeCommands(game, ['go north'])).toContain(
      "You can't go that way.",
    )
  })

  it('the lantern opens the way east and the charm the way south', () => {
    const game = atEntrance()
    executeCommands(game, ['use enhanced lantern', 'go east'])
    expect(game.state.currentRoom.name).toBe('Whispering Glade')
    const other = atEntrance()
    executeCommands(other, ['use protective charm', 'go south'])
    expect(other.state.currentRoom.name).toBe('Ancient Grove')
  })

  it('first use ends in its own green line; repeat is dim with none', () => {
    const game = atEntrance()
    const first = executeCommands(game, ['use enhanced lantern'])
    expect(first).toContain(LANTERN_GREEN)
    expect(first).not.toContain(OLD_COMBINED)
    expect(executeCommands(game, ['use enhanced lantern'])).not.toContain(
      '[success]',
    )
    const second = executeCommands(game, ['use protective charm'])
    expect(second).toContain(CHARM_USE)
    expect(second).not.toMatch(/spiritual energy|ancient magic|invoke/i)
    expect(second).toContain(CHARM_GREEN)
    expect(second).not.toContain(OLD_COMBINED)
    expect(second).not.toContain(LANTERN_GREEN)
    const repeat = executeCommands(game, ['use protective charm'])
    expect(repeat).toContain('[failure]')
    expect(repeat).not.toContain('[success]')
  })

  it('go south with nothing used leads astray, go east with only the charm is too dark', () => {
    const game = atEntrance()
    expect(executeCommands(game, ['go south'])).toContain(LED_ASTRAY)
    executeCommands(game, ['use protective charm'])
    expect(executeCommands(game, ['go east'])).toContain(TOO_DARK)
    expect(game.state.currentRoom.name).toBe('Forest Entrance')
  })

  it('the south sentence names the sprites in character colour', () => {
    expect(describeRoom(atEntrance())).toContain(
      'A path leads south toward an ancient grove, but small motes of light ' +
        'dance thick across it: [character_name]forest sprites[/character_name], ' +
        'and every one of them is looking at you.',
    )
  })

  it('items used elsewhere do not open anything', () => {
    const game = atEntrance()
    game.state.currentRoom = game.state.allRooms.ForestTransition
    executeCommands(game, ['use enhanced lantern', 'use protective charm'])
    game.state.currentRoom = game.state.allRooms.ForestEntrance
    expect(exitsOf(game)).toEqual(['west'])
  })

  it('replaces the old closing text of an older save', () => {
    const game = atEntrance()
    game.state.allRooms.ForestEntrance.description =
      'Old text. Two paths diverge deeper: one toward an ancient grove.'
    new Act2().afterLoad(game.state)
    expect(describeRoom(game)).not.toContain('Two paths diverge')
    expect(describeRoom(game)).toContain(EAST_DARK)
  })

  it('survives a save and load with only the charm used', () => {
    const game = atEntrance()
    executeCommands(game, ['use protective charm'])
    const fresh = new Game([new Act2()])
    expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')
    expect(exitsOf(fresh)).toEqual(['west', 'south'])
  })

  it('survives a save and load', () => {
    const game = atEntrance()
    executeCommands(game, ['use enhanced lantern'])
    const fresh = new Game([new Act2()])
    expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')
    expect(exitsOf(fresh)).toEqual(['west', 'east'])
    expect(describeRoom(fresh)).toContain(EAST_LIT)
  })
})

describe('Forest sprites path lines', () => {
  it('tease on the first talk when nothing is used, with the offer intact', () => {
    const game = atEntrance()
    const answer = executeCommands(game, ['talk to forest sprites'])
    expect(answer).toContain('[dialogue]A traveller—[/dialogue]')
    expect(answer).toContain('the nymphs have riddles')
    expect(answer).not.toContain('beware')
    expect(answer).toContain(TEASE)
  })

  it('later talks: dance narration then the path line only', () => {
    const game = atEntrance()
    executeCommands(game, ['talk to forest sprites'])
    const later = executeCommands(game, ['talk to forest sprites'])
    expect(later).toContain('[dialogue]—did you forget?[/dialogue]')
    expect(later).not.toContain('ancient ones await')
    expect(later).not.toContain('A traveller')
    expect(later).toContain(TEASE)
  })

  it('notice the light when only the lantern is lit', () => {
    const game = atEntrance()
    executeCommands(game, ['use enhanced lantern'])
    const answer = executeCommands(game, ['talk to forest sprites'])
    expect(answer).toContain(NOTICE)
    expect(answer).not.toContain(TEASE)
  })

  it('step aside once the charm is used, lantern either way', () => {
    for (const commands of [
      ['use protective charm'],
      ['use protective charm', 'use enhanced lantern'],
    ]) {
      const game = atEntrance()
      executeCommands(game, commands)
      const answer = executeCommands(game, ['talk to forest sprites'])
      expect(answer).toContain(STEP_ASIDE)
      expect(answer).not.toContain(NOTICE)
    }
  })

  it('the path line follows state on a later talk', () => {
    const game = atEntrance()
    executeCommands(game, ['talk to forest sprites'])
    executeCommands(game, ['use protective charm'])
    expect(executeCommands(game, ['talk to forest sprites'])).toContain(
      STEP_ASIDE,
    )
  })
})
