import { describe, expect, it } from 'vitest'
import { normaliseSpokenWord, saysAnyOf } from './spokenWord'

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

describe('saysAnyOf', () => {
  it('matches a whole word, ignoring case and punctuation', () => {
    expect(saysAnyOf('Patience!', ['patience'])).toBe(true)
    expect(saysAnyOf('I say: "patience."', ['patience'])).toBe(true)
  })

  it('does not match a word that merely contains the answer', () => {
    expect(saysAnyOf('impatience', ['patience'])).toBe(false)
    expect(saysAnyOf('forgiveness', ['forgive'])).toBe(false)
  })

  it('matches any of the synonyms', () => {
    expect(saysAnyOf('stay calmly', ['calm', 'calmly'])).toBe(true)
  })

  it('matches a multi-word answer only as whole consecutive words', () => {
    expect(saysAnyOf('you SHOULD have told me', ['should have told'])).toBe(
      true,
    )
    expect(saysAnyOf('you should have not told me', ['should have told'])).toBe(
      false,
    )
  })
})
