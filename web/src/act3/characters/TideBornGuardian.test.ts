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

describe('TideBornGuardian', () => {
  it('returns the prompt for a vow when talked to', () => {
    const g = makeGameState()
    const guardian = new TideBornGuardian()

    const res = guardian.talkTo(g)

    expect(res).toContain('will not abandon')
  })

  it("sets the vow flag when told 'myself'", () => {
    const g = makeGameState()
    const guardian = new TideBornGuardian()
    expect(g.getStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE)).toBe(false)

    const res = guardian.sayTo(g, 'myself')

    expect(res).toContain('Crystal of Light')
    expect(g.getStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE)).toBe(true)
  })

  it('rejects other words without setting the flag', () => {
    const g = makeGameState()
    const guardian = new TideBornGuardian()

    const res = guardian.sayTo(g, 'not the vow')

    expect(res).toContain('not the vow')
    expect(g.getStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE)).toBe(false)
  })

  it('attributes the vow prompt to the guardian', () => {
    const guardian = new TideBornGuardian()
    const answer = guardian.talkTo(makeGameState())

    expect(answer).toContain('Name what you will not abandon')
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, guardian.name)
  })

  it('narrates a wrong vow without speakerless dialogue', () => {
    const answer = new TideBornGuardian().sayTo(makeGameState(), 'gold')

    expect(answer).toContain('not the vow')
    expectMarkupWellFormed(answer)
    expectNoSpeakerlessDialogue(answer)
  })
})
