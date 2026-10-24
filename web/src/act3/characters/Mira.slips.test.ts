import { describe, it, expect } from 'vitest'
import { Game, characterName, speech } from '@/engine'
import { Act3 } from '../Act3'
import {
  FLAG_ACT3_CHARRED_INSCRIPTION_READ,
  FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED,
  FLAG_ACT3_DRAGONS_SCALE_ACQUIRED,
  FLAG_ACT3_DRAGON_MESSAGE_GIVEN,
  FLAG_ACT3_DRAGON_MESSAGE_RELAYED,
  FLAG_ACT3_MAIN_STARTED,
  FLAG_ACT3_MIRA_EMBER_SLIP_PLAYED,
  FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED,
  FLAG_ACT3_RUINS_LEFT,
  FLAG_ACT3_SEA_SEALED_LETTER_READ,
} from '../Act3StoryFlags'
import { Mira } from './Mira'
import { SeaSealedLetter } from '../items/SeaSealedLetter'

const RUINS_SPEECH = speech("Lysa's hand. She always crossed her sevens.")
const RUINS_NARRATION = `${characterName('Mira')} turns to the sea before you can ask what she means.`
const EMBER_NARRATION = 'She looks at the feather a long time.'
const RELAY_NARRATION = `${characterName('Mira')} does not answer.`

/** A started Act III game with Mira standing in the given room. */
function gameWithMiraAt(roomKey: string): { game: Game; mira: Mira } {
  const game = new Game([new Act3()])
  game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
  const room = game.state.allRooms[roomKey]
  game.state.currentRoom = room
  const mira = new Mira()
  room.characters.push(mira)
  return { game, mira }
}

describe('Mira ruins slip', () => {
  it('follows the letter text when Mira is in the room, once', () => {
    const { game } = gameWithMiraAt('TidalCauseway')
    const letter = new SeaSealedLetter()
    const first = letter.examine(game.state)
    expect(first).toContain(RUINS_SPEECH)
    expect(first).toContain(RUINS_NARRATION)
    expect(first.indexOf(RUINS_SPEECH)).toBeLessThan(
      first.indexOf(RUINS_NARRATION),
    )
    expect(first.indexOf('Your parents wrote to Malakar')).toBeLessThan(
      first.indexOf(RUINS_NARRATION),
    )
    expect(letter.examine(game.state)).not.toContain(RUINS_NARRATION)
  })

  it('does not repeat at the next talk after playing at the reading', () => {
    const { game, mira } = gameWithMiraAt('TidalCauseway')
    new SeaSealedLetter().examine(game.state)
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    expect(mira.talkTo(game.state)).not.toContain(RUINS_NARRATION)
  })

  it('waits for the next talk when the letter is read elsewhere', () => {
    const { game, mira } = gameWithMiraAt('TidalCauseway')
    const away = game.state.allRooms.SubmergedAntechamber
    const here = game.state.currentRoom
    game.state.currentRoom = away
    const reading = new SeaSealedLetter().examine(game.state)
    expect(reading).not.toContain(RUINS_NARRATION)
    game.state.currentRoom = here
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    const talk = mira.talkTo(game.state)
    expect(talk.indexOf('You speak with')).toBeLessThan(
      talk.indexOf(RUINS_NARRATION),
    )
    expect(talk).toContain('you arrive at your next destination')
    expect(talk).toContain(RUINS_SPEECH)
    expect(talk.indexOf(RUINS_SPEECH)).toBeLessThan(
      talk.indexOf(RUINS_NARRATION),
    )
  })

  it('does not play a second time on a later talk', () => {
    const { game, mira } = gameWithMiraAt('TidalCauseway')
    game.state.currentRoom = game.state.allRooms.SubmergedAntechamber
    new SeaSealedLetter().examine(game.state)
    game.state.currentRoom = game.state.allRooms.TidalCauseway
    expect(mira.talkTo(game.state)).toContain(RUINS_NARRATION)
    expect(mira.talkTo(game.state)).not.toContain(RUINS_NARRATION)
  })
})

describe('Mira ruins slip in older saves', () => {
  it('does not play at a later site once the ruins are left', () => {
    const { game, mira } = gameWithMiraAt('LowerSwitchbacks')
    game.state.setStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ, true)
    game.state.setStoryFlag(FLAG_ACT3_RUINS_LEFT, true)
    expect(mira.talkTo(game.state)).not.toContain(RUINS_NARRATION)
    const reading = new SeaSealedLetter().examine(game.state)
    expect(reading).not.toContain(RUINS_NARRATION)
  })
})

describe('Mira Ember slip', () => {
  it('plays on the first talk with the feather even before the inscription', () => {
    const { game, mira } = gameWithMiraAt('LowerSwitchbacks')
    game.state.setStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, true)
    const out = mira.talkTo(game.state)
    expect(out.indexOf('You speak with')).toBeLessThan(
      out.indexOf(EMBER_NARRATION),
    )
    expect(out).toContain('…even when the world burns.')
    expect(out).toContain('finishing a sentence someone else began.')
    expect(out).toContain('discover the words your parents left')
    expect(game.state.getStoryFlag(FLAG_ACT3_MIRA_EMBER_SLIP_PLAYED)).toBe(true)
    expect(mira.talkTo(game.state)).not.toContain(EMBER_NARRATION)
  })

  it('is her send-off lead-in when the inscription is read', () => {
    const { game, mira } = gameWithMiraAt('LowerSwitchbacks')
    game.state.setStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ, true)
    const out = mira.talkTo(game.state)
    expect(out).toContain(EMBER_NARRATION)
    expect(out).toContain('you arrive at your next destination')
  })

  it('does not play before the feather', () => {
    const { game, mira } = gameWithMiraAt('LowerSwitchbacks')
    expect(mira.talkTo(game.state)).not.toContain(EMBER_NARRATION)
  })
})

describe('Mira relay of the dragon message', () => {
  it('does nothing before the dragon has spoken', () => {
    const { game, mira } = gameWithMiraAt('CavernMouth')
    expect(mira.talkTo(game.state)).not.toContain(RELAY_NARRATION)
  })

  it('relays once before her hint when the scale is not won', () => {
    const { game, mira } = gameWithMiraAt('CavernMouth')
    game.state.setStoryFlag(FLAG_ACT3_DRAGON_MESSAGE_GIVEN, true)
    const out = mira.talkTo(game.state)
    expect(out.indexOf('You speak with')).toBeLessThan(
      out.indexOf(RELAY_NARRATION),
    )
    expect(out.indexOf(RELAY_NARRATION)).toBeLessThan(
      out.indexOf('The shadows here run deep'),
    )
    expect(game.state.getStoryFlag(FLAG_ACT3_DRAGON_MESSAGE_RELAYED)).toBe(true)
    expect(mira.talkTo(game.state)).not.toContain(RELAY_NARRATION)
  })

  it('relays before the send-off home once the scale is won', () => {
    const { game, mira } = gameWithMiraAt('CavernMouth')
    game.state.setStoryFlag(FLAG_ACT3_DRAGON_MESSAGE_GIVEN, true)
    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED, true)
    const out = mira.talkTo(game.state)
    expect(out).toContain(RELAY_NARRATION)
    expect(out).toContain('you arrive at your next destination')
  })
})
