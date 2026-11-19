import { describe, expect, it } from 'vitest'
import { wordsMissingOnPath } from '@/testing/sayWordsOnPath'
import { Act4 } from './Act4'
import { ACT4_GOLDEN_PATH } from './Act4GoldenPath'

/**
 * The words its golden path says that no line of the story has put in front
 * of Elior by then, so Say… cannot offer them yet. They are the answers the
 * act's riddles ask the player to work out, raised with the navigator rather
 * than reworded (rq-v29l.18); the list only shrinks.
 */
const UNOFFERED = [
  'redemption',
  'nyx',
  'understanding',
  'patience',
  'refrain',
  'forgiveness',
]

describe('Act 4 words under Say…', () => {
  it('offers the words its golden path says, but the riddle answers no line has given', () => {
    const missing = wordsMissingOnPath(new Act4(), ACT4_GOLDEN_PATH)
    expect(missing.map((entry) => entry.word)).toEqual(UNOFFERED)
  })
})
