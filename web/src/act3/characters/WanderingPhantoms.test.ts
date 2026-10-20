import { describe, it, expect, vi, afterEach } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { WanderingPhantoms } from './WanderingPhantoms'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

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

const SEEDS = 40

describe('Wandering Phantoms whisper markup', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('narrates every whisper variant without speakerless dialogue', () => {
    const game = new Game([new Act3()])
    const phantoms = new WanderingPhantoms()

    const answers = new Set<string>()
    for (let seed = 0; seed < SEEDS; seed++) {
      vi.spyOn(Math, 'random').mockReturnValue(seed / SEEDS)
      answers.add(phantoms.talkTo(game.state))
    }

    expect(answers.size).toBe(4)
    for (const answer of answers) {
      expectMarkupWellFormed(answer)
      expectNoSpeakerlessDialogue(answer)
    }
  })
})
