import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import {
  FLAG_BRENN_FORGIVEN,
  FLAG_FOUND_LOST_CARAVAN,
  VIRTUE_MERCY,
} from '../Act2StoryFlags'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

const BRENN_FIRST = ', my guard, came stumbling back alone two nights ago.'
const BRENN_AFTER = 'Which leaves [character_name]Brenn[/character_name].'
const REMEMBERED = '✦ Mercy — this will be remembered'

/** An Act II game in the Market District. */
function gameAtThorne(): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom = game.state.allRooms.MarketDistrict
  return game
}

/** The caravan found; the documents talk already held. */
function gameAfterRescue(): Game {
  const game = gameAtThorne()
  game.state.setStoryFlag(FLAG_FOUND_LOST_CARAVAN, true)
  game.commandParser.parse('talk to caravan master thorne')
  return game
}

describe('Caravan Master Thorne and Brenn (mercy moment)', () => {
  it('names Brenn after his opening plea, in the first talk only', () => {
    const game = gameAtThorne()

    const first = game.commandParser.parse('talk to caravan master thorne')
    const second = game.commandParser.parse('talk to caravan master thorne')

    expect(first).toContain('Would you be willing to search for them?')
    expect(first).toContain(BRENN_FIRST)
    expect(first.indexOf(BRENN_FIRST)).toBeGreaterThan(
      first.indexOf('forever in your debt'),
    )
    expect(second).not.toContain(BRENN_FIRST)
    expectMarkupWellFormed(first)
    expectDialogueSpeaker(first, 'caravan master thorne')
  })

  it('leaves the documents talk unchanged', () => {
    const game = gameAtThorne()
    game.state.setStoryFlag(FLAG_FOUND_LOST_CARAVAN, true)

    const answer = game.commandParser.parse('talk to caravan master thorne')

    expect(answer).toContain('Thorne hands you a stack of')
    expect(answer).not.toContain(BRENN_AFTER)
  })

  it('hands the documents over in narration, after his words', () => {
    const game = gameAtThorne()
    game.state.setStoryFlag(FLAG_FOUND_LOST_CARAVAN, true)

    const answer = game.commandParser.parse('talk to caravan master thorne')

    expect(answer).toContain(
      "I believe they could clear a good man's name.[/dialogue]\n" +
        'Thorne hands you a stack of [item_name]secret documents[/item_name].',
    )
    expect(answer).not.toContain('As promised')
    expectMarkupWellFormed(answer)
  })

  it('counts the days while the caravan is lost', () => {
    const game = gameAtThorne()
    game.commandParser.parse('talk to caravan master thorne')

    const answer = game.commandParser.parse('talk to caravan master thorne')

    expect(answer).toContain(
      "Any word? … No. I've stopped counting the goods. I count the days.",
    )
    expectDialogueSpeaker(answer, 'caravan master thorne')
  })

  it('ends every later talk with the Brenn line until Elior speaks', () => {
    const game = gameAfterRescue()

    for (let i = 0; i < 2; i++) {
      const answer = game.commandParser.parse('talk to caravan master thorne')
      expect(answer).toContain('I still wake up counting them')
      expect(answer).toContain(BRENN_AFTER)
      expect(answer.indexOf(BRENN_AFTER)).toBeGreaterThan(
        answer.indexOf('I still wake up counting them'),
      )
      expectMarkupWellFormed(answer)
      expectDialogueSpeaker(answer, 'caravan master thorne')
    }
  })

  it('records mercy with the speaking-for, his reply and the remembered line', () => {
    const game = gameAfterRescue()

    const answer = game.commandParser.parse('say forgive to thorne')

    expect(answer).toContain('You speak for')
    expect(answer).toContain('fear is not the same as cowardice')
    expect(answer).toContain(
      "… He did come back, didn't he. … All right. One more road. If he runs again, he walks home.",
    )
    expect(answer).toContain(REMEMBERED)
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, 'caravan master thorne')
    expect(game.state.hasVirtue(VIRTUE_MERCY)).toBe(true)
    expect(game.state.getStoryFlag(FLAG_BRENN_FORGIVEN)).toBe(true)
  })

  it('records the moment although Act I already recorded mercy', () => {
    const game = gameAfterRescue()
    game.state.addVirtue(VIRTUE_MERCY)

    expect(game.commandParser.parse('say forgive to thorne')).toContain(
      REMEMBERED,
    )
  })

  it('drops the Brenn line after forgiving and adds nothing', () => {
    const game = gameAfterRescue()
    game.commandParser.parse('say forgive to thorne')

    const answer = game.commandParser.parse('talk to caravan master thorne')

    expect(answer).toContain('I still wake up counting them')
    expect(answer).not.toContain(BRENN_AFTER)
    expect(answer).not.toContain('remembered')
  })

  it('answers a second plea without a second remembered line', () => {
    const game = gameAfterRescue()
    game.commandParser.parse('say forgive to thorne')

    const answer = game.commandParser.parse('say forgive to thorne')

    expect(answer).toContain('I said one more road, and I meant it.')
    expect(answer).not.toContain('remembered')
    expectDialogueSpeaker(answer, 'caravan master thorne')
  })

  it('asks Elior to come back before the rescue and records nothing', () => {
    const game = gameAtThorne()

    const answer = game.commandParser.parse('say forgive to thorne')

    expect(answer).toContain('Ask me again when my people are home')
    expect(answer).not.toContain('remembered')
    expect(game.state.hasVirtue(VIRTUE_MERCY)).toBe(false)
    expectDialogueSpeaker(answer, 'caravan master thorne')
  })

  it('asks again when the caravan is found but Elior has not yet returned', () => {
    const game = gameAtThorne()
    game.state.setStoryFlag(FLAG_FOUND_LOST_CARAVAN, true)

    const answer = game.commandParser.parse('say forgive to thorne')

    expect(answer).toContain('Ask me again when my people are home')
    expect(game.state.hasVirtue(VIRTUE_MERCY)).toBe(false)
  })
})

describe('Caravan Master Thorne and the week the king went', () => {
  const ROAD_LINE =
    "Our road to Heavensforth runs along the forest's edge. It was safe " +
    "enough a month ago, while the king's riders patrolled it. Nobody " +
    'patrols it since the king went; every rider the castle has is out ' +
    'looking for him.'

  it('puts the line between the plea and Brenn, in the first talk only', () => {
    const game = gameAtThorne()

    const first = game.commandParser.parse('talk to caravan master thorne')
    const second = game.commandParser.parse('talk to caravan master thorne')

    expect(first).toContain(ROAD_LINE)
    expect(first.indexOf(ROAD_LINE)).toBeGreaterThan(
      first.indexOf('forever in your debt'),
    )
    expect(first.indexOf(ROAD_LINE)).toBeLessThan(first.indexOf(BRENN_FIRST))
    expectMarkupWellFormed(first)
    expectDialogueSpeaker(first, 'caravan master thorne')
    expect(second).not.toContain(ROAD_LINE)
  })

  it('leaves the rescue and later talks unchanged', () => {
    const game = gameAfterRescue()

    expect(
      game.commandParser.parse('talk to caravan master thorne'),
    ).not.toContain(ROAD_LINE)
  })
})

describe('Caravan Master Thorne points to Brenn in the warehouse', () => {
  it('says Brenn is skulking in the warehouse in the first talk', () => {
    const game = gameAtThorne()

    const first = game.commandParser.parse('talk to caravan master thorne')

    expect(first).toContain(
      "Ran! He's skulking in the warehouse now. I'll deal with him once my people are home.",
    )
    expect(first.indexOf("He's skulking")).toBeLessThan(
      first.indexOf("I'll deal with him"),
    )
  })

  it('says Brenn sits in the warehouse, not outside it, after the rescue', () => {
    const game = gameAfterRescue()

    const answer = game.commandParser.parse('talk to caravan master thorne')

    expect(answer).toContain(
      "He's sitting in the warehouse waiting for his wages, and wages are all he'll get from me.",
    )
    expect(answer).not.toContain('outside the warehouse')
  })
})
