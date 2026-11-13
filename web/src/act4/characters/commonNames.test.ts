import { describe, it, expect } from 'vitest'
import { EchoStone } from '../items/EchoStone'
import { Game, type Character } from '@/engine'
import { Act4 } from '../Act4'
import { CaptainOfTheGuard } from './CaptainOfTheGuard'
import { GhostlyWarriors } from './GhostlyWarriors'
import { Grandmother } from './Grandmother'
import { KingAlden } from './KingAlden'
import { KnightOfDespair } from './KnightOfDespair'
import { Malakar } from './Malakar'
import { MemoryEchoes } from './MemoryEchoes'
import { Mira } from './Mira'
import { Nyx } from './Nyx'
import { ShadowOfThePast } from './ShadowOfThePast'
import { SirCedric } from './SirCedric'
import { SirCedricInTheHall } from './SirCedricInTheHall'
import { MiraAtTheGate } from './MiraAtTheGate'
import { SirCedricAtTheGate } from './SirCedricAtTheGate'
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
const COMMON_NOUNS = [
  ['Captain of the Guard', false, (): Character => new CaptainOfTheGuard()],
  ['ghostly warriors', true, (): Character => new GhostlyWarriors()],
  ['Knight of Despair', false, (): Character => new KnightOfDespair()],
  ['memory echoes of Aren and Lysa', true, (): Character => new MemoryEchoes()],
  ['Shadow', false, (): Character => new ShadowOfThePast()],
  ['Sorceress of Lies', false, (): Character => new SorceressOfLies()],
  ['trapped servants', true, (): Character => new TrappedServants()],
  ['True Self', false, (): Character => new TrueSelf()],
  ['whispers', true, (): Character => new Whispers()],
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
  ['Grandmother', (): Character => new Grandmother()],
  ['King Alden', (): Character => new KingAlden()],
  ['Malakar', (): Character => new Malakar()],
  ['Mira', (): Character => new Mira()],
  ['Nyx', (): Character => new Nyx()],
  ['Sir Cedric', (): Character => new SirCedric()],
  ['Sir Cedric', (): Character => new SirCedricInTheHall()],
  ['Mira', (): Character => new MiraAtTheGate()],
  ['Sir Cedric', (): Character => new SirCedricAtTheGate()],
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

  it('opens with "The ghostly warriors" when offered something once they fill the hall', () => {
    const act = new Act4()
    act.musicFile = ''
    const game = new Game([act])
    game.state.currentRoom = game.state.allRooms.HallOfEchoes
    game.state.currentRoom.addCharacter(new GhostlyWarriors())
    game.state.inventory.push(new EchoStone())

    expect(game.commandParser.parse('give echo stone to warriors')).toContain(
      'The [character_name]ghostly warriors[/character_name] don',
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
