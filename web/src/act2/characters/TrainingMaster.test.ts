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
    expect(first).toContain('I have known Cedric twenty years.')
    expect(first).not.toMatch(/It pains me|never sat right/)
    expect(second).toContain('Ask the squires.')
    for (const answer of [first, second]) {
      expectMarkupWellFormed(answer)
      expectDialogueSpeaker(answer, 'Training Master')
      expectNoSpeakerLabelInDialogue(answer)
    }
  })
})
