import { describe, it, expect } from 'vitest'
import type { Character } from '@/engine'
import { AncientDragon } from './AncientDragon'
import { AshScholar } from './AshScholar'
import { MineOverseer } from './MineOverseer'
import { Miners } from './Miners'
import { Mira } from './Mira'
import { Phoenix } from './Phoenix'
import { PhoenixGuardian } from './PhoenixGuardian'
import { PierWarden } from './PierWarden'
import { SilenceKeeper } from './SilenceKeeper'
import { SirCedric } from './SirCedric'
import { TideBornGuardian } from './TideBornGuardian'
import { Tobin } from './Tobin'
import { WanderingPhantoms } from './WanderingPhantoms'

/**
 * The Act III characters named by what they are, not who: the engine's own
 * replies call them "the herald" mid-sentence and "The herald" at the start
 * of one, never "Herald" as if it were a proper name, and a group of them
 * takes plural verbs.
 */
const COMMON_NOUNS = [
  ['ancient dragon', false, (): Character => new AncientDragon()],
  ['Ash Scholar', false, (): Character => new AshScholar()],
  ['Mine Overseer', false, (): Character => new MineOverseer()],
  ['miners', true, (): Character => new Miners()],
  ['Phoenix', false, (): Character => new Phoenix()],
  ['phoenix guardian', false, (): Character => new PhoenixGuardian()],
  ['Pier Warden', false, (): Character => new PierWarden()],
  ['silence keeper', false, (): Character => new SilenceKeeper()],
  ['Tide-Born Guardian', false, (): Character => new TideBornGuardian()],
  ['wandering phantoms', true, (): Character => new WanderingPhantoms()],
] as const

describe('the common-noun characters', () => {
  it('read "the" mid-sentence, "The" at the start, with the right verbs', () => {
    const failures: string[] = []
    for (const [name, plural, make] of COMMON_NOUNS) {
      const marked = `[character_name]${name}[/character_name]`
      if (make().nameInSentence() !== `the ${marked}`) {
        failures.push(`${name}: mid-sentence reads ${make().nameInSentence()}`)
      }
      const atStart = make().nameInSentence({ atStart: true })
      if (atStart !== `The ${marked}`) {
        failures.push(`${name}: at the start reads ${atStart}`)
      }
      if (make().isPlural() !== plural) {
        failures.push(
          `${name}: isPlural is ${make().isPlural()}, should be ${plural}`,
        )
      }
    }
    expect(failures).toEqual([])
  })
})

/** The characters with a name of their own keep it capitalised, alone. */
const PROPER_NAMES = [
  ['Mira', (): Character => new Mira()],
  ['Sir Cedric', (): Character => new SirCedric()],
  ['Tobin', (): Character => new Tobin()],
] as const

describe('the characters with a name of their own', () => {
  it('read without an article', () => {
    const failures: string[] = []
    for (const [name, make] of PROPER_NAMES) {
      const expected = `[character_name]${name}[/character_name]`
      if (make().nameInSentence() !== expected) {
        failures.push(`${name}: reads ${make().nameInSentence()}`)
      }
    }
    expect(failures).toEqual([])
  })
})
