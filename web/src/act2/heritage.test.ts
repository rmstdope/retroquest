import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from './Act2'
import { ForestHermit } from './characters/ForestHermit'
import { TravelersJournal } from './items/TravelersJournal'
import { HiddenLibrary } from './rooms/HiddenLibrary'
import { TheAncientLibraryQuest } from './quests/TheAncientLibrary'
import { TheGatheringStormQuest } from './quests/TheGatheringStorm'
import { FLAG_ANCIENT_LIBRARY_COMPLETED } from './Act2StoryFlags'

/** Words that would call Elior chosen, fated or prophesied. */
const CHOSEN_TALK = /chosen|destiny|destined|prophec|ancient mages|cosmic/i

describe('Act II tells the heritage through the Wardens, never a Chosen One', () => {
  it('ends the opening page on the road into Greendale', () => {
    const intro = new Act2().getActIntro()

    expect(
      intro
        .trimEnd()
        .endsWith(
          'Take a deep breath, and start down the road into Greendale.',
        ),
    ).toBe(true)
    expect(intro).not.toMatch(CHOSEN_TALK)
  })

  it('ends the Hidden Library look on the mark Elior carries', () => {
    const description = new HiddenLibrary().description

    expect(
      description.endsWith(
        'Somewhere on these shelves may be an answer about the mark you carry.',
      ),
    ).toBe(true)
    expect(description).not.toMatch(CHOSEN_TALK)
  })

  it('has the hermit hint at old magic, not destiny', () => {
    const game = new Game([new Act2()])

    const answer = new ForestHermit().talkTo(game.state)

    expect(answer).toContain(
      "'But you... there is old magic on you, and not of your own making. Take this charm",
    )
    expect(answer).not.toMatch(CHOSEN_TALK)
  })

  it('completes The Ancient Library with the Wardens', () => {
    const completion = new TheAncientLibraryQuest().completion

    expect(completion).toContain(
      'You have successfully gained access to the ancient library',
    )
    expect(
      completion.endsWith(
        "The chronicle you read there was the Wardens' own book, and its last page warns that Malakar seeks the blood of Willowbrook.",
      ),
    ).toBe(true)
    expect(completion).not.toMatch(CHOSEN_TALK)
  })

  it('swaps only the prophecy sentences in the Gathering Storm library stage', () => {
    const game = new Game([new Act2()])
    const quest = new TheGatheringStormQuest()
    game.state.setStoryFlag(FLAG_ANCIENT_LIBRARY_COMPLETED, true)
    quest.checkUpdate(game.state)

    const stage = quest.latestStage ?? ''
    expect(stage).toContain(
      'taught you the dispel spell. The chronicle there was written by the Wardens of the Dawn, and their magic was the unbinding kind. Its last page warns that Malakar seeks the blood of Willowbrook.',
    )
    expect(stage).not.toMatch(CHOSEN_TALK)
  })

  it('cuts the prophecy clause from the traveler journal', () => {
    const game = new Game([new Act2()])

    const text = new TravelersJournal().use(game.state)

    expect(text).toContain('could prove vital when darkness stirs again.')
    expect(text).not.toMatch(CHOSEN_TALK)
  })
})
