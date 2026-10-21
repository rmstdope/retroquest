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

/** An Act II game with the Water Nymphs present in the Whispering Glade. */
function createGameWithNymphs(): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom = game.state.allRooms.WhisperingGlade
  game.state.currentRoom.characters.push(new WaterNymphs())
  return game
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
    const game = createGameWithNymphs()
    game.commandParser.parse('talk to water nymphs')

    const answer = game.commandParser.parse('say wrong to water nymphs')

    expect(answer).toContain("shake their heads gently as you say 'wrong'")
    expect(answer).toContain('Not quite, young seeker')
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, SPEAKER)
    expectNoSpeechOutsideDialogue(answer)
  })

  it('keeps narration outside dialogue when no riddles remain', () => {
    const game = new Game([new Act2()])
    const nymphs = new WaterNymphs()
    nymphs.currentRiddle = nymphs.riddles.length

    const answer = nymphs.talkTo(game.state)

    expect(answer).toContain('smile mysteriously')
    expect(answer).not.toContain('[dialogue]The')
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, SPEAKER)
  })
})

const NYMPH_BLIGHT =
  'Yet the streams come down thinner from the hills this season, seeker. ' +
  'Something up there drinks before we do, and the fields below the city ' +
  'taste it first.'

describe('Water Nymphs and the blight', () => {
  it('says nothing of it while a riddle is open or on the last answer', () => {
    const game = createGameWithNymphs()

    expect(game.commandParser.parse('talk to water nymphs')).not.toContain(
      'thinner',
    )
    game.commandParser.parse('say tree to water nymphs')
    game.commandParser.parse('say water to water nymphs')
    const last = game.commandParser.parse('say ants to water nymphs')

    expect(last).toContain('all three riddles answered')
    expect(last).not.toContain('thinner')
  })

  it('adds the line after the praise on every later talk', () => {
    const game = createGameWithNymphs()
    for (const word of ['tree', 'water', 'ants'])
      game.commandParser.parse(`say ${word} to water nymphs`)

    for (let i = 0; i < 2; i++) {
      const answer = game.commandParser.parse('talk to water nymphs')
      const order = [
        'shimmer with approval',
        'You have proven your wisdom',
        NYMPH_BLIGHT,
      ].map((part) => answer.indexOf(part))
      expect(order.every((n) => n >= 0)).toBe(true)
      expect(order).toEqual([...order].sort((a, b) => a - b))
      expectMarkupWellFormed(answer)
      expectDialogueSpeaker(answer, SPEAKER)
      expectNoSpeechOutsideDialogue(answer)
    }
  })
})
