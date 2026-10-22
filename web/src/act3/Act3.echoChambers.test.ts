import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from './Act3'
import {
  FLAG_ACT3_ECHO_HEARD,
  FLAG_ACT3_KEEPER_PHANTOM_LINE_TOLD,
} from './Act3StoryFlags'
import { expectStoryFlag, executeCommands } from '@/testing/gameHelpers'

/** Reload a game through a save, as the browser does. */
function reload(game: Game): Game {
  const fresh = new Game([new Act3()])
  fresh.loadSaveData(game.toSaveData())
  return fresh
}

describe('The Echo Chambers echo and the Silence Keeper', () => {
  it('remembers across a save that the Keeper was met before the echo', () => {
    const game = new Game([new Act3()])
    game.state.currentRoom = game.state.allRooms.StillnessVestibule
    game.state.currentRoom
      .getCharacterByName('Silence Keeper')
      ?.talkTo(game.state)
    game.state.setStoryFlag(FLAG_ACT3_ECHO_HEARD, true)

    const loaded = reload(game)
    const keeper =
      loaded.state.allRooms.StillnessVestibule.getCharacterByName(
        'Silence Keeper',
      )
    expect(keeper?.talkTo(loaded.state)).toContain('They are moments')
  })

  it('is reached by the typed command, as the design names it', () => {
    const game = new Game([new Act3()])
    game.state.currentRoom = game.state.allRooms.EchoChambers
    expect(executeCommands(game, ['listen'])).toContain('Three voices')
    expectStoryFlag(game.state, FLAG_ACT3_ECHO_HEARD, true)
  })

  it('keeps the echo heard and the Keeper line told across a save and load', () => {
    const game = new Game([new Act3()])
    game.state.currentRoom = game.state.allRooms.EchoChambers
    game.listen()

    const heard = reload(game)
    expectStoryFlag(heard.state, FLAG_ACT3_ECHO_HEARD, true)
    heard.state.currentRoom = heard.state.allRooms.EchoChambers
    expect(heard.listen()).toContain('a door closing')
    expect(heard.listen()).not.toContain('Three voices')

    heard.state.currentRoom = heard.state.allRooms.StillnessVestibule
    const keeper = heard.state.currentRoom.getCharacterByName('Silence Keeper')
    expect(keeper).not.toBeNull()
    keeper?.talkTo(heard.state)
    expect(keeper?.talkTo(heard.state)).toContain('They are moments')

    const told = reload(heard)
    expectStoryFlag(told.state, FLAG_ACT3_KEEPER_PHANTOM_LINE_TOLD, true)
    const again =
      told.state.allRooms.StillnessVestibule.getCharacterByName(
        'Silence Keeper',
      )
    expect(again?.talkTo(told.state)).not.toContain('moments')
  })
})
