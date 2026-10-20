import { describe, it } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { Miners } from './Miners'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

describe('Miners dialogue markup', () => {
  it('attributes the rescue thanks and the later update to the miners', () => {
    const game = new Game([new Act3()])
    const miners = new Miners()

    const answers = [miners.talkTo(game.state), miners.talkTo(game.state)]

    for (const answer of answers) {
      expectMarkupWellFormed(answer)
      expectDialogueSpeaker(answer, miners.name)
    }
  })
})
