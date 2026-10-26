import { describe, it, expect } from 'vitest'
import { miraAnswerIn } from './MiraAnswers'

describe('miraAnswerIn', () => {
  it('recognises forgiveness by the word forgive, in any case', () => {
    expect(miraAnswerIn('i forgive you')).toBe('forgive')
    expect(miraAnswerIn('I FORGIVE you, Mira')).toBe('forgive')
  })

  it('recognises the reproach by should have told or should have said', () => {
    expect(miraAnswerIn('you should have told me')).toBe('reproach')
    expect(miraAnswerIn('You Should Have Said something')).toBe('reproach')
  })

  it('lets forgiveness win when both are present', () => {
    expect(miraAnswerIn('i forgive you but you should have told me')).toBe(
      'forgive',
    )
  })

  it('does not hear "forgive" inside another word', () => {
    expect(miraAnswerIn('forgiveness')).toBeNull()
    expect(miraAnswerIn('unforgiven')).toBeNull()
  })

  it('returns null for anything else', () => {
    expect(miraAnswerIn('parents')).toBeNull()
    expect(miraAnswerIn('hello')).toBeNull()
  })
})
