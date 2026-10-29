import { describe, it, expect } from 'vitest'
import { FortressEntrance } from './FortressEntrance'

describe("the Entrance to Malakar's Fortress", () => {
  it('shows the Warden sigil through the black stone at the arch', () => {
    expect(new FortressEntrance().description).toContain(
      'Where the gate arch meets the wall an older carving shows through the ' +
        'black: a sun rising over three linked rings.',
    )
  })

  it('reads plainly', () => {
    expect(new FortressEntrance().description).toBe(
      'A bastion of black stone rises from a shattered ridge. Iron lattices ' +
        'close its gates, and sigils glow behind them, slow as breathing. The ' +
        'wind up here is cold and smells of metal. Where the gate arch meets ' +
        'the wall an older carving shows through the black: a sun rising over ' +
        'three linked rings.',
    )
  })
})
