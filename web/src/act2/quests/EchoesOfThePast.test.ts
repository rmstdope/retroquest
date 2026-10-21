import { describe, it, expect } from 'vitest'
import { EchoesOfThePastQuest } from './EchoesOfThePast'

describe('Echoes of the Past', () => {
  it('names what the archive found in its completion line', () => {
    expect(new EchoesOfThePastQuest().completion).toBe(
      'The archive names the Wardens of the Dawn, and a stranger asking ' +
        "after the Willowbrook bloodline on Malakar's business.",
    )
  })
})
