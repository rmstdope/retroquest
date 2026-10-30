import { describe, it, expect } from 'vitest'
import {
  FLAG_FOUND_RAVINE,
  FLAG_SPOKEN_TO_CARAVAN_MASTER,
} from '../Act2StoryFlags'
import { ravineHere, reload, setupForestEntrance } from '../ravineTestSupport'
import { ForestSprites } from '../characters/ForestSprites'
import { ForestSpeechSpell } from './ForestSpeechSpell'

const FIRST =
  '[success]The woodland creatures gather around you excitedly. A family of ' +
  'squirrels chatters frantically about strange noises from the deep ravine to the northeast. An ' +
  "old owl hoots solemnly about 'metal beasts trapped in the earth-scar where " +
  "the stone walls weep.' The animals describe a steep ravine hidden beyond " +
  'the thickest part of the forest, where something seems to be moving. The ' +
  'owl looks at you, and then at the ravine.[/success]'
const STORY =
  '[success]The woodland creatures gather around you excitedly. A family of ' +
  'squirrels chatters frantically about strange noises from the ravine you sensed. An old owl ' +
  "hoots solemnly about 'metal beasts trapped in the earth-scar where the " +
  "stone walls weep.' Something down there is still moving.[/success]"
const NO_NEWS =
  '[failure]You cast [spell_name]forest speech[/spell_name], but the woodland ' +
  "creatures have no new information about the ravine - you've already " +
  'located it.[/failure]'

describe('ForestSpeechSpell at the Forest Entrance', () => {
  it('works exactly as before when cast first', () => {
    const game = setupForestEntrance()
    expect(game.commandParser.parse('cast forest_speech')).toBe(FIRST)
    expect(ravineHere(game)).toBe(true)
    expect(game.commandParser.parse('cast forest_speech')).toBe(NO_NEWS)
  })

  it('works the same whether or not Thorne has been spoken to', () => {
    const game = setupForestEntrance()
    game.state.setStoryFlag(FLAG_SPOKEN_TO_CARAVAN_MASTER, true)
    expect(game.commandParser.parse('cast forest_speech')).toBe(FIRST)
  })

  it('tells the creatures story once after nature sense found the ravine', () => {
    const game = setupForestEntrance()
    game.commandParser.parse('cast nature_sense')
    expect(game.commandParser.parse('cast forest_speech')).toBe(STORY)
    expect(game.commandParser.parse('cast forest_speech')).toBe(NO_NEWS)
  })

  it('does not tell the story to a save where forest speech found the ravine', () => {
    // Saves from before nature sense could find the ravine carry only found_ravine.
    const game = setupForestEntrance()
    game.state.setStoryFlag(FLAG_FOUND_RAVINE, true)
    expect(game.commandParser.parse('cast forest_speech')).toBe(NO_NEWS)
  })

  it('survives a save and load before and after the story is told', () => {
    const game = setupForestEntrance()
    game.commandParser.parse('cast nature_sense')
    const beforeStory = reload(game)
    expect(beforeStory.commandParser.parse('cast forest_speech')).toBe(STORY)
    const afterStory = reload(beforeStory)
    expect(afterStory.commandParser.parse('cast forest_speech')).toBe(NO_NEWS)
  })
})

describe('ForestSpeechSpell cast on a forest being', () => {
  it('lets their sounds sort themselves into words', () => {
    const answer = new ForestSpeechSpell().castOnCharacter(
      setupForestEntrance().state,
      new ForestSprites(),
    )
    expect(answer).toBe(
      '[success]The sounds they make sort themselves into words. They were ' +
        'talking about you before you cast it, and they go on.[/success]',
    )
  })
})

describe('ForestSpeechSpell in the Whispering Glade', () => {
  it('hears the forest talk, since the glade is forest', () => {
    const game = setupForestEntrance()
    game.state.currentRoom = game.state.allRooms.WhisperingGlade
    expect(game.commandParser.parse('cast forest_speech')).toBe(
      "[success]The forest's talk sorts itself into words: roots " +
        'complaining of dry ground, a jay telling everyone you are here.' +
        '[/success]',
    )
  })
})
