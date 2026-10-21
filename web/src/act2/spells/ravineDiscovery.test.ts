import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { QualityRope } from '../items/QualityRope'
import { FLAG_FOUND_LOST_CARAVAN, FLAG_FOUND_RAVINE } from '../Act2StoryFlags'
import { ForestSpeechSpell } from './ForestSpeechSpell'
import { NatureSenseSpell } from './NatureSenseSpell'
import { TheMerchantsLostCaravanQuest } from '../quests/TheMerchantsLostCaravan'

/** A game with both spells known and the player at the Forest Entrance. */
function setup(): Game {
  const game = new Game([new Act2()])
  game.state.learnSpell(new NatureSenseSpell())
  game.state.learnSpell(new ForestSpeechSpell())
  game.state.currentRoom = game.state.allRooms.ForestEntrance
  game.state.addItemToInventory(new QualityRope())
  return game
}

const ravineHere = (game: Game): boolean =>
  game.state.currentRoom.items.some((i) => i.name === 'ravine')

const NATURE_FIRST =
  'To the north-east the web of living things simply stops: the ground falls ' +
  'away there into a steep, rocky ravine hidden beyond the thickest trees. ' +
  'Down at the bottom, something heavy and still lies where nothing of the ' +
  'forest belongs.'
const STORY =
  'A family of squirrels chatters frantically about strange noises from the ' +
  'ravine you sensed.'

describe('ravine discovery at the Forest Entrance', () => {
  it('nature sense finds the ravine without naming the caravan', () => {
    const game = setup()
    const out = game.commandParser.parse('cast nature_sense')
    expect(out).toContain(NATURE_FIRST)
    expect(out).toMatch(/^\[success\]/)
    expect(out).not.toMatch(/caravan|people/i)
    expect(ravineHere(game)).toBe(true)
    expect(game.state.getStoryFlag(FLAG_FOUND_RAVINE)).toBe(true)
  })

  it('the rope works after nature sense alone', () => {
    const game = setup()
    game.commandParser.parse('cast nature_sense')
    game.commandParser.parse('use quality rope with ravine')
    expect(game.state.getStoryFlag(FLAG_FOUND_LOST_CARAVAN)).toBe(true)
  })

  it('recasting nature sense says nothing has changed, also after the rescue', () => {
    const game = setup()
    game.commandParser.parse('cast nature_sense')
    const again = game.commandParser.parse('cast nature_sense')
    expect(again).toMatch(/^\[dim\]/)
    expect(again).toContain('Nothing has changed.')
    game.commandParser.parse('use quality rope with ravine')
    expect(game.commandParser.parse('cast nature_sense')).toContain(
      'Nothing has changed.',
    )
  })

  it('forest speech after nature sense tells the creatures story once', () => {
    const game = setup()
    game.commandParser.parse('cast nature_sense')
    const story = game.commandParser.parse('cast forest_speech')
    expect(story).toMatch(/^\[success\]/)
    expect(story).toContain(STORY)
    expect(story).toContain('You should try to get down there.')
    const again = game.commandParser.parse('cast forest_speech')
    expect(again).toMatch(/^\[dim\]/)
    expect(again).toContain('no new information about the ravine')
  })

  it('forest speech first is unchanged, and nature sense then says nothing has changed', () => {
    const game = setup()
    const first = game.commandParser.parse('cast forest_speech')
    expect(first).toContain('strange noises from the deep ravine')
    expect(ravineHere(game)).toBe(true)
    expect(game.commandParser.parse('cast forest_speech')).toContain(
      'no new information about the ravine',
    )
    expect(game.commandParser.parse('cast nature_sense')).toContain(
      'Nothing has changed.',
    )
  })

  it('nature sense elsewhere is unchanged', () => {
    const game = setup()
    game.state.currentRoom = game.state.allRooms.ForestTransition
    const out = game.commandParser.parse('cast nature_sense')
    expect(out).toContain('safe passages')
    expect(game.state.getStoryFlag(FLAG_FOUND_RAVINE)).toBe(false)
  })

  it('a save made after nature sense loads back and forest speech still tells the story', () => {
    const game = setup()
    game.commandParser.parse('cast nature_sense')
    const fresh = new Game([new Act2()])
    expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')
    expect(fresh.state.currentRoom.items.map((i) => i.name)).toContain('ravine')
    expect(fresh.commandParser.parse('cast forest_speech')).toContain(STORY)
  })
})

describe('Lost Caravan quest text', () => {
  it('credits either spell in the hint and completion', () => {
    const quest = new TheMerchantsLostCaravanQuest()
    const game = new Game([new Act2()])
    expect(quest.update(game.state)).toBe(
      'Search the Enchanted Forest for the missing caravan. Try sensing the ' +
        'land, or speaking with the woodland creatures, at the forest’s edge.'.replace(
          '’',
          "'",
        ),
    )
    expect(quest.completion).toContain(
      'Using your forest magic, you discovered their location',
    )
    expect(quest.completion).not.toContain('forest speech')
  })
})
