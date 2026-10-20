import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { TrainingSword } from './TrainingSword'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
  expectNoSpeechOutsideDialogue,
} from '@/testing/gameHelpers'

describe('Training Sword markup', () => {
  it('attributes both demonstrations to Sir Cedric', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.CastleCourtyard
    const sword = new TrainingSword()

    const first = sword.use(game.state)
    const second = sword.use(game.state)

    expect(first).toContain('Excellent! Your martial training is evident')
    expect(second).toContain('Your skills remain sharp')
    for (const answer of [first, second]) {
      expectMarkupWellFormed(answer)
      expectDialogueSpeaker(answer, 'Sir Cedric')
      expectNoSpeechOutsideDialogue(answer)
    }
  })
})
