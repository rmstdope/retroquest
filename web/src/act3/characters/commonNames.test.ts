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
describe.each([
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
] as const)('the %s, a common-noun character', (name, plural, make) => {
  const marked = `[character_name]${name}[/character_name]`

  it('reads "the" mid-sentence and "The" at the start', () => {
    expect(make().nameInSentence()).toBe(`the ${marked}`)
    expect(make().nameInSentence({ atStart: true })).toBe(`The ${marked}`)
  })

  it(plural ? 'takes plural verbs' : 'takes singular verbs', () => {
    expect(make().isPlural()).toBe(plural)
  })
})

/** The characters with a name of their own keep it capitalised, alone. */
describe.each([
  ['Mira', (): Character => new Mira()],
  ['Sir Cedric', (): Character => new SirCedric()],
  ['Tobin', (): Character => new Tobin()],
] as const)('%s, a proper name', (name, make) => {
  it('reads without an article', () => {
    expect(make().nameInSentence()).toBe(
      `[character_name]${name}[/character_name]`,
    )
  })
})
