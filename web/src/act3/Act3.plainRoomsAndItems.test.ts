import { describe, it, expect } from 'vitest'
import { Game, GameState, Room } from '@/engine'
import { Act3 } from './Act3'
import { ShorelineMarkers } from './rooms/ShorelineMarkers'
import { FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED } from './Act3StoryFlags'

/** A bare game state. */
function dummyState(): GameState {
  return new GameState(new Room({ name: 'Nowhere', description: '' }), {}, [])
}

describe('Act III small slips', () => {
  it('starts the repeat search sentence in capitals and counts what is left', () => {
    const room = new ShorelineMarkers()
    const state = dummyState()
    room.search(state)
    expect(room.search(state)).toBe(
      '[failure]You comb the surf-slick stones again. ' +
        'Pale shards gleam in the cracks, ' +
        'but you have gathered all you can use.[/failure]',
    )
  })
})

describe('Act III Sunken Ruins and Mount Ember rooms speak as the caverns do', () => {
  /** Every Sunken Ruins and Mount Ember room, by its key in the act. */
  const ROOMS = [
    'TidalCauseway',
    'ShorelineMarkers',
    'OuterWards',
    'CollapsedPier',
    'SubmergedAntechamber',
    'SanctumOfTheTide',
    'LowerSwitchbacks',
    'ObsidianOutcrops',
    'MirrorTerraces',
    'FumarolePassages',
    'EmberGallery',
    'PhoenixCrater',
  ]

  /** Words and phrases that only set a mood (design/Voice.md rules 1–2). */
  const MOOD = [
    /\bancient\b/i,
    /forge stars/,
    /patient voice/,
    /old magic/,
    /black teeth/,
    /sleeps and dreams/,
    /quiet mouths/,
    /surrenders/,
    /light forgets/,
    /counting of losses/,
    /tide and time/,
    /veil of gloom/,
    /trapped fireflies/,
    /atelier/,
    /long-\s?vanished/,
  ]

  /** Room text that describes people at work who are not there. */
  const ABSENT_WORKERS = /attendants|scholars and|where [a-z ]+ (hammer|file)/

  it('describe each room plainly, with nobody at work who is not there', () => {
    const game = new Game([new Act3()])
    const later = new Game([new Act3()])
    later.state.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, true)
    later.state.allRooms.PhoenixCrater.rest(later.state)
    for (const state of [game.state, later.state])
      for (const key of ROOMS) expectPlain(key, state)
  })

  /** Expect the room's description in this state to set no mood and show no absent worker. */
  function expectPlain(key: string, state: GameState): void {
    const text = state.allRooms[key].descriptionFor(state)
    for (const word of MOOD) {
      expect(text, `${key} sets a mood with ${word}`).not.toMatch(word)
    }
    expect(text, `${key} describes absent workers`).not.toMatch(ABSENT_WORKERS)
  }
})
