import { describe, it, expect, vi, afterEach } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { WanderingPhantoms } from './WanderingPhantoms'
import {
  FLAG_ACT3_PHANTOMS_FREED,
  FLAG_ACT3_PHANTOMS_HEARD,
  FLAG_ACT3_SHELL_HEARD,
} from '../Act3StoryFlags'
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

const HUM =
  'Beneath the whispers, a few of them are humming: a slow tune that climbs ' +
  'three notes and settles home again.'
const SHELL_SENTENCE = ' It is the tune from the shell.'
const REST = 'rest … rest …'

describe('Wandering Phantoms humming', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('hums plainly after every whisper before the rest line', () => {
    const game = new Game([new Act3()])
    const phantoms = new WanderingPhantoms()
    for (let seed = 0; seed < SEEDS; seed++) {
      vi.spyOn(Math, 'random').mockReturnValue(seed / SEEDS)
      const out = phantoms.talkTo(game.state)
      expect(out).toContain('\n\n' + HUM + '\n')
      expect(out).not.toContain(SHELL_SENTENCE)
      expect(out.indexOf(HUM)).toBeLessThan(out.indexOf(REST))
      expectMarkupWellFormed(out)
    }
    expect(game.state.getStoryFlag(FLAG_ACT3_PHANTOMS_HEARD)).toBe(true)
  })

  it('names the shell once the shell has been heard', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_SHELL_HEARD, true)
    const phantoms = new WanderingPhantoms()
    for (let seed = 0; seed < SEEDS; seed++) {
      vi.spyOn(Math, 'random').mockReturnValue(seed / SEEDS)
      const out = phantoms.talkTo(game.state)
      expect(out).toContain('\n\n' + HUM + SHELL_SENTENCE + '\n')
      expect(out.indexOf(HUM)).toBeLessThan(out.indexOf(REST))
      expectMarkupWellFormed(out)
    }
  })
})

describe('Wandering Phantoms hear the word as the engine does', () => {
  it('are freed by a punctuated "Rest."', () => {
    const game = new Game([new Act3()])
    const phantoms = new WanderingPhantoms()

    phantoms.sayTo(game.state, '"Rest."')

    expect(game.state.getStoryFlag(FLAG_ACT3_PHANTOMS_FREED)).toBe(true)
  })
})

describe('Wandering Phantoms in plain words', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('show one repeated action instead of paperback words, and mark their name', () => {
    const game = new Game([new Act3()])
    const phantoms = new WanderingPhantoms()
    const answers = new Set<string>()
    for (let seed = 0; seed < SEEDS; seed++) {
      vi.spyOn(Math, 'random').mockReturnValue(seed / SEEDS)
      answers.add(phantoms.talkTo(game.state))
    }

    for (const answer of answers) {
      expect(answer).toContain('[character_name]phantoms[/character_name]')
      expect(answer).not.toMatch(/ethereal|spectral|forgotten by time|cascade/)
    }
    expect(phantoms.description).toContain(
      'reaches for a door that is not there',
    )
    expect(phantoms.description).not.toMatch(/ethereal|ancient/)
  })

  it('leave with the far wall showing through them', () => {
    const game = new Game([new Act3()])
    const phantoms = new WanderingPhantoms()

    const freed = phantoms.sayTo(game.state, 'rest')

    expect(freed).toContain('you can see the far wall through them')
    expect(freed).toContain('The chamber is quieter for it, but not yet still.')
    expect(freed).not.toContain('morning sun')
  })
})
