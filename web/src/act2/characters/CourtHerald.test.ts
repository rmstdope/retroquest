import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { EntryPass } from '../items/EntryPass'
import { FLAG_COURT_HERALD_FORMAL_PRESENTATION } from '../Act2StoryFlags'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
  expectNoSpeechOutsideDialogue,
} from '@/testing/gameHelpers'

/** An Act II game in the Great Hall. */
function gameInHall(): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom = game.state.allRooms.GreatHall
  return game
}

/** The answer is well formed and the Court Herald speaks every quote. */
function expectHeraldSpeaks(answer: string): void {
  expectMarkupWellFormed(answer)
  expectDialogueSpeaker(answer, 'court herald')
  expectNoSpeechOutsideDialogue(answer)
}

describe('Court Herald', () => {
  it('asks for a pass before presenting anyone', () => {
    const answer = gameInHall().commandParser.parse('talk to court herald')

    expect(answer).toContain(
      'If you carry a pass, hand it to me and I will enter you.',
    )
    expectHeraldSpeaks(answer)
  })

  it('reads the seal twice and enters Elior in the ledger', () => {
    const game = gameInHall()
    game.state.addItemToInventory(new EntryPass())

    const answer = game.commandParser.parse('give entry pass to court herald')

    expect(
      answer.startsWith(
        'The Court Herald reads the seal twice and never looks at the line above it.\n',
      ),
    ).toBe(true)
    expect(answer).toContain(
      'The archives are open to you; the historians keep them.',
    )
    expect(game.state.getStoryFlag(FLAG_COURT_HERALD_FORMAL_PRESENTATION)).toBe(
      true,
    )
    expectHeraldSpeaks(answer)
  })

  it('points at the historians once Elior is presented', () => {
    const game = gameInHall()
    game.state.setStoryFlag(FLAG_COURT_HERALD_FORMAL_PRESENTATION, true)

    const answer = game.commandParser.parse('talk to court herald')

    expect(answer).toContain(
      'The historians know the shelves; ask them where to look.',
    )
    expectHeraldSpeaks(answer)
  })
})
