import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { executeCommands, expectDialogueSpeaker } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import {
  FLAG_DEER_CAN_BE_OBSERVED,
  FLAG_MAGIC_FULLY_UNLOCKED,
} from '../Act1StoryFlags'
import { Coin } from '../items/Coin'
import { DullKnife } from '../items/DullKnife'
import { MillstoneFragment } from '../items/MillstoneFragment'
import { RuneToken } from '../items/RuneToken'

/** An Act I game with Elior at the forge, having already met Borin. */
function gameAtForge(): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.BlacksmithsForge
  executeCommands(game, ['talk to blacksmith'])
  return game
}

/** Lead Elior to the glade, rest until the deer comes, and back to the forge. */
function seeTheDeer(game: Game): void {
  game.state.setStoryFlag(FLAG_DEER_CAN_BE_OBSERVED, true)
  game.state.currentRoom = game.state.allRooms.HiddenGlade
  executeCommands(game, ['rest'])
  game.state.currentRoom = game.state.allRooms.BlacksmithsForge
}

describe('Borin as the act goes on', () => {
  it('just welcomes Elior back when nothing has happened yet', () => {
    const game = gameAtForge()

    const response = executeCommands(game, ['talk to blacksmith'])

    expect(response).toContain('Need something else?')
    expectDialogueSpeaker(response, 'blacksmith')
  })

  it('reminds Elior to oil the edge he sharpened', () => {
    const game = gameAtForge()
    game.state.addItemToInventory(new Coin())
    game.state.addItemToInventory(new DullKnife())
    executeCommands(game, ['give coin to blacksmith'])

    const response = executeCommands(game, ['talk to blacksmith'])

    expect(response).toContain('Keep that edge oiled')
    expectDialogueSpeaker(response, 'blacksmith')
    expect(findMarkupProblems(response)).toEqual([])
  })

  it('asks about the deer once Elior has seen it', () => {
    const game = gameAtForge()
    seeTheDeer(game)

    const response = executeCommands(game, ['talk to blacksmith'])

    expect(response).toContain('Saw it, did you?')
    expectDialogueSpeaker(response, 'blacksmith')
    expect(findMarkupProblems(response)).toEqual([])
  })

  it('rotates through what he has to say, newest first', () => {
    const game = gameAtForge()
    game.state.addItemToInventory(new Coin())
    game.state.addItemToInventory(new DullKnife())
    executeCommands(game, ['give coin to blacksmith'])
    seeTheDeer(game)
    game.state.setStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED, true)

    const lines = [1, 2, 3, 4].map(() =>
      executeCommands(game, ['talk to blacksmith']),
    )

    expect(lines[0]).toContain("Can't hammer that into shape")
    expect(lines[1]).toContain('Saw it, did you?')
    expect(lines[2]).toContain('Keep that edge oiled')
    expect(lines[3]).toContain("Can't hammer that into shape")
    for (const line of lines) expectDialogueSpeaker(line, 'blacksmith')
  })

  it('comments on what is newest when Elior visits once after each event', () => {
    const game = gameAtForge()
    game.state.addItemToInventory(new Coin())
    game.state.addItemToInventory(new DullKnife())
    executeCommands(game, ['give coin to blacksmith'])
    const afterKnife = executeCommands(game, ['talk to blacksmith'])
    seeTheDeer(game)
    const afterDeer = executeCommands(game, ['talk to blacksmith'])
    game.state.setStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED, true)
    const afterMagic = executeCommands(game, ['talk to blacksmith'])

    expect(afterKnife).toContain('Keep that edge oiled')
    expect(afterDeer).toContain('Saw it, did you?')
    expect(afterMagic).toContain("Can't hammer that into shape")
  })

  it('knows the rune token for cold iron no honest smith forged, and hands it back', () => {
    const game = gameAtForge()
    game.state.addItemToInventory(new RuneToken())

    const response = executeCommands(game, ['give rune token to blacksmith'])

    expect(response).toContain('not forged by any honest smith')
    expect(game.state.hasItem('rune token')).toBe(true)
    expect(findMarkupProblems(response)).toEqual([])
  })

  it('tells Elior plainly to sit quiet a while in the glade', () => {
    const game = gameAtForge()
    game.state.addItemToInventory(new MillstoneFragment())

    const response = executeCommands(game, [
      'give millstone fragment to blacksmith',
    ])

    expect(response).toContain('sit quiet a while')
    expectDialogueSpeaker(response, 'blacksmith')
  })
})
