import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { NatureSenseSpell } from './NatureSenseSpell'
import { FLAG_FOUND_LOST_CARAVAN, FLAG_FOUND_RAVINE } from '../Act2StoryFlags'
import { FLAG_SPOKEN_TO_CARAVAN_MASTER } from '../Act2StoryFlags'
import { ravineHere, reload, setupForestEntrance } from '../ravineTestSupport'

const DISCOVERY =
  '[success]Your awareness spreads out through the roots and undergrowth. To the north-east ' +
  'the web of living things simply stops: the ground falls away there into a ' +
  'steep, rocky ravine hidden beyond the thickest trees. Down at the bottom, ' +
  'something heavy and still lies where nothing of the forest belongs.[/success]'
const NOTHING_CHANGED =
  '[failure][clue]Again you feel the ravine to the north-east, the ground ' +
  'falling sharply away. Nothing has changed.[/clue][/failure]'

describe('NatureSenseSpell at the Forest Entrance', () => {
  it('finds the ravine with the agreed line and does not name the caravan', () => {
    const game = setupForestEntrance()
    const out = game.commandParser.parse('cast nature_sense')
    expect(out).toBe(DISCOVERY)
    expect(out).not.toMatch(/caravan|people/i)
    expect(ravineHere(game)).toBe(true)
    expect(game.state.getStoryFlag(FLAG_FOUND_RAVINE)).toBe(true)
  })

  it('works the same whether or not Thorne has been spoken to', () => {
    const game = setupForestEntrance()
    game.state.setStoryFlag(FLAG_SPOKEN_TO_CARAVAN_MASTER, true)
    expect(game.commandParser.parse('cast nature_sense')).toBe(DISCOVERY)
  })

  it('lets the rope rescue work after nature sense alone', () => {
    const game = setupForestEntrance()
    game.commandParser.parse('cast nature_sense')
    game.commandParser.parse('use quality rope with ravine')
    expect(game.state.getStoryFlag(FLAG_FOUND_LOST_CARAVAN)).toBe(true)
  })

  it('says nothing has changed on every recast, before and after the rescue', () => {
    const game = setupForestEntrance()
    game.commandParser.parse('cast nature_sense')
    expect(game.commandParser.parse('cast nature_sense')).toBe(NOTHING_CHANGED)
    game.commandParser.parse('use quality rope with ravine')
    expect(game.commandParser.parse('cast nature_sense')).toBe(NOTHING_CHANGED)
  })

  it('says nothing has changed when forest speech found the ravine first', () => {
    const game = setupForestEntrance()
    game.commandParser.parse('cast forest_speech')
    expect(game.commandParser.parse('cast nature_sense')).toBe(NOTHING_CHANGED)
  })

  it('gives the stones line at the Forest Transition', () => {
    const game = setupForestEntrance()
    game.state.currentRoom = game.state.allRooms.ForestTransition
    expect(game.commandParser.parse('cast nature_sense')).toContain(
      'At the stones the living things around you thin to a line.',
    )
    expect(game.state.getStoryFlag(FLAG_FOUND_RAVINE)).toBe(false)
  })

  it('survives a save and load at each point', () => {
    const game = setupForestEntrance()
    game.commandParser.parse('cast nature_sense')
    const afterSense = reload(game)
    expect(ravineHere(afterSense)).toBe(true)
    expect(afterSense.commandParser.parse('cast nature_sense')).toBe(
      NOTHING_CHANGED,
    )
    afterSense.commandParser.parse('use quality rope with ravine')
    const afterRescue = reload(afterSense)
    expect(afterRescue.state.getStoryFlag(FLAG_FOUND_LOST_CARAVAN)).toBe(true)
    expect(afterRescue.commandParser.parse('cast nature_sense')).toBe(
      NOTHING_CHANGED,
    )
  })
})

describe('NatureSenseSpell in the Whispering Glade', () => {
  it('lets the nymphs be seen by name, then finds them where they were', () => {
    const game = new Game([new Act2()])
    const state = game.state
    state.learnSpell(new NatureSenseSpell())
    state.currentRoom = state.allRooms.WhisperingGlade

    const first = game.commandParser.parse('cast nature_sense')
    const again = game.commandParser.parse('cast nature_sense')

    expect(first).toBe(
      'You hold still and let the glade come to you. The stream is not ' +
        'only water: there are shapes sitting in it, and they have been ' +
        'watching you all along. The [character_name]water ' +
        'nymphs[/character_name] let you see them.',
    )
    expect(again).toContain(
      'The [character_name]water nymphs[/character_name] are where they ' +
        'were, sitting in the stream.',
    )
    expect(again).not.toMatch(/sacred|presence/)
  })
})
