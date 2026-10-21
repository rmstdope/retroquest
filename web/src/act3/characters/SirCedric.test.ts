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

  it('replies differently at the Tidal Causeway in each reachable state', () => {
    const game = new Game([new Act3()])
    const s = new SirCedric()
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.currentRoom = game.state.allRooms.TidalCauseway

    // before the Crystal is won: tide advice
    let out = s.talkTo(game.state)
    expect(out.toLowerCase()).toContain('tide')

    // the Crystal can only be won after the vow: acknowledge and encourage
    game.state.setStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE, true)
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    out = s.talkTo(game.state)
    expect(out).toContain('Let us press onward')
  })

  it('never asks for the vow once the Crystal is won', () => {
    const game = new Game([new Act3()])
    const cedric = new SirCedric()
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.currentRoom = game.state.allRooms.TidalCauseway
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE, false)

    const out = cedric.talkTo(game.state)

    expect(out).not.toContain('The Crystal is ours')
  })

  it('attributes every reply in each quest state to Sir Cedric', () => {
    const game = new Game([new Act3()])
    const cedric = new SirCedric()
    const beforeQuest = cedric.talkTo(game.state)
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    const defaultReply = cedric.talkTo(game.state)
    game.state.currentRoom = game.state.allRooms.TidalCauseway
    const noCrystal = cedric.talkTo(game.state)
    game.state.setStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE, true)
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)

    const vowSpoken = cedric.talkTo(game.state)

    expect(beforeQuest).toContain('speak with')
    expect(defaultReply).toContain('The path is set')
    expect(noCrystal).toContain('The tide tests the brave')
    expect(vowSpoken).toContain('Your vow has been spoken')
    for (const answer of [beforeQuest, defaultReply, noCrystal, vowSpoken]) {
      expectMarkupWellFormed(answer)
      expectDialogueSpeaker(answer, 'Sir Cedric')
    }
  })
})
