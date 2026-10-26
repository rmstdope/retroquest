import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import {
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
  ['Supplies for the Journey', FLAG_SUPPLIES_QUEST_COMPLETED],
  ["The Healer's Apprentice", FLAG_HEALERS_APPRENTICE_COMPLETED],
  ['The Ancient Library', FLAG_ANCIENT_LIBRARY_COMPLETED],
  ["The Innkeeper's Daughter", FLAG_INNKEEPERS_DAUGHTER_COMPLETED],
  ["Cedric's Lost Honor", FLAG_CEDRIKS_HONOR_COMPLETED],
  ["The Hermit's Warning", FLAG_HERMITS_WARNING_COMPLETED],
  ["The Merchant's Lost Caravan", FLAG_LOST_CARAVAN_COMPLETED],
  ['Whispers in the Wind', FLAG_WHISPERS_IN_WIND_COMPLETED],
  ["The Forest Guardian's Riddles", FLAG_FOREST_GUARDIANS_RIDDLES_COMPLETED],
  ['The Gathering Storm', FLAG_GATHERING_STORM_COMPLETED],
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
    'Supplies for the Journey',
    'The Ancient Library',
    "The Hermit's Warning",
  ])(
    'completing %s makes its stage of The Gathering Storm reachable',
    (name) => {
      const game = new Game([new Act2()])
      game.state.settleQuests()
      const main = game.state.getQuest('The Gathering Storm')
      expect(main?.checkUpdate(game.state)).toBe(false)

      game.state.getQuest(name)?.complete(game.state)

      expect(main?.checkUpdate(game.state)).toBe(true)
    },
  )
})
