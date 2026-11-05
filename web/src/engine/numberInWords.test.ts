import { describe, expect, it } from 'vitest'
import { numberInWords } from './numberInWords'

describe('numberInWords', () => {
  it.each([
    [0, 'zero'],
    [1, 'one'],
    [5, 'five'],
    [10, 'ten'],
    [13, 'thirteen'],
    [20, 'twenty'],
    [21, 'twenty-one'],
    [40, 'forty'],
    [50, 'fifty'],
    [99, 'ninety-nine'],
    [100, '100'],
  ])('writes %i as %s', (n, words) => {
    expect(numberInWords(n)).toBe(words)
  })
})
