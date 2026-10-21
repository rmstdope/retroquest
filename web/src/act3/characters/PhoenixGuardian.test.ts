import { describe, it, expect } from 'vitest'
import { Game, type GameState } from '@/engine'
import { Act3 } from '../Act3'
import { FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED } from '../Act3StoryFlags'
import { PhoenixGuardian } from './PhoenixGuardian'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

/** A game state with the Breath of the Mountain quest flag set as given. */
function makeGameState(flagValue: boolean): GameState {
  const state = new Game([new Act3()]).state
  state.setStoryFlag(FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED, flagValue)
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

  it('asks for the patience of the site of Wisdom, not bravery, before the quest', () => {
    const pg = new PhoenixGuardian()
    const response = pg.talkTo(makeGameState(false))
    expect(response).toContain('both patient and watchful')
    expect(response).not.toMatch(/brave|bold/i)
  })

  it('gives post-completion advice after the quest is done', () => {
    const pg = new PhoenixGuardian()
    const response = pg.talkTo(makeGameState(true))
    expect(response).toContain('The way is open')
    expect(response).toContain('patience is your ally')
    expect(response).toContain('Phoenix will not appear')
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
})
