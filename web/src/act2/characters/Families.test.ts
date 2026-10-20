import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { WalkingStick } from '../items/WalkingStick'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
  expectNoSpeechOutsideDialogue,
} from '@/testing/gameHelpers'

const SPEAKER = 'families'

/** An Act II game where the player has helped the elderly residents. */
function createGameAfterHelpingElders(): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom = game.state.allRooms.ResidentialQuarter
  game.state.addItemToInventory(new WalkingStick())
  game.commandParser.parse('give walking stick to families')
  return game
}

/** The answer is well formed and the families speak every dialogue. */
function expectFamiliesSpeak(answer: string): void {
  expectMarkupWellFormed(answer)
  expectDialogueSpeaker(answer, SPEAKER)
  expectNoSpeechOutsideDialogue(answer)
}

describe('Families dialogue markup', () => {
  it('gives the herbs as attributed dialogue on the first talk after helping', () => {
    const game = createGameAfterHelpingElders()

    const answer = game.commandParser.parse('talk to families')

    expect(answer).toContain('Here, dear,')
    expect(answer).toContain('rare healing herbs')
    expect(answer).toContain('You receive')
    expect(game.state.hasItem('healing herbs')).toBe(true)
    expectFamiliesSpeak(answer)
  })

  it('attributes later talks to the families', () => {
    const game = createGameAfterHelpingElders()
    game.commandParser.parse('talk to families')

    const answer = game.commandParser.parse('talk to families')

    expect(answer).toContain('Welcome to our neighborhood!')
    expect(answer).not.toContain('Here, dear,')
    expectFamiliesSpeak(answer)
  })
})
