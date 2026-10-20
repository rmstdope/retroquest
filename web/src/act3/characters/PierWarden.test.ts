import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import {
  FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT,
  FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED,
} from '../Act3StoryFlags'
import { PierWarden } from './PierWarden'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

describe('PierWarden dialogue branches', () => {
  it('hints at shore markers before the sigils are completed', () => {
    const game = new Game([new Act3()])

    const out = new PierWarden().talkTo(game.state).toLowerCase()

    expect(out.includes('high stones') || out.includes('moon')).toBe(true)
  })

  it('mentions the fused locker after the sigils but before the lanterns', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, true)

    const out = new PierWarden().talkTo(game.state).toLowerCase()

    expect(out.includes('fused') || out.includes('locker')).toBe(true)
    expect(out.includes('stuck') || out.includes('magic')).toBe(true)
  })

  it('praises the lit way when both tasks are done', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, true)
    game.state.setStoryFlag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT, true)

    const out = new PierWarden().talkTo(game.state).toLowerCase()

    expect(out.includes('steadier') || out.includes('lanterns')).toBe(true)
  })

  it('attributes the dialogue to the warden in every state', () => {
    const game = new Game([new Act3()])
    const warden = new PierWarden()
    const answers = [warden.talkTo(game.state)]
    game.state.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, true)
    answers.push(warden.talkTo(game.state))
    game.state.setStoryFlag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT, true)
    answers.push(warden.talkTo(game.state))

    for (const answer of answers) {
      expectMarkupWellFormed(answer)
      expectDialogueSpeaker(answer, warden.name)
    }
  })
})
