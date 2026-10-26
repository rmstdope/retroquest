import { describe, it, expect } from 'vitest'
import { Game, type Character } from '@/engine'
import { Act4 } from '../Act4'
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
  ['ghostly warriors', true, (): Character => new GhostlyWarriors()],
  ['Knight of Despair', false, (): Character => new KnightOfDespair()],
  ['Shadow', false, (): Character => new ShadowOfThePast()],
  ['Sorceress of Lies', false, (): Character => new SorceressOfLies()],
  ['trapped servants', true, (): Character => new TrappedServants()],
  ['True Self', false, (): Character => new TrueSelf()],
  ['whispers', true, (): Character => new Whispers()],
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

/**
 * A group keeps the lower case of a common noun wherever it stands, so the
 * engine's own replies never write it like a proper name.
 */
describe('a group character in a default reply', () => {
  it('reads "The trapped servants have nothing to sell you."', () => {
    const act = new Act4()
    act.musicFile = ''
    const game = new Game([act])
    game.state.currentRoom = game.state.allRooms.OuterCourtyard

    expect(game.commandParser.parse('buy bread from servants')).toContain(
      'The [character_name]trapped servants[/character_name] have nothing ' +
        'to sell you.',
    )
  })

  it('reads "the freed servants" once they are freed', () => {
    const servants = new TrappedServants()
    servants.free()

    expect(servants.nameInSentence()).toBe(
      'the [character_name]freed servants[/character_name]',
    )
  })
})
