import { describe, it, expect } from 'vitest'
import { Game, type GameState } from '@/engine'
import { Act3 } from '../Act3'
import {
  FLAG_ACT3_CEDRIC_GATE_ANSWERED,
  FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED,
  FLAG_ACT3_DRAGONS_SCALE_ACQUIRED,
  FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED,
  FLAG_ACT3_MAIN_STARTED,
  FLAG_ACT3_MINERS_RESCUE_COMPLETED,
  FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED,
  FLAG_ACT3_VOW_OF_COURAGE_MADE,
} from '../Act3StoryFlags'
import { SirCedric } from './SirCedric'
import {
  expectCharacterInRoom,
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

const REFRAIN = '“Power follows purpose; purpose follows truth.”'

/** A started Act III game with the party standing in the room with the key. */
function startedAt(roomKey: string): Game {
  const game = new Game([new Act3()])
  game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
  game.state.currentRoom = game.state.allRooms[roomKey]
  return game
}

/** What he says when talked to in the game's current room. */
function talk(game: Game): string {
  const cedric = new SirCedric()
  const answer = cedric.talkTo(game.state)
  expectMarkupWellFormed(answer)
  expectDialogueSpeaker(answer, 'Sir Cedric')
  return answer
}

describe('SirCedric', () => {
  it('is shown as Sir Cedric and answers to sir cedric and cedric', () => {
    const cedric = new SirCedric()
    expect(cedric.name).toBe('Sir Cedric')
    for (const word of ['sir cedric', 'Sir Cedric', 'cedric', 'CEDRIC']) {
      expect(cedric.answersTo(word)).toBe(true)
    }
    expect(cedric.answersTo('mira')).toBe(false)
  })

  it('directs the player to Mira before the main quest', () => {
    const game = new Game([new Act3()])
    expect(talk(game)).toContain('speak with')
  })

  it.each([
    ['MirasHut', 'Mira knows the way. I know how to stand in front of you.'],
    ['TidalCauseway', 'Salt and old stone.'],
    ['OuterWards', 'Salt and old stone.'],
    ['SanctumOfTheTide', 'Water I cannot fight. I will keep the door, then.'],
    ['FumarolePassages', 'We stand about reading vents while he fades.'],
    ['LowerSwitchbacks', 'We stand about reading vents while he fades.'],
    ['CollapsedGalleries', 'People under the rock. That I understand.'],
    ['CavernMouth', 'People under the rock. That I understand.'],
    ['FortressEntrance', 'If I had held the door that night'],
  ])('says the stage line in %s before its quest moves on', (key, line) => {
    expect(talk(startedAt(key))).toContain(line)
  })

  it('speaks of the water after the vow, in the Sanctum and the rest of the Ruins', () => {
    for (const key of ['SanctumOfTheTide', 'TidalCauseway']) {
      const game = startedAt(key)
      game.state.setStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE, true)
      expect(talk(game)).toContain('It asked me, too.')
    }
  })

  it('speaks of the bird on Mount Ember once the feather is won', () => {
    const game = startedAt('PhoenixCrater')
    game.state.setStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, true)
    expect(talk(game)).toContain('A bird told us to wait')
  })

  it('speaks of the old man in the caverns once the miners are freed', () => {
    const game = startedAt('DragonsHall')
    game.state.setStoryFlag(FLAG_ACT3_MINERS_RESCUE_COMPLETED, true)
    expect(talk(game)).toContain('The old man was right.')
  })

  it('waits one more hour in the hut with the relics, then walks toward the door', () => {
    const game = startedAt('MirasHut')
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED, true)
    expect(talk(game)).toContain('I can wait one more hour.')
    game.state.setStoryFlag(FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED, true)
    expect(talk(game)).toContain('walking toward that door')
  })

  it('no longer uses the three generic lines', () => {
    const game = startedAt('TidalCauseway')
    const out = talk(game)
    expect(out).not.toContain('The tide tests the brave')
    expect(out).not.toContain('The path is set')
    expect(out).not.toContain('Your vow has been spoken')
  })

  describe('at the fortress gate', () => {
    it('repeats the gate line and the hint until answered', () => {
      const game = startedAt('FortressEntrance')
      const first = talk(game)
      expect(first).toContain(
        'Words carved beneath the runes of a sunlit glade come back to you.',
      )
      expect(talk(game)).toBe(first)
    })

    it.each([
      'refrain',
      REFRAIN,
      '"Refrain."',
      'Power follows purpose; purpose follows truth',
    ])('is answered by the refrain as %s', (words) => {
      const game = startedAt('FortressEntrance')
      const out = new SirCedric().sayTo(game.state, words)
      expectMarkupWellFormed(out)
      expect(out.startsWith(`You: ${REFRAIN}\n`)).toBe(true)
      expect(out).toContain('loosens his sword in its sheath')
      expect(out).toContain('Truth, then. The truth is I was on the wall.')
      expect(game.state.getStoryFlag(FLAG_ACT3_CEDRIC_GATE_ANSWERED)).toBe(true)
      expect(talk(game)).toContain('Ready when you are.')
    })

    it('answers anything else with "Not now. Not here." and can still be answered', () => {
      const game = startedAt('FortressEntrance')
      const cedric = new SirCedric()
      const out = cedric.sayTo(game.state, 'hello')
      expectMarkupWellFormed(out)
      expect(out).toContain('Not now. Not here.')
      expect(game.state.getStoryFlag(FLAG_ACT3_CEDRIC_GATE_ANSWERED)).toBe(
        false,
      )
      expect(cedric.sayTo(game.state, 'refrain')).toContain('Truth, then.')
    })

    it('does not take the refrain away from the gate', () => {
      const game = startedAt('TidalCauseway')
      expect(new SirCedric().sayTo(game.state, 'refrain')).toContain(
        'Not now. Not here.',
      )
      expect(game.state.getStoryFlag(FLAG_ACT3_CEDRIC_GATE_ANSWERED)).toBe(
        false,
      )
    })
  })

  describe('walking with Elior', () => {
    /** The key of the room that lists Sir Cedric, or '' when none does. */
    function roomOfCedric(state: GameState): string {
      return (
        Object.keys(state.allRooms).find(
          (key) => state.allRooms[key].getCharacterByName('cedric') !== null,
        ) ?? ''
      )
    }

    it('follows Elior from room to room and is listed where he is', () => {
      const game = startedAt('TidalCauseway')
      game.state.allRooms.MirasHut.characters.splice(
        game.state.allRooms.MirasHut.characters.findIndex(
          (c) => c instanceof SirCedric,
        ),
        1,
      )
      game.state.currentRoom.characters.push(new SirCedric())
      const exit = Object.keys(game.state.currentRoom.getExits(game.state))[0]
      game.move(exit)
      expectCharacterInRoom(game.state.currentRoom, 'Sir Cedric')
      expect(game.state.currentRoom.describe(game.state)).toContain(
        'Sir Cedric',
      )
    })

    it('joins Elior on his next move when a save left him behind, in title case', () => {
      const game = new Game([new Act3()])
      const cedric = game.state.allRooms.MirasHut.getCharacterByName('cedric')
      if (!cedric) throw new Error('Sir Cedric starts in the hut')
      cedric.name = 'sir cedric'
      game.state.currentRoom = game.state.allRooms.TidalCauseway
      const exit = Object.keys(game.state.currentRoom.getExits(game.state))[0]
      game.move(exit)
      expect(roomOfCedric(game.state)).not.toBe('MirasHut')
      expect(cedric.name).toBe('Sir Cedric')
      expect(roomOfCedric(game.state)).toBe(
        Object.keys(game.state.allRooms).find(
          (k) => game.state.allRooms[k] === game.state.currentRoom,
        ),
      )
    })
  })
})
