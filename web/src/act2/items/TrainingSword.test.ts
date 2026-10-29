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
  it('attributes the bout and the later practice to Sir Cedric', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.CastleCourtyard
    const sword = new TrainingSword()

    const first = sword.use(game.state)
    game.commandParser.parse('say guard to sir cedric')
    game.commandParser.parse('say turn to sir cedric')
    const pass = game.commandParser.parse('say strike to sir cedric')
    const second = sword.use(game.state)

    expect(first).toContain('High cut!')
    expect(pass).toContain('Three for three.')
    expect(second).toContain('Your skills remain sharp')
    expect(second).toContain(
      'Keep them that way in the forest. The market first, then',
    )
    expect(second).not.toMatch(/mystical|ancient|darkness|wisdom/i)
    for (const answer of [first, pass, second]) {
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

    const recognition = first.indexOf('That notch by the guard.')
    const bout = first.indexOf('He takes a practice blade')
    expect(first).toContain('catches your wrist and turns the blade')
    expect(first).toContain('Show me what he taught you, then.')
    expect(recognition).toBeGreaterThan(-1)
    expect(bout).toBeGreaterThan(recognition)
    expect(first).not.toContain('Three for three.')
    expectMarkupWellFormed(first)
    expectNoSpeechOutsideDialogue(first)
  })

  it('narrates the practice away from Sir Cedric', () => {
    const game = new Game([new Act2()])
    game.state.addItemToInventory(new TrainingSword())

    expect(game.commandParser.parse('use training sword')).toContain(
      'You practice a few sword forms with the training sword. The balance ' +
        'is good. Somebody swung this a great deal, a long time ago.',
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
