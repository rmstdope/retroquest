import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { FLAG_HERMITS_WARNING_COMPLETED } from '../Act2StoryFlags'
import { ForestSurvivalKit } from './ForestSurvivalKit'
import {
  executeCommands,
  expectItemInInventory,
  expectMarkupWellFormed,
  expectQuestCompleted,
} from '@/testing/gameHelpers'

/** A game standing at Forest Transition with the kit in the pack. */
function createGameAtStones(): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom = game.state.allRooms.ForestTransition
  game.state.inventory.push(new ForestSurvivalKit())
  return game
}

describe('Forest survival kit', () => {
  it('is refused at the stones before the first talk with the hermit', () => {
    const game = createGameAtStones()

    const answer = executeCommands(game, ['use forest survival kit'])

    expect(answer).toContain(
      'A robed figure is sitting among the stones, watching you. ' +
        "Making camp on someone's doorstep without a word seems rude.",
    )
    expect(answer).toContain('[failure]')
    expectMarkupWellFormed(answer)
    expectItemInInventory(game.state, 'forest survival kit')
    expect(game.state.getStoryFlag(FLAG_HERMITS_WARNING_COMPLETED)).toBe(false)
    expect(game.state.completedQuests.map((quest) => quest.name)).not.toContain(
      "The Hermit's Warning",
    )
    expect(game.state.currentRoom.getExits(game.state)).not.toHaveProperty(
      'east',
    )
  })

  it('plays the whole camp scene after the first talk and is used up', () => {
    const game = createGameAtStones()
    executeCommands(game, ['talk to forest hermit'])

    const answer = executeCommands(game, ['use forest survival kit'])

    const lines = [
      'You open the',
      'forest survival kit',
      'at the foot of the standing stones.',
      "Dusk comes early under the trees. You make a small fire in the lee of the stones, eat from the rations, set the kit's wards around your blanket and sleep with your back to the oldest stone.",
      'You dream of a field of grey stalks and of someone at its far edge, too far away to see. Nobody speaks.',
      'You wake to grey light and woodsmoke. The',
      'forest hermit',
      'is sitting by the embers, feeding them twigs.',
      "You slept on her doorstep and she let you. That's a start. Go on, then.",
    ]
    let from = 0
    for (const line of lines) {
      const at = answer.indexOf(line, from)
      expect(at, line).toBeGreaterThanOrEqual(from)
      from = at + line.length
    }
    expectMarkupWellFormed(answer)
    expect(answer).not.toMatch(/compass/i)
    expectItemInInventory(game.state, 'forest survival kit', false)
    expect(game.state.getStoryFlag(FLAG_HERMITS_WARNING_COMPLETED)).toBe(true)
    expectQuestCompleted(game.state, "The Hermit's Warning")
  })

  it('is unchanged away from the stones and is kept', () => {
    const game = new Game([new Act2()])
    game.state.inventory.push(new ForestSurvivalKit())

    const answer = executeCommands(game, ['use forest survival kit'])

    expect(answer).toContain('Now is not the time to use it.')
    expectItemInInventory(game.state, 'forest survival kit')
  })
})
