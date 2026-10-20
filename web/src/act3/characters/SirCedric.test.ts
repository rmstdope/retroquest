import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import {
  FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED,
  FLAG_ACT3_MAIN_STARTED,
  FLAG_ACT3_VOW_OF_COURAGE_MADE,
} from '../Act3StoryFlags'
import { SirCedric } from './SirCedric'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

describe('SirCedric', () => {
  it('reports the expected name in lowercase', () => {
    new Game([new Act3()])
    const s = new SirCedric()
    expect(s.name.toLowerCase()).toBe('sir cedric')
  })

  it('directs the player to Mira before the main quest', () => {
    const game = new Game([new Act3()])
    const s = new SirCedric()
    const out = s.talkTo(game.state)
    expect(out).toContain('Mira')
  })

  it('replies differently at the Tidal Causeway based on flags', () => {
    const game = new Game([new Act3()])
    const s = new SirCedric()
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.currentRoom = game.state.allRooms.TidalCauseway

    // no crystal: tide advice
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, false)
    let out = s.talkTo(game.state)
    expect(out.toLowerCase()).toContain('tide')

    // crystal acquired but no vow: ask to make vow
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE, false)
    out = s.talkTo(game.state)
    expect(out.toLowerCase()).toContain('vow')

    // vow made: acknowledge and encourage
    game.state.setStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE, true)
    out = s.talkTo(game.state).toLowerCase()
    expect(out.includes('vow') || out.includes('let us press onward')).toBe(
      true,
    )
  })

  it('attributes every reply in each quest state to Sir Cedric', () => {
    const game = new Game([new Act3()])
    const cedric = new SirCedric()
    const beforeQuest = cedric.talkTo(game.state)
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    const defaultReply = cedric.talkTo(game.state)
    game.state.currentRoom = game.state.allRooms.TidalCauseway
    const noCrystal = cedric.talkTo(game.state)
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    const noVow = cedric.talkTo(game.state)
    game.state.setStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE, true)

    const vowSpoken = cedric.talkTo(game.state)

    expect(beforeQuest).toContain('speak with')
    expect(defaultReply).toContain('The path is set')
    expect(noCrystal).toContain('The tide tests the brave')
    expect(noVow).toContain('The Crystal is ours')
    expect(vowSpoken).toContain('Your vow has been spoken')
    for (const answer of [
      beforeQuest,
      defaultReply,
      noCrystal,
      noVow,
      vowSpoken,
    ]) {
      expectMarkupWellFormed(answer)
      expectDialogueSpeaker(answer, 'Sir Cedric')
    }
  })
})
