import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import {
  FLAG_CEDRIKS_HONOR_COMPLETED,
  FLAG_EXAMINED_SECRET_DOCUMENTS,
} from '../Act2StoryFlags'
import { SecretDocuments } from '../items/SecretDocuments'
import { WalkingStick } from '../items/WalkingStick'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
  expectNoSpeechOutsideDialogue,
} from '@/testing/gameHelpers'

const SPEAKER = 'lord commander'
const TITLE = '[character_name]Lord Commander[/character_name]'

/** An Act II game with the player in the Great Hall. */
function createGameInGreatHall(): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom = game.state.allRooms.GreatHall
  return game
}

/** The answer is well-formed dialogue spoken by the Lord Commander. */
function expectAttributedDialogue(answer: string): void {
  expectMarkupWellFormed(answer)
  expectDialogueSpeaker(answer, SPEAKER)
  expectNoSpeechOutsideDialogue(answer)
}

describe('Lord Commander', () => {
  it('gives a formal welcome when talked to before the evidence', () => {
    const game = createGameInGreatHall()

    const answer = game.commandParser.parse('talk to lord commander')

    expect(answer).toContain(
      "This is the king's hall. Since King Alden vanished I hold his court " +
        'in his name, and no more than that.',
    )
    expect(answer).toContain(`The ${TITLE} greets you formally.`)
    expectAttributedDialogue(answer)
  })

  it('asks for the evidence once the documents are examined', () => {
    const game = createGameInGreatHall()
    game.state.setStoryFlag(FLAG_EXAMINED_SECRET_DOCUMENTS, true)

    const answer = game.commandParser.parse('talk to lord commander')

    expect(answer).toContain('give them to me')
    expect(answer).toContain(`The ${TITLE} looks at you with interest.`)
    expectAttributedDialogue(answer)
  })

  it('confirms justice once the honor is restored', () => {
    const game = createGameInGreatHall()
    game.state.setStoryFlag(FLAG_EXAMINED_SECRET_DOCUMENTS, true)
    game.state.setStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED, true)

    const answer = game.commandParser.parse('talk to lord commander')

    expect(answer).toContain('I have sent riders to Heavensforth')
    expect(answer).toContain(`The ${TITLE} nods with satisfaction.`)
    expectAttributedDialogue(answer)
  })

  it('asks to examine unexamined documents before accepting them', () => {
    const game = createGameInGreatHall()
    const documents = new SecretDocuments()
    game.state.inventory.push(documents)

    const answer = game.commandParser.parse(
      'give secret documents to lord commander',
    )

    expect(answer).toContain('Read them and know what you bring me')
    expect(answer).toContain(`The ${TITLE} glances at the papers`)
    expectAttributedDialogue(answer)
    expect(game.state.inventory).toContain(documents)
    expect(game.state.getStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED)).toBe(false)
  })

  it("restores Sir Cedric's honor when given the examined documents", () => {
    const game = createGameInGreatHall()
    const documents = new SecretDocuments()
    game.state.inventory.push(documents)
    game.state.setStoryFlag(FLAG_EXAMINED_SECRET_DOCUMENTS, true)

    const answer = game.commandParser.parse(
      'give secret documents to lord commander',
    )

    expect(answer).toContain('I hereby restore his knighthood')
    expect(
      answer.startsWith(`[success]The ${TITLE} reads the confession`),
    ).toBe(true)
    expect(answer.endsWith('[/success]')).toBe(true)
    expectAttributedDialogue(answer)
    expect(game.state.inventory).not.toContain(documents)
    expect(game.state.getStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED)).toBe(true)
  })

  it('declines any other item', () => {
    const game = createGameInGreatHall()
    const stick = new WalkingStick()
    game.state.inventory.push(stick)

    const answer = game.commandParser.parse(
      `give ${stick.name} to lord commander`,
    )

    expect(answer).toContain(
      `has no need for your [item_name]${stick.name}[/item_name]`,
    )
    expectMarkupWellFormed(answer)
    expect(answer).toContain(`The ${TITLE} has no need for your`)
    expectNoSpeechOutsideDialogue(answer)
    expect(game.state.inventory).toContain(stick)
    expect(game.state.getStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED)).toBe(false)
  })
})
