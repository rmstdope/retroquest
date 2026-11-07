import { describe, it, expect } from 'vitest'
import { Game, type Quest } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act2 } from '../Act2'
import { TrainingSword } from '../items/TrainingSword'
import {
  FLAG_CEDRIC_PAID_FOR_SUPPLIES,
  QUEST_SUPPLIES_FOR_THE_JOURNEY,
} from '../Act2StoryFlags'
import { SuppliesForTheJourneyQuest } from './SuppliesForTheJourney'
import { TheGatheringStormQuest } from './TheGatheringStorm'

/** The commands that win Sir Cedric's bout, ending on its last answer. */
const BOUT = [
  'talk to sir cedric',
  'use training sword',
  'say guard to sir cedric',
  'say turn to sir cedric',
  'say strike to sir cedric',
]

/** A game in the castle courtyard, the bout just won and Cedric not yet spoken to again. */
function justAfterTheBout(): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom = game.state.allRooms.CastleCourtyard
  game.state.addItemToInventory(new TrainingSword())
  executeCommands(game, BOUT)
  return game
}

/** The quest of the given class, wherever it stands. */
function questOf(game: Game, kind: new () => Quest): Quest {
  const quest = [
    ...game.state.nonActivatedQuests,
    ...game.state.activatedQuests,
    ...game.state.completedQuests,
  ].find((q) => q instanceof kind)
  if (!quest) throw new Error(`no ${kind.name}`)
  return quest
}

/** Words that tell the player Cedric has already paid. */
const CLAIMS_PAYMENT = /gave you[^.]*coin/i

describe('Supplies for the Journey before and after Sir Cedric pays', () => {
  it('claims no coins in the logs or the hint before Cedric has paid', () => {
    const game = justAfterTheBout()

    expect(game.state.isQuestActivated(QUEST_SUPPLIES_FOR_THE_JOURNEY)).toBe(
      true,
    )
    expect(game.state.getItemCount('coins')).toBe(0)
    expect(questOf(game, SuppliesForTheJourneyQuest).description).not.toMatch(
      CLAIMS_PAYMENT,
    )
    expect(questOf(game, TheGatheringStormQuest).description).not.toMatch(
      CLAIMS_PAYMENT,
    )
    expect(executeCommands(game, ['hint'])).not.toMatch(CLAIMS_PAYMENT)
  })

  it('points back to Cedric while the coins are still to come', () => {
    const game = justAfterTheBout()

    const supplies = questOf(game, SuppliesForTheJourneyQuest)
    expect(supplies.hint(game.state)).toContain('see him before you go')
    expect(executeCommands(game, ['hint'])).toContain('see him before you go')
  })

  it('says Cedric paid once he has handed over the coins', () => {
    const game = justAfterTheBout()
    executeCommands(game, ['talk to sir cedric'])

    expect(game.state.getItemCount('coins')).toBe(150)
    const supplies = questOf(game, SuppliesForTheJourneyQuest)
    expect(supplies.details()).toMatchObject({
      kind: 'journal',
      latest: expect.stringMatching(CLAIMS_PAYMENT),
    })
    const storm = questOf(game, TheGatheringStormQuest).details()
    if (storm.kind !== 'journal') throw new Error('expected a journal')
    expect(storm.latest).toContain('gave you a hundred and fifty coins')
  })

  it('says Cedric paid in a save made before that was a story flag', () => {
    const game = justAfterTheBout()
    executeCommands(game, ['talk to sir cedric'])
    game.state.setStoryFlag(FLAG_CEDRIC_PAID_FOR_SUPPLIES, false)
    const saved = game.toSaveData()
    const loaded = new Game([new Act2()])

    expect(loaded.loadSaveData(saved)).toContain('loaded')
    expect(loaded.state.getStoryFlag(FLAG_CEDRIC_PAID_FOR_SUPPLIES)).toBe(true)
    expect(questOf(loaded, SuppliesForTheJourneyQuest).details()).toMatchObject(
      { latest: expect.stringMatching(CLAIMS_PAYMENT) },
    )
  })
})
