import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from './Act2'
import { ForestHermit } from './characters/ForestHermit'
import { MountainHermit } from './characters/MountainHermit'
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

  it('opens on the chapel bell of Act I and the castle with no banner', () => {
    const intro = new Act2().getActIntro()

    expect(intro).toContain(
      'You left Willowbrook to the sound of the chapel bell, ringing once ' +
        'with no hand on the rope. The mountain path took you up through rock ' +
        'and pine, and from the last ridge you see Greendale: stone houses, ' +
        'more chimneys than you can count, and a white castle above the ' +
        'walls. No banner flies from its highest spire.',
    )
    expect(intro).toContain(
      'East of the city the Enchanted Forest begins, a dark line of trees ' +
        'as far as you can see.',
    )
    expect(intro).not.toMatch(/breath away|majestically|prove yourself/)
  })

  it('tells on the opening page that Malakar is only a Willowbrook byword to Elior', () => {
    const intro = new Act2().getActIntro()

    expect(intro).toContain(
      'Malakar, to you, is a word from Willowbrook: a name your neighbours ' +
        'say over bad weather and bad luck, and knock on wood after. A tale ' +
        "to frighten children, and one line in your mother's hand that called " +
        'him a friend once.',
    )
    expect(intro).not.toContain('Cedric')
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
      "But you... there is old magic on you, and not of your own making. She'll notice it.",
    )
    expect(answer).not.toMatch(CHOSEN_TALK)
  })

  it('completes The Ancient Library with the Wardens', () => {
    const completion = new TheAncientLibraryQuest().completion

    expect(completion).toContain("The library's keeper was a Warden once.")
    expect(
      completion.endsWith(
        'its last page warns that Malakar seeks the blood of Willowbrook.',
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

  it('keeps the traveler journal free of chosen-one talk', () => {
    const game = new Game([new Act2()])

    const text = new TravelersJournal().use(game.state)

    expect(text).not.toMatch(CHOSEN_TALK)
  })

  it('has the mountain hermit send Elior to Cedric, not call him destined', () => {
    const game = new Game([new Act2()])
    const hermit = new MountainHermit()

    const first = hermit.talkTo(game.state)

    expect(first).toContain(
      'Tell him the sergeant never believed a word of it.',
    )
    expect(first).not.toContain('You have the look of one who might rise')
    expect(first).not.toMatch(CHOSEN_TALK)
    expect(hermit.talkTo(game.state)).toContain('mind you give him my words')
  })
})
