import { describe, it, expect } from 'vitest'
import type { Character } from '@/engine'
import { CaptainOfTheGuard } from './CaptainOfTheGuard'
import { GhostlyWarriors } from './GhostlyWarriors'
import { Grandmother } from './Grandmother'
import { KingAlden } from './KingAlden'
import { KnightOfDespair } from './KnightOfDespair'
import { Malakar } from './Malakar'
import { Mira } from './Mira'
import { Nyx } from './Nyx'
import { ShadowOfThePast } from './ShadowOfThePast'
import { SirCedric } from './SirCedric'
import { SirCedricInTheHall } from './SirCedricInTheHall'
import { SorceressOfLies } from './SorceressOfLies'
import { TrappedServants } from './TrappedServants'
import { TrueSelf } from './TrueSelf'
import { Whispers } from './Whispers'

/**
 * The Act IV characters named by what they are, not who: the engine's own
 * replies call them "the herald" mid-sentence and "The herald" at the start
 * of one, never "Herald" as if it were a proper name, and a group of them
 * takes plural verbs.
 */
describe.each([
  ['Captain of the Guard', false, (): Character => new CaptainOfTheGuard()],
  ['Ghostly Warriors', true, (): Character => new GhostlyWarriors()],
  ['Knight of Despair', false, (): Character => new KnightOfDespair()],
  ['Shadow', false, (): Character => new ShadowOfThePast()],
  ['Sorceress of Lies', false, (): Character => new SorceressOfLies()],
  ['Trapped Servants', true, (): Character => new TrappedServants()],
  ['True Self', false, (): Character => new TrueSelf()],
  ['Whispers', true, (): Character => new Whispers()],
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
  ['Grandmother', (): Character => new Grandmother()],
  ['King Alden', (): Character => new KingAlden()],
  ['Malakar', (): Character => new Malakar()],
  ['Mira', (): Character => new Mira()],
  ['Nyx', (): Character => new Nyx()],
  ['Sir Cedric', (): Character => new SirCedric()],
  ['Sir Cedric', (): Character => new SirCedricInTheHall()],
] as const)('%s, a proper name', (name, make) => {
  it('reads without an article', () => {
    expect(make().nameInSentence()).toBe(
      `[character_name]${name}[/character_name]`,
    )
  })
})
