import { describe, expect, it } from 'vitest'
import { normaliseSpokenWord } from './spokenWord'

describe('normaliseSpokenWord', () => {
  it('trims and lower-cases', () => {
    expect(normaliseSpokenWord('  Truth ')).toBe('truth')
  })

  it('strips straight and curly quotes', () => {
    expect(normaliseSpokenWord('"truth"')).toBe('truth')
    expect(normaliseSpokenWord("'truth'")).toBe('truth')
    expect(normaliseSpokenWord('“truth”')).toBe('truth')
  })

  it('strips trailing punctuation', () => {
    expect(normaliseSpokenWord('truth.')).toBe('truth')
    expect(normaliseSpokenWord('truth!')).toBe('truth')
  })

  it('strips quotes and punctuation together', () => {
    expect(normaliseSpokenWord('"truth."')).toBe('truth')
    expect(normaliseSpokenWord('“truth!”')).toBe('truth')
  })
})
