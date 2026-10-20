import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { FLAG_READ_TRAVELERS_JOURNAL } from '../Act2StoryFlags'
import { Historians } from './Historians'
import { TravelersJournal } from '../items/TravelersJournal'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
  expectNoSpeechOutsideDialogue,
} from '@/testing/gameHelpers'

/** An Act II game for the historians' dialogue. */
function createGame(): Game {
  return new Game([new Act2()])
}

describe('Historians dialogue markup', () => {
  it('attributes the welcome to the historians', () => {
    const game = createGame()

    const answer = new Historians().talkTo(game.state)

    expect(answer).toContain('Welcome to the historical archives')
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, 'historians')
  })

  it('attributes showing the journal and the follow-up to the historians', () => {
    const game = createGame()
    const historians = new Historians()
    game.state.setStoryFlag(FLAG_READ_TRAVELERS_JOURNAL, true)
    const shown = historians.giveItem(game.state, new TravelersJournal())

    const followUp = historians.talkTo(game.state)

    expect(shown).toContain('This is fascinating!')
    expect(followUp).toContain('most illuminating')
    for (const answer of [shown, followUp]) {
      expectMarkupWellFormed(answer)
      expectDialogueSpeaker(answer, 'historians')
      expectNoSpeechOutsideDialogue(answer)
    }
  })
})
