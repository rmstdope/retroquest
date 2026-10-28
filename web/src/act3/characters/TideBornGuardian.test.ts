import { describe, it, expect } from 'vitest'
import { Game, type GameState } from '@/engine'
import { Act3 } from '../Act3'
import { FLAG_ACT3_VOW_OF_COURAGE_MADE } from '../Act3StoryFlags'
import { TideBornGuardian } from './TideBornGuardian'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

const DIALOGUE_PATTERN = /\[dialogue\].*?\[\/dialogue\]/gs
const CHARACTER_NAME_PATTERN = /\[character_name\](.*?)\[\/character_name\]/s

/** No dialogue block in text lacks a preceding speaker name. */
function expectNoSpeakerlessDialogue(text: string): void {
  let narration = ''
  let position = 0
  for (const block of text.matchAll(DIALOGUE_PATTERN)) {
    narration += text.slice(position, block.index)
    position = block.index + block[0].length
    expect(
      CHARACTER_NAME_PATTERN.test(narration),
      `no speaker before dialogue in: ${text}`,
    ).toBe(true)
  }
}

/** A minimal game state for character tests. */
function makeGameState(): GameState {
  return new Game([new Act3()]).state
}

/** Walk the guardian's trial to the third step. */
function walkThrough(guardian: TideBornGuardian, g: GameState): void {
  guardian.walkEast(g)
  guardian.walkEast(g)
  guardian.walkEast(g)
}

describe('TideBornGuardian', () => {
  it('tells Elior to walk when talked to on the shore', () => {
    const guardian = new TideBornGuardian()

    const res = guardian.talkTo(makeGameState())

    expect(res).toContain('Walk east into the water')
    expect(res).toContain('I will ask you one thing')
  })

  it("sets the vow flag when told 'myself'", () => {
    const g = makeGameState()
    const guardian = new TideBornGuardian()
    walkThrough(guardian, g)
    expect(g.getStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE)).toBe(false)

    const res = guardian.sayTo(g, 'myself')

    expect(res).toContain('crystal of light')
    expect(g.getStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE)).toBe(true)
  })

  it('rejects other words without setting the flag', () => {
    const g = makeGameState()
    const guardian = new TideBornGuardian()
    walkThrough(guardian, g)

    const res = guardian.sayTo(g, 'not the vow')

    expect(res).toContain('That is not what you carried through the water')
    expect(g.getStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE)).toBe(false)
  })

  it('attributes the question at the third step to the guardian', () => {
    const guardian = new TideBornGuardian()
    const g = makeGameState()
    walkThrough(guardian, g)
    const answer = guardian.talkTo(g)

    expect(answer).toContain('What did you not abandon?')
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, guardian.name)
  })

  it('narrates a wrong vow without speakerless dialogue', () => {
    const guardian = new TideBornGuardian()
    const g = makeGameState()
    walkThrough(guardian, g)
    const answer = guardian.sayTo(g, 'gold')

    expect(answer).toContain('The tide listens')
    expectMarkupWellFormed(answer)
    expectNoSpeakerlessDialogue(answer)
  })

  it('starts at the edge and counts three steps', () => {
    const g = makeGameState()
    const guardian = new TideBornGuardian()
    expect(guardian.step()).toBe(0)
    expect(guardian.walkEast(g)).toContain('cold to the knees')
    expect(guardian.step()).toBe(1)
    expect(guardian.walkEast(g)).toContain('Turn back, Elior')
    expect(guardian.step()).toBe(2)
    const third = guardian.walkEast(g)
    expect(third).toContain('The water is at your chest')
    expect(third).toContain('the only light in the world')
    expect(third).toContain('You came through. What did you not abandon?')
    expect(guardian.step()).toBe(3)
    expect(guardian.walkEast(g)).toBe(guardian.lookLine(g))
    expect(guardian.step()).toBe(3)
  })

  it('gives each position its look line', () => {
    const g = makeGameState()
    const guardian = new TideBornGuardian()
    expect(guardian.lookLine(g)).toContain('You stand at the edge')
    guardian.walkEast(g)
    expect(guardian.lookLine(g)).toContain('Black water to your knees')
    guardian.walkEast(g)
    expect(guardian.lookLine(g)).toContain('Black water to your waist')
    guardian.walkEast(g)
    expect(guardian.lookLine(g)).toContain('The water stands parted')
  })

  it('wades back to the edge from any step', () => {
    const g = makeGameState()
    const guardian = new TideBornGuardian()
    guardian.walkEast(g)
    guardian.walkEast(g)
    expect(guardian.turnBack()).toContain('You wade back to the edge')
    expect(guardian.step()).toBe(0)
  })

  it('refuses words before the third step', () => {
    const g = makeGameState()
    const guardian = new TideBornGuardian()
    guardian.walkEast(g)
    const res = guardian.sayTo(g, 'myself')
    expect(res).toContain('Words are easy on the shore. Walk first.')
    expect(g.getStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE)).toBe(false)
  })

  it.each([
    ['mira', 'Mira was not in the water with you'],
    ['Cedric', 'The knight stayed at the door'],
    ['sir cedric', 'The knight stayed at the door'],
    ['my friends', 'Your friends were behind you'],
    ['friends', 'Your friends were behind you'],
    ['the king', 'The king is the reason you came'],
    ['my king', 'The king is the reason you came'],
    ['king', 'The king is the reason you came'],
    ['my parents', 'They did not walk this water with you. Who did?'],
    ['parents', 'They did not walk this water with you. Who did?'],
    ['me', 'Nearly. Say it the way you would swear it.'],
    ['Elior', 'Nearly. Say it the way you would swear it.'],
    ['i did', 'Nearly. Say it the way you would swear it.'],
  ])('answers the near miss %s specifically', (words, line) => {
    const g = makeGameState()
    const guardian = new TideBornGuardian()
    walkThrough(guardian, g)
    const res = guardian.sayTo(g, words)
    expect(res).toContain(line)
    expect(g.getStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE)).toBe(false)
    expectMarkupWellFormed(res)
  })

  it('no longer says the parents are always with him (the Red Line)', () => {
    const g = makeGameState()
    const guardian = new TideBornGuardian()
    walkThrough(guardian, g)
    expect(guardian.sayTo(g, 'my parents')).not.toContain('with you always')
  })

  it('shows the crystal loose after the vow, without telling Elior to take it', () => {
    const g = makeGameState()
    const guardian = new TideBornGuardian()
    walkThrough(guardian, g)
    const res = guardian.sayTo(g, 'myself')
    expect(res).toContain(
      '[success]The water draws back from you, all the way to the walls. ' +
        'The [item_name]crystal of light[/item_name] sits loose in its ' +
        'basin.[/success]',
    )
    expect(res).toContain(
      'You walked in whole, and you walked out whole.[/dialogue]',
    )
    expect(res).not.toContain('You may now')
    expect(res).not.toContain('courage the crystal asks for')
  })

  it('marks names and the crystal in the walk', () => {
    const g = makeGameState()
    const guardian = new TideBornGuardian()
    expect(guardian.lookLine(g)).toContain(
      'Somewhere ahead, the [character_name]Tide-Born ' +
        'Guardian[/character_name] waits.',
    )
    guardian.walkEast(g)
    const second = guardian.walkEast(g)
    expect(second).toContain(
      'The water climbs to your waist. Then a voice like ' +
        "[character_name]Mira[/character_name]'s, close behind you:",
    )
    const third = guardian.walkEast(g)
    expect(third).toContain(
      'You call for [character_name]Sir Cedric[/character_name]. Nothing ' +
        'comes back. You take the step anyway.',
    )
    expect(third).toContain(
      'the [item_name]crystal of light[/item_name] burns in its basin',
    )
    expect(guardian.lookLine(g)).toContain(
      'The [item_name]crystal of light[/item_name] burns in its basin',
    )
  })

  it('describes a shape of standing water', () => {
    expect(new TideBornGuardian().description).toBe(
      'A shape of standing water the height of a man. Ward-sigils drift in ' +
        'it like weed in a current.',
    )
  })

  it('explains itself after the vow and then tells of Aren', () => {
    const g = makeGameState()
    const guardian = new TideBornGuardian()
    walkThrough(guardian, g)
    const res = guardian.sayTo(g, '"Myself!"')
    expect(res).toContain('Most name a person')
    expect(res).toContain('the chamber is lit as you first saw it')
    expectMarkupWellFormed(res)
    const talk = guardian.talkTo(g)
    expect(talk).toContain('He asked me to test whoever came after him')
    expectMarkupWellFormed(talk)
  })

  it('plays the darkness once, then the short return line', () => {
    const g = makeGameState()
    const guardian = new TideBornGuardian()
    expect(guardian.enterLine(g)).toContain('every light goes out at once')
    guardian.walkEast(g)
    expect(guardian.enterLine(g)).toContain('The lights go out again')
    expect(guardian.step()).toBe(0)
    g.setStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE, true)
    expect(guardian.enterLine(g)).toBe('')
  })

  it('reads a save without trial fields as the edge of the dark', () => {
    const guardian = new TideBornGuardian()
    guardian.trialStep = undefined
    guardian.trialBegun = undefined
    expect(guardian.step()).toBe(0)
    expect(guardian.enterLine(makeGameState())).toContain(
      'every light goes out',
    )
  })
})
