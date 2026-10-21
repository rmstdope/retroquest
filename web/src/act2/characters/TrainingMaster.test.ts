import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { TrainingMaster } from './TrainingMaster'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
  expectNoSpeakerLabelInDialogue,
} from '@/testing/gameHelpers'

describe('Training Master dialogue markup', () => {
  it('attributes both conversations without inner labels', () => {
    const game = new Game([new Act2()])
    const master = new TrainingMaster()

    const first = master.talkTo(game.state)
    const second = master.talkTo(game.state)

    expect(first).toContain('papers somewhere that tell a different story')
    expect(second).toContain('Perhaps the squires might know more')
    for (const answer of [first, second]) {
      expectMarkupWellFormed(answer)
      expectDialogueSpeaker(answer, 'Training Master')
      expectNoSpeakerLabelInDialogue(answer)
    }
  })
})
