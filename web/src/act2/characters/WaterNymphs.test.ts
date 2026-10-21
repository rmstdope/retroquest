import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { WaterNymphs } from './WaterNymphs'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
  expectNoSpeechOutsideDialogue,
} from '@/testing/gameHelpers'

const SPEAKER = 'water nymphs'
const HELP =
  "[dim]Think carefully and speak your answer when you believe you know it. Use the command 'say <your_answer> to water nymphs' to give your solution.[/dim]"

/** An Act II game with the Water Nymphs present in the Whispering Glade. */
function createGameWithNymphs(): { game: Game; nymphs: WaterNymphs } {
  const game = new Game([new Act2()])
  const nymphs = new WaterNymphs()
  game.state.currentRoom = game.state.allRooms.WhisperingGlade
  game.state.currentRoom.characters.push(nymphs)
  return { game, nymphs }
}

/** The text inside every [dialogue] block of an answer. */
function spoken(answer: string): string[] {
  return [...answer.matchAll(/\[dialogue\](.*?)\[\/dialogue\]/gs)].map(
    (m) => m[1],
  )
}

describe('Water Nymphs dialogue markup', () => {
  it('uses known tags when answering after the last riddle', () => {
    const game = new Game([new Act2()])
    const nymphs = new WaterNymphs()
    nymphs.currentRiddle = nymphs.riddles.length

    const answer = nymphs.sayTo(game.state, 'water')

    expect(answer).toContain('no more riddles to answer')
    expectMarkupWellFormed(answer)
  })

  it('attributes a wrong answer reply to the nymphs', () => {
    const { game, nymphs } = createGameWithNymphs()
    game.commandParser.parse('talk to water nymphs')

    const answer = game.commandParser.parse('say wrong to water nymphs')

    expect(answer).toContain("shake their heads gently as you say 'wrong'")
    expect(answer).toContain(
      "'Is that really what you think? Will you hear it again?'",
    )
    expect(answer).toContain(nymphs.riddles[0].question)
    expect(answer).toContain(
      "[dim]Consider what you've learned about the forest during your journey.[/dim]",
    )
    expect(answer).not.toContain('Not quite')
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, SPEAKER)
    expectNoSpeechOutsideDialogue(answer)
  })
})

describe('Water Nymphs voice', () => {
  it('welcomes with a question and poses the first riddle', () => {
    const { game, nymphs } = createGameWithNymphs()

    const answer = nymphs.talkTo(game.state)

    expect(answer).toContain('You approach the')
    expect(answer).toContain('by the stream.')
    expect(answer).not.toContain('sacred')
    expect(answer).toContain('The stream rises into shapes. ')
    expect(answer).toContain(
      "'Came all this way to stand in our water? Will you answer three " +
        "questions, then? Here is the first.'",
    )
    expect(answer).toContain(nymphs.riddles[0].question)
    expect(answer).toContain(HELP)
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, SPEAKER)
  })

  it('names the second then the third riddle when talked to mid-riddles', () => {
    const { game, nymphs } = createGameWithNymphs()
    nymphs.currentRiddle = 1
    const second = nymphs.talkTo(game.state)
    nymphs.currentRiddle = 2
    const third = nymphs.talkTo(game.state)

    expect(second).toContain(
      "'Back so soon? Do you remember where we were? The second one, wasn't it?'",
    )
    expect(second).toContain(nymphs.riddles[1].question)
    expect(second).toContain(HELP)
    expect(third).toContain('The third one, wasn')
    expect(third).toContain(nymphs.riddles[2].question)
    expectMarkupWellFormed(second)
    expectDialogueSpeaker(second, SPEAKER)
  })

  it('nods with a question after a right answer and poses the next riddle', () => {
    const { game, nymphs } = createGameWithNymphs()

    const answer = nymphs.sayTo(game.state, 'tree')

    expect(answer).toContain('[success]Correct!')
    expect(answer).toContain(nymphs.riddles[0].explanation)
    expect(answer).toContain(' nod. ')
    expect(answer).toContain(
      "'Did you know it, or guess it? Does it matter? What about this one?'",
    )
    expect(answer).toContain(nymphs.riddles[1].question)
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, SPEAKER)
  })

  it('laughs and releases the pool and flowers on the third right answer', () => {
    const { game, nymphs } = createGameWithNymphs()
    nymphs.currentRiddle = 2

    const answer = nymphs.sayTo(game.state, 'ants')

    expect(answer).toContain(
      "'Three for three — who taught you to listen like that? Will you take " +
        "what grows here? Who else would we give it to?'",
    )
    expect(answer).toContain(
      'The water nymphs draw back from the bank. The clear pool and the ' +
        'pale flowers at its edge are there for the taking.',
    )
    expect(
      game.state.currentRoom.items.map((i) => i.name.toLowerCase()),
    ).toEqual(expect.arrayContaining(['crystal-clear water', 'moonflowers']))
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, SPEAKER)
  })

  it('asks questions after all three riddles and answers speech with a smile', () => {
    const { game, nymphs } = createGameWithNymphs()
    nymphs.currentRiddle = nymphs.riddles.length
    nymphs.riddlesCompleted = true

    const talk = nymphs.talkTo(game.state)
    const said = nymphs.sayTo(game.state, 'hello')

    expect(talk).toContain(
      "'Back again? Wasn't three enough? What more could we ask you?'",
    )
    expect(said).toBe(
      "[dim]The [character_name]water nymphs[/character_name] listen to 'hello' and only smile. They have no more riddles for you.[/dim]",
    )
    expectMarkupWellFormed(talk)
    expectDialogueSpeaker(talk, SPEAKER)
  })

  it('speaks only in questions in the first talk and after the last riddle', () => {
    const { game, nymphs } = createGameWithNymphs()
    const lines = [
      ...spoken(nymphs.talkTo(game.state)).slice(0, 1),
      ...spoken(nymphs.sayTo(game.state, 'tree')).slice(0, 1),
      ...spoken(nymphs.sayTo(game.state, 'wrong')).slice(0, 1),
    ]

    for (const line of lines) {
      expect(line).toContain('?')
    }
  })

  it('describes itself in plain words', () => {
    const { game, nymphs } = createGameWithNymphs()

    const answer = nymphs.examine(game.state)

    expect(nymphs.description).toBe(
      'Three of them, or four; it is hard to count water. They sit ' +
        'waist-deep in the stream, and the stream runs through them.',
    )
    expect(answer).toContain(
      'When you lean closer, every one of them leans closer too.',
    )
    expect(answer).not.toMatch(/ancient|wisdom|sacred/i)
    expectMarkupWellFormed(answer)
  })
})

const NYMPH_BLIGHT =
  'Yet the streams come down thinner from the hills this season, seeker. ' +
  'Something up there drinks before we do, and the fields below the city ' +
  'taste it first.'

describe('Water Nymphs and the blight', () => {
  it('says nothing of it while a riddle is open or on the last answer', () => {
    const { game } = createGameWithNymphs()

    expect(game.commandParser.parse('talk to water nymphs')).not.toContain(
      'thinner',
    )
    game.commandParser.parse('say tree to water nymphs')
    game.commandParser.parse('say water to water nymphs')
    const last = game.commandParser.parse('say ants to water nymphs')

    expect(last).toContain('Three for three')
    expect(last).not.toContain('thinner')
  })

  it('adds the line after the praise on every later talk', () => {
    const { game } = createGameWithNymphs()
    for (const word of ['tree', 'water', 'ants'])
      game.commandParser.parse(`say ${word} to water nymphs`)

    for (let i = 0; i < 2; i++) {
      const answer = game.commandParser.parse('talk to water nymphs')
      const order = ["Wasn't three enough?", NYMPH_BLIGHT].map((part) =>
        answer.indexOf(part),
      )
      expect(order.every((n) => n >= 0)).toBe(true)
      expect(order).toEqual([...order].sort((a, b) => a - b))
      expectMarkupWellFormed(answer)
      expectDialogueSpeaker(answer, SPEAKER)
      expectNoSpeechOutsideDialogue(answer)
    }
  })
})
