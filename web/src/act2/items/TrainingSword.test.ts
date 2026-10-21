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

describe("Training Sword as Cedric's old blade", () => {
  it('mentions the notch in its description', () => {
    const sword = new TrainingSword()

    expect(sword.description).toContain('there is a small notch near the guard')
    expect(sword.description).toContain('worn smooth by years of a young hand')
  })

  it('has Cedric recognise the blade before the forms, once', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.CastleCourtyard
    const sword = new TrainingSword()

    const first = sword.use(game.state)
    const second = sword.use(game.state)

    const recognition = first.indexOf('That notch by the guard.')
    const forms = first.indexOf('You draw the training sword and perform')
    expect(first).toContain('catches your wrist and turns the blade')
    expect(first).toContain('Show me what he taught you, then.')
    expect(recognition).toBeGreaterThan(-1)
    expect(forms).toBeGreaterThan(recognition)
    expect(first).toContain('Excellent! Your martial training is evident')
    expect(second).not.toContain('That notch by the guard.')
    expectMarkupWellFormed(first)
    expectNoSpeechOutsideDialogue(first)
  })

  it('is unchanged away from Sir Cedric', () => {
    const game = new Game([new Act2()])
    const sword = new TrainingSword()

    expect(sword.use(game.state)).toContain(
      'You practice a few sword forms with the training sword.',
    )
  })

  it('is unchanged in the courtyard without Sir Cedric', () => {
    const game = new Game([new Act2()])
    const courtyard = game.state.allRooms.CastleCourtyard
    courtyard.characters = []
    game.state.currentRoom = courtyard

    const text = new TrainingSword().use(game.state)

    expect(text).toContain('You practice a few sword forms')
    expect(text).not.toContain('That notch by the guard.')
  })
})
