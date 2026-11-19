import { describe, expect, it } from 'vitest'
import {
  wordsMissingOnPath,
  wordsNeverMetOnPath,
} from '@/testing/sayWordsOnPath'
import { Act2 } from './Act2'
import { ACT2_GOLDEN_PATH } from './Act2GoldenPath'

/**
 * The words its golden path says that no line of the story has put in front
 * of Elior by then, so Say… cannot offer them yet. They are the answers the
 * act's riddles ask the player to work out, raised with the navigator rather
 * than reworded (rq-v29l.18); the list only shrinks.
 */
const UNOFFERED = ['mask', 'truth']

/**
 * Vocabulary words no step of the golden path meets: each is a deliberate,
 * visible gap (a word of an optional branch, or one only a journal or an
 * italic line gives), raised in the PR of rq-v29l.18; the list only shrinks.
 */
const NEVER_MET: string[] = []

describe('Act 2 words under Say…', () => {
  it('offers the words its golden path says, but the riddle answers no line has given', () => {
    const missing = wordsMissingOnPath(new Act2(), ACT2_GOLDEN_PATH)
    expect(missing.map((entry) => entry.word)).toEqual(UNOFFERED)
  })

  it('lists the words of its vocabulary that no step of the golden path puts in front of Elior', () => {
    expect(wordsNeverMetOnPath(new Act2(), ACT2_GOLDEN_PATH)).toEqual(NEVER_MET)
  })
})
