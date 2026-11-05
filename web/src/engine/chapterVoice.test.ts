import { describe, expect, it } from 'vitest'
import { Act1 } from '../act1/Act1'
import { Act2 } from '../act2/Act2'
import { Act3 } from '../act3/Act3'
import { Act4 } from '../act4/Act4'

/** Phrases that belong to a program, not to the story. */
const SYSTEM_VOICE = [
  /Type 'help'/,
  /Congratulations/,
  /coffee/,
  /Let's (begin|get started)/,
]

/** Pins that no act's intro and no completion page speaks in system voice. */
describe('chapter pages', () => {
  it.each([
    ['Act I', new Act1()],
    ['Act II', new Act2()],
    ['Act III', new Act3()],
    ['Act IV', new Act4()],
  ])('%s opens without system voice', (_name, act) => {
    for (const pattern of SYSTEM_VOICE)
      expect(act.getActIntro()).not.toMatch(pattern)
  })
})
