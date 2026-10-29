import { describe, it, expect } from 'vitest'
import { LifelightElixir } from './LifelightElixir'

describe('LifelightElixir', () => {
  it('says what it is and what Mira made it for', () => {
    expect(new LifelightElixir().description).toBe(
      'A small glass vial the colour of first light. Something moves in it: ' +
        'a white glint, a thread of flame, a dark shimmer like a scale turning. ' +
        'Mira made it from the three relics, to stop what Malakar is doing to ' +
        'the king.',
    )
  })
})
