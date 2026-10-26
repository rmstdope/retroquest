import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import {
  QUEST_ANCIENT_LIBRARY,
  QUEST_CEDRIKS_LOST_HONOR,
  QUEST_FOREST_GUARDIANS_RIDDLES,
  QUEST_GATHERING_STORM,
  QUEST_HEALERS_APPRENTICE,
  QUEST_HERMITS_WARNING,
  QUEST_INNKEEPERS_DAUGHTER,
  QUEST_LOST_CARAVAN,
  QUEST_SUPPLIES_FOR_THE_JOURNEY,
  QUEST_WHISPERS_IN_THE_WIND,
  FLAG_ANCIENT_LIBRARY_COMPLETED,
  FLAG_CEDRIKS_HONOR_COMPLETED,
  FLAG_FOREST_GUARDIANS_RIDDLES_COMPLETED,
  FLAG_GATHERING_STORM_COMPLETED,
  FLAG_HEALERS_APPRENTICE_COMPLETED,
  FLAG_HERMITS_WARNING_COMPLETED,
  FLAG_INNKEEPERS_DAUGHTER_COMPLETED,
  FLAG_LOST_CARAVAN_COMPLETED,
  FLAG_SUPPLIES_QUEST_COMPLETED,
  FLAG_WHISPERS_IN_WIND_COMPLETED,
} from '../Act2StoryFlags'

/** Every Act II quest that declares a completed flag, with that flag. */
const COMPLETED_FLAGS: [string, string][] = [
  [QUEST_SUPPLIES_FOR_THE_JOURNEY, FLAG_SUPPLIES_QUEST_COMPLETED],
  [QUEST_HEALERS_APPRENTICE, FLAG_HEALERS_APPRENTICE_COMPLETED],
  [QUEST_ANCIENT_LIBRARY, FLAG_ANCIENT_LIBRARY_COMPLETED],
  [QUEST_INNKEEPERS_DAUGHTER, FLAG_INNKEEPERS_DAUGHTER_COMPLETED],
  [QUEST_CEDRIKS_LOST_HONOR, FLAG_CEDRIKS_HONOR_COMPLETED],
  [QUEST_HERMITS_WARNING, FLAG_HERMITS_WARNING_COMPLETED],
  [QUEST_LOST_CARAVAN, FLAG_LOST_CARAVAN_COMPLETED],
  [QUEST_WHISPERS_IN_THE_WIND, FLAG_WHISPERS_IN_WIND_COMPLETED],
  [QUEST_FOREST_GUARDIANS_RIDDLES, FLAG_FOREST_GUARDIANS_RIDDLES_COMPLETED],
  [QUEST_GATHERING_STORM, FLAG_GATHERING_STORM_COMPLETED],
]

describe('Act II quest completion', () => {
  it.each(COMPLETED_FLAGS)('%s raises its own completed flag', (name, flag) => {
    const game = new Game([new Act2()])
    const quest = game.state.getQuest(name)
    expect(quest).not.toBeNull()
    expect(game.state.getStoryFlag(flag)).toBe(false)

    quest?.complete(game.state)

    expect(game.state.getStoryFlag(flag)).toBe(true)
  })

  it.each([
    QUEST_SUPPLIES_FOR_THE_JOURNEY,
    QUEST_ANCIENT_LIBRARY,
    QUEST_HERMITS_WARNING,
  ])(
    'completing %s makes its stage of The Gathering Storm reachable',
    (name) => {
      const game = new Game([new Act2()])
      game.state.settleQuests()
      const main = game.state.getQuest(QUEST_GATHERING_STORM)
      expect(main?.checkUpdate(game.state)).toBe(false)

      game.state.getQuest(name)?.complete(game.state)

      expect(main?.checkUpdate(game.state)).toBe(true)
    },
  )
})
