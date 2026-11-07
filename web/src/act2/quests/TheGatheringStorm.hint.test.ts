import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act2 } from '../Act2'
import { SecretDocuments } from '../items/SecretDocuments'
import {
  FLAG_CEDRIKS_HONOR_ACCEPTED,
  FLAG_HERMITS_WARNING_COMPLETED,
  QUEST_CEDRIKS_LOST_HONOR,
} from '../Act2StoryFlags'
import { CedricksLostHonorQuest } from './CedricksLostHonorQuest'

/** A game past the hermit, so the main quest's newest beat points at Nyx. */
function pastTheHermit(): Game {
  const game = new Game([new Act2()])
  game.state.setStoryFlag(FLAG_HERMITS_WARNING_COMPLETED, true)
  game.state.settleQuests()
  return game
}

describe("The Gathering Storm's hint with Thorne's papers in hand", () => {
  it("leads to the castle courtyard while Cedric's Lost Honor has not started", () => {
    const game = pastTheHermit()
    game.state.inventory.push(new SecretDocuments())

    const hint = executeCommands(game, ['hint'])

    expect(game.state.isQuestActivated(QUEST_CEDRIKS_LOST_HONOR)).toBe(false)
    expect(hint).toContain('Nyx')
    expect(hint).toContain('castle courtyard')
  })

  it('says nothing of the papers before Thorne has given them', () => {
    const game = pastTheHermit()

    expect(executeCommands(game, ['hint'])).not.toContain('castle courtyard')
  })

  it("leaves the papers to Cedric's Lost Honor once it has started", () => {
    const game = pastTheHermit()
    game.state.inventory.push(new SecretDocuments())
    game.state.setStoryFlag(FLAG_CEDRIKS_HONOR_ACCEPTED, true)
    game.state.activatedQuests.push(new CedricksLostHonorQuest())

    expect(executeCommands(game, ['hint'])).not.toContain('castle courtyard')
  })
})
