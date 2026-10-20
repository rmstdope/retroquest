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
