import { describe, it, expect } from 'vitest'
import { FortressEntrance } from './FortressEntrance'

describe("the Entrance to Malakar's Fortress", () => {
  it('shows the Warden sigil through the black stone at the arch', () => {
    expect(new FortressEntrance().description).toContain(
      'Where the gate arch meets the wall an older carving shows through the ' +
        'black: a sun rising over three linked rings.',
    )
  })
})
