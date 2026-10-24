import { describe, it, expect } from 'vitest'
import { Game, GameController } from '@/engine'
import { Mechanism } from '../items/Mechanism'
import { AncientAmulet } from '../items/AncientAmulet'
import { Act1 } from '../Act1'
import {
  FLAG_FOUND_RUNE_TOKEN,
  FLAG_STRANGER_SEEN_AT_MILL,
} from '../Act1StoryFlags'
import { OldMill } from './OldMill'

/** The one paragraph in which the cloaked stranger is seen. */
const SIGHTING =
  'A man in a grey cloak stands at the far door with his back to you, ' +
  'quite still, his head bent as if he were listening to the floor. You ' +
  'have made no sound, and yet he knows you are there. He does not turn. ' +
  'He steps out into the light toward the river, and when you reach the ' +
  'door the path is empty.'

/** An Act I game with Elior in the Abandoned Shed, just north of the mill. */
function gameNorthOfMill(tokenFound: boolean): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.AbandonedShed
  game.state.setStoryFlag(FLAG_FOUND_RUNE_TOKEN, tokenFound)
  return game
}

describe('the cloaked stranger at the Old Mill', () => {
  it('is never seen before the rune token has come up from the well', () => {
    const game = gameNorthOfMill(false)

    const look = game.commandParser.parse('south')

    expect(look).not.toContain(SIGHTING)
    expect(game.state.getStoryFlag(FLAG_STRANGER_SEEN_AT_MILL)).toBe(false)
  })

  it('is seen once, with his back turned, the first time Elior enters after the token', () => {
    const game = gameNorthOfMill(true)

    const first = game.commandParser.parse('south')
    const again = game.commandParser.parse('look')

    expect(first).toContain(SIGHTING)
    expect(first.indexOf('You move south')).toBeLessThan(
      first.indexOf(SIGHTING),
    )
    expect(again).not.toContain(SIGHTING)
    expect(game.state.getStoryFlag(FLAG_STRANGER_SEEN_AT_MILL)).toBe(true)
  })

  it('stays seen across a save and load', () => {
    const game = gameNorthOfMill(true)
    game.commandParser.parse('south')
    const loaded = new Game([new Act1()])
    expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')

    expect(loaded.state.currentRoom).toBeInstanceOf(OldMill)
    expect(loaded.commandParser.parse('look')).not.toContain(SIGHTING)
  })
})

describe('the Old Mill room card', () => {
  it('shows the jammed mechanism and the humming amulet', () => {
    const game = new Game([new Act1()])
    const mill = game.state.allRooms.OldMill
    game.state.currentRoom = mill
    const mechanism = mill.items.find((item) => item instanceof Mechanism)
    if (!(mechanism instanceof Mechanism)) throw new Error('no mechanism')
    mechanism.repaired = true
    game.state.inventory.push(new AncientAmulet())
    const text = new GameController(game).getRoomDescription()
    expect(text).toContain('jammed with a rope')
    expect(text).toContain('hums softly')
  })
})
