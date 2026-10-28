import { describe, it, expect } from 'vitest'
import { Game, type GameState } from '@/engine'
import { Act3 } from '../Act3'
import {
  FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED,
  FLAG_ACT3_FUMAROLE_WARD_APPLIED,
} from '../Act3StoryFlags'
import { PhoenixGuardian } from './PhoenixGuardian'
import { FumarolePassages } from '../rooms/FumarolePassages'
import { SirCedric } from './SirCedric'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

/** A game state with the Breath of the Mountain quest flag set as given. */
function makeGameState(flagValue: boolean): GameState {
  const state = new Game([new Act3()]).state
  state.setStoryFlag(FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED, flagValue)
  state.currentRoom = state.allRooms.FumarolePassages
  return state
}

describe('PhoenixGuardian', () => {
  it('initializes with the correct name and description', () => {
    const pg = new PhoenixGuardian()
    expect(pg.name).toBe('phoenix guardian')
    expect(pg.description).toContain('fire-etched robes')
  })

  it('gives the vent puzzle hint before the quest is complete', () => {
    const pg = new PhoenixGuardian()
    const response = pg.talkTo(makeGameState(false))
    expect(response).toContain('bring the vents into harmony')
    expect(response).toContain('ward')
    expect(response).toContain('crater')
    expect(response).toContain('Phoenix Guardian[/character_name] studies you')
  })

  it('says plainly what to do, and where a ward comes from', () => {
    const response = new PhoenixGuardian().talkTo(makeGameState(false))
    expect(response).toContain(
      'You have come for the Phoenix. Then you must be both patient and ' +
        'watchful.',
    )
    expect(response).toContain(
      'the gallery below the terraces has what a ward is made of.',
    )
    expect(response).toContain('the way to the crater opens.')
    expect(response).not.toContain('mighty one')
  })

  it('stops asking for harmony once the third vent stone is set', () => {
    const state = makeGameState(false)
    const room = state.allRooms.FumarolePassages
    if (!(room instanceof FumarolePassages)) throw new Error('no passages')
    room.ventCalibrations = 3
    const answer = new PhoenixGuardian().talkTo(state)
    expect(answer).toContain(
      'listens to the vents. [dialogue]They breathe as one now. Bind the ' +
        'heat with a ward, and they will hold.[/dialogue]',
    )
    expect(answer).not.toContain('bring the vents into harmony')
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, 'phoenix guardian')
    room.ventCalibrations = 2
    expect(new PhoenixGuardian().talkTo(state)).toContain(
      'bring the vents into harmony',
    )
  })

  it('is described counting the vents', () => {
    expect(new PhoenixGuardian().description).toBe(
      'A tall, masked figure in fire-etched robes stands by the vents, ' +
        'staff in hand. His head is turned to the vents, and his lips move ' +
        'as if he is counting.',
    )
  })

  it('asks for the patience of the site of Wisdom, not bravery, before the quest', () => {
    const pg = new PhoenixGuardian()
    const response = pg.talkTo(makeGameState(false))
    expect(response).toContain('both patient and watchful')
    expect(response).not.toMatch(/brave|bold/i)
  })

  it('tells the player to count the breath once the ward is set and until they have crossed', () => {
    const state = makeGameState(false)
    state.setStoryFlag(FLAG_ACT3_FUMAROLE_WARD_APPLIED, true)
    const answer = new PhoenixGuardian().talkTo(state)
    expect(answer).toContain('watches the vents')
    expect(answer).toContain(
      'The ward holds, but the mountain still breathes. Count its breath. ' +
        'Walk when it draws in.',
    )
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, 'phoenix guardian')
  })

  it('goes back to the line about patience once the player has crossed', () => {
    const state = makeGameState(true)
    state.setStoryFlag(FLAG_ACT3_FUMAROLE_WARD_APPLIED, true)
    expect(new PhoenixGuardian().talkTo(state)).toContain(
      'patience is your ally',
    )
  })

  it('gives post-completion advice after the quest is done', () => {
    const pg = new PhoenixGuardian()
    const response = pg.talkTo(makeGameState(true))
    expect(response).toContain('The way is open')
    expect(response).toContain('patience is your ally')
    expect(response).toContain('Phoenix will not appear')
    expect(response).toContain(
      'Sit in the crater a while, and let it come to you.',
    )
    expect(response).not.toContain('mighty one')
  })

  it.each([false, true])(
    'attributes the dialogue to the guardian when the quest flag is %s',
    (flagValue) => {
      const pg = new PhoenixGuardian()
      const answer = pg.talkTo(makeGameState(flagValue))
      expectMarkupWellFormed(answer)
      expectDialogueSpeaker(answer, pg.name)
    },
  )

  it('is answered by Sir Cedric when he stands by, with the way open', () => {
    const state = makeGameState(true)
    state.currentRoom.addCharacter(new SirCedric())
    const answer = new PhoenixGuardian().talkTo(state)
    expect(answer).toContain(
      '[dialogue]Patience. The king has had nothing from us but patience.[/dialogue]',
    )
    expectMarkupWellFormed(answer)
  })

  it('is not answered by Sir Cedric before the way is open', () => {
    const state = makeGameState(false)
    state.currentRoom.addCharacter(new SirCedric())
    expect(new PhoenixGuardian().talkTo(state)).not.toContain('Sir Cedric')
  })
})
