import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { Phoenix } from './Phoenix'
import {
  FLAG_ACT3_CHARRED_INSCRIPTION_READ,
  FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED,
  FLAG_ACT3_PHOENIX_STORY_TOLD,
} from '../Act3StoryFlags'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

describe('Phoenix dialogue markup', () => {
  it('attributes the riddle, wrong answer, right answer and repeat to the phoenix', () => {
    const game = new Game([new Act3()])
    const phoenix = new Phoenix()
    const answers = [phoenix.talkTo(game.state)]
    answers.push(phoenix.sayTo(game.state, 'haste'))
    answers.push(phoenix.sayTo(game.state, 'patience'))
    answers.push(phoenix.sayTo(game.state, 'patience'))

    expect(game.state.hasItem('Phoenix Feather')).toBe(true)
    for (const answer of answers) {
      expectMarkupWellFormed(answer)
      expectDialogueSpeaker(answer, phoenix.name)
    }
  })
})

const HINT =
  'I asked this once of the Warden of Wisdom, when he came to me with his two friends. ' +
  'He knew the answer, and did not keep it.'
const LINK =
  'He gave your answer too. Then time grew short for his friends, and patience was the one thing ' +
  'he had none of. Do not become what he became.'
const FAREWELL = 'Remember him when time is short for you.'
const TERRACES =
  'You think of the third name burned deeper than the others on the terraces.'
const NOD = 'inclines its head.'

describe('Phoenix links patience to the Warden of Wisdom', () => {
  it('adds the hint to the riddle on every talk before the feather', () => {
    const game = new Game([new Act3()])
    const phoenix = new Phoenix()
    const first = phoenix.talkTo(game.state)
    expect(first).toContain('What is wisdom when time is short?')
    expect(first).toContain(HINT)
    expect(phoenix.talkTo(game.state)).toBe(first)
    expect(first).not.toContain('Malakar')
    expect(first.indexOf(HINT)).toBeGreaterThan(
      first.indexOf('What is wisdom when time is short?'),
    )
  })

  it('leaves the wrong-answer reply unchanged', () => {
    const game = new Game([new Act3()])
    const phoenix = new Phoenix()
    phoenix.talkTo(game.state)
    const reply = phoenix.sayTo(game.state, 'haste')
    expect(reply).toContain('Is that truly wisdom, when time is short?')
    expect(reply).not.toContain(LINK)
  })

  it('adds the link and the terraces line when the inscription was read', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ, true)
    const phoenix = new Phoenix()
    phoenix.talkTo(game.state)
    const reply = phoenix.sayTo(game.state, 'patience')
    expect(reply).toContain('Take this, and remember.')
    expect(reply).toContain(LINK)
    expect(reply.indexOf(LINK)).toBeGreaterThan(reply.indexOf('remember'))
    expect(reply).toContain(TERRACES)
    expect(reply.indexOf(TERRACES)).toBeGreaterThan(reply.indexOf(LINK))
    expectMarkupWellFormed(reply)
  })

  it('leaves out the terraces line when the inscription was not read', () => {
    const game = new Game([new Act3()])
    const phoenix = new Phoenix()
    phoenix.talkTo(game.state)
    const reply = phoenix.sayTo(game.state, 'patience')
    expect(reply).toContain(LINK)
    expect(reply).not.toContain(TERRACES)
    game.state.setStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ, true)
    expect(phoenix.talkTo(game.state)).not.toContain(TERRACES)
  })

  it('says a farewell instead of the riddle once the feather is earned', () => {
    const game = new Game([new Act3()])
    const phoenix = new Phoenix()
    phoenix.talkTo(game.state)
    phoenix.sayTo(game.state, 'patience')
    const farewell = phoenix.talkTo(game.state)
    expect(farewell).toContain(NOD)
    expect(farewell).toContain(FAREWELL)
    expect(farewell).not.toContain('What is wisdom')
    expect(farewell.indexOf(NOD)).toBeLessThan(farewell.indexOf(FAREWELL))
    expectMarkupWellFormed(farewell)
    expectDialogueSpeaker(farewell, phoenix.name)
    expect(phoenix.sayTo(game.state, 'anything')).toContain(
      'You already hold what you have earned.',
    )
  })

  it('gives the farewell to a phoenix that never posed the riddle this session', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, true)
    const reply = new Phoenix().talkTo(game.state)
    expect(reply).toContain(FAREWELL)
    expect(reply).not.toContain('What is wisdom')
  })

  it('still gives the farewell after a save and load', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, true)
    const fresh = new Game([new Act3()])
    fresh.loadSaveData(game.toSaveData())
    expect(fresh.state.getStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED)).toBe(
      true,
    )
    expect(new Phoenix().talkTo(fresh.state)).toContain(FAREWELL)
  })
})

describe('Phoenix accepts the riddle answer only as a whole word', () => {
  const REFUSAL = 'Is that truly wisdom, when time is short?'

  it.each(['impatience', 'uncalm', 'release', 'please', 'disease'])(
    'refuses "%s" and keeps the feather',
    (words) => {
      const game = new Game([new Act3()])
      const phoenix = new Phoenix()
      phoenix.talkTo(game.state)
      expect(phoenix.sayTo(game.state, words)).toContain(REFUSAL)
      expect(game.state.hasItem('Phoenix Feather')).toBe(false)
      expect(game.state.getStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED)).toBe(
        false,
      )
    },
  )

  it.each([
    'patience',
    'be patient',
    'calm',
    'Patience.',
    'ease',
    'calmly',
    'calmness',
    'patiently',
  ])('gives the feather for "%s"', (words) => {
    const game = new Game([new Act3()])
    const phoenix = new Phoenix()
    phoenix.talkTo(game.state)
    expect(phoenix.sayTo(game.state, words)).toContain(
      'Take this, and remember.',
    )
    expect(game.state.hasItem('Phoenix Feather')).toBe(true)
  })
})

const STORY =
  'You saw his name on the terraces, burned deeper than the others. No fire did that. ' +
  'He came back, years after, and struck it again himself, to cut himself out of the promise. ' +
  'The stone would not let him.'

/** A game with the feather earned and the given inscription state. */
function earned(inscriptionRead: boolean): {
  game: Game
  phoenix: Phoenix
  featherReply: string
} {
  const game = new Game([new Act3()])
  const phoenix = new Phoenix()
  phoenix.talkTo(game.state)
  game.state.setStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ, inscriptionRead)
  const featherReply = phoenix.sayTo(game.state, 'patience')
  return { game, phoenix, featherReply }
}

describe('Phoenix tells who struck the name deeper', () => {
  it('tells the story once, then only the farewell', () => {
    const { game, phoenix } = earned(true)
    const first = phoenix.talkTo(game.state)
    expectMarkupWellFormed(first)
    expectDialogueSpeaker(first, phoenix.name)
    expect(first).toContain(STORY)
    expect(first).toContain('The stone would not let him.')
    expect(first.endsWith(`[dialogue]'${FAREWELL}'[/dialogue]`)).toBe(true)
    const second = phoenix.talkTo(game.state)
    expect(second).not.toContain(STORY)
    expect(second).toContain(FAREWELL)
  })

  it('keeps the story pending until the inscription is read', () => {
    const { game, phoenix } = earned(false)
    expect(phoenix.talkTo(game.state)).not.toContain(STORY)
    expect(phoenix.talkTo(game.state)).not.toContain(STORY)
    game.state.setStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ, true)
    expect(phoenix.talkTo(game.state)).toContain(STORY)
    expect(phoenix.talkTo(game.state)).not.toContain(STORY)
  })

  it('does not tell the story in the feather-giving reply', () => {
    const { game, featherReply } = earned(true)
    expect(featherReply).not.toContain(STORY)
    expect(featherReply).toContain(TERRACES)
    expect(game.state.getStoryFlag(FLAG_ACT3_PHOENIX_STORY_TOLD)).toBe(false)
  })
})
