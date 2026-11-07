import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from './Act2'
import { ACT2_COMPLETING_COMMANDS, ACT2_GOLDEN_PATH } from './Act2GoldenPath'
import {
  QUEST_FOREST_GUARDIANS_RIDDLES,
  QUEST_INNKEEPERS_DAUGHTER,
  QUEST_LOST_CARAVAN,
} from './Act2StoryFlags'
import { executeCommands, pathIndex } from '@/testing/gameHelpers'

/** The golden path without the first time `command` is played. */
function pathWithout(command: string): string[] {
  const skipped = pathIndex(ACT2_GOLDEN_PATH, command)
  return ACT2_GOLDEN_PATH.filter((_, index) => index !== skipped)
}

/**
 * A side quest finished before the talk that offers it still counts as
 * complete, so the final vision can be cast and the act ends.
 */
describe('Act 2 side quests finished before they were offered', () => {
  const cases: [string, string][] = [
    [QUEST_LOST_CARAVAN, 'talk to caravan master thorne'],
    [QUEST_INNKEEPERS_DAUGHTER, 'talk to barmaid elena'],
    [QUEST_FOREST_GUARDIANS_RIDDLES, 'talk to forest sprites'],
  ]

  for (const [quest, skipped] of cases) {
    it(`completes ${quest} when "${skipped}" is never played, and the act ends`, () => {
      const game = new Game([new Act2()])
      executeCommands(game, pathWithout(skipped))

      expect(game.state.isQuestCompleted(quest)).toBe(true)
      executeCommands(game, ACT2_COMPLETING_COMMANDS)
      expect(game.acts[game.currentAct].isCompleted(game.state)).toBe(true)
    })
  }

  it('recovers a save made with a finished quest still waiting to be offered', () => {
    const game = new Game([new Act2()])
    executeCommands(game, pathWithout('talk to caravan master thorne'))
    // The state such a save was left in before the fix: completed, but
    // never moved out of the quests waiting to be offered.
    const state = game.state
    const caravan = state.getQuest(QUEST_LOST_CARAVAN)!
    expect(caravan.completed).toBe(true)
    state.completedQuests = state.completedQuests.filter((q) => q !== caravan)
    state.activatedQuests = state.activatedQuests.filter((q) => q !== caravan)
    state.nonActivatedQuests.push(caravan)

    const loaded = new Game([new Act2()])
    expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')

    expect(loaded.state.isQuestCompleted(QUEST_LOST_CARAVAN)).toBe(true)
    expect(loaded.state.nonActivatedQuests).not.toContainEqual(
      expect.objectContaining({ name: QUEST_LOST_CARAVAN }),
    )
    executeCommands(loaded, ACT2_COMPLETING_COMMANDS)
    expect(loaded.acts[loaded.currentAct].isCompleted(loaded.state)).toBe(true)
  })
})
