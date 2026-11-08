import { describe, it, expect } from 'vitest'
import { MemoryOrbs } from '../items/MemoryOrbs'
import { Malakar } from '../characters/Malakar'
import {
  FLAG_ACT4_MEMORY_ORBS_MENDED,
  FLAG_ACT4_REDEMPTION_ENDING,
  FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED,
} from '../Act4StoryFlags'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { TruthSight } from './TruthSight'
import { Mirrors } from '../items/Mirrors'
import { KnightOfDespair } from '../characters/KnightOfDespair'
import { TrueSelf } from '../characters/TrueSelf'
import { SorceressOfLies } from '../characters/SorceressOfLies'
import { SorceressStaff } from '../items/SorceressStaff'
import { CrystalWhispers } from '../items/CrystalWhispers'
import { ChamberOfWhispers } from '../rooms/ChamberOfWhispers'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

describe('TruthSight', () => {
  it('has the agreed name and description and answers to its name', () => {
    const spell = new TruthSight()
    expect(spell.name).toBe('Truth Sight')
    expect(spell.description).toBe(
      'See through illusion to what is really there.',
    )
    expect(spell.answersTo('truth sight')).toBe(true)
    expect(spell.answersTo('truth_sight')).toBe(true)
  })

  it('finds nothing hidden in anything but the knight', () => {
    const game = new Game([new Act4()])
    const spell = new TruthSight()
    const answers = [
      spell.castSpell(game.state),
      spell.castOnItem(game.state, new Mirrors()),
      spell.castOnCharacter(game.state, new TrueSelf()),
    ]
    for (const answer of answers) {
      expect(answer).toBe(
        '[dim]Your sight sharpens, but there is no illusion here to see through.[/dim]',
      )
      expectMarkupWellFormed(answer)
    }
  })

  it('shows the knight as he is, and says so once', () => {
    const game = new Game([new Act4()])
    const spell = new TruthSight()
    const knight = new KnightOfDespair()
    expect(spell.castOnCharacter(game.state, knight)).toContain(
      'Behind the visor, the knight is weeping.',
    )
    expect(spell.castOnCharacter(game.state, knight)).toBe(
      '[dim]You have already seen the knight as he truly is.[/dim]',
    )
  })
})

describe('TruthSight optional targets', () => {
  const ORDINARY =
    '[dim]Your sight sharpens, but there is no illusion here to see through.[/dim]'

  it('shows the clouded orbs until they are mended, every time', () => {
    const game = new Game([new Act4()])
    const spell = new TruthSight()
    const orbs = new MemoryOrbs()
    const first = spell.castOnItem(game.state, orbs)
    expect(first).toContain('the cradle by the fire comes clear')
    expectMarkupWellFormed(first)
    expect(spell.castOnItem(game.state, orbs)).toBe(first)
    game.state.setStoryFlag(FLAG_ACT4_MEMORY_ORBS_MENDED, true)
    expect(spell.castOnItem(game.state, orbs)).toBe(ORDINARY)
  })

  it('shows Malakar for a breath without setting anything, until an ending is played', () => {
    const game = new Game([new Act4()])
    const spell = new TruthSight()
    const malakar = new Malakar()
    const flags = JSON.stringify(game.toSaveData())
    const line = spell.castOnCharacter(game.state, malakar)
    expect(line).toContain('mending a toy for a child who is not there')
    expectMarkupWellFormed(line)
    expect(spell.castOnCharacter(game.state, malakar)).toBe(line)
    expect(JSON.stringify(game.toSaveData())).toBe(flags)
    game.state.setStoryFlag(FLAG_ACT4_REDEMPTION_ENDING, true)
    expect(spell.castOnCharacter(game.state, malakar)).toBe(ORDINARY)
  })
})

describe('TruthSight in the Chamber of Whispers', () => {
  const ORDINARY =
    '[dim]Your sight sharpens, but there is no illusion here to see through.[/dim]'

  /** Every answer the spell gives in the chamber: the three targets and no target. */
  function chamberAnswers(game: Game): string[] {
    const spell = new TruthSight()
    game.state.currentRoom = new ChamberOfWhispers()
    return [
      spell.castOnCharacter(game.state, new SorceressOfLies()),
      spell.castOnItem(game.state, new SorceressStaff()),
      spell.castOnItem(game.state, new CrystalWhispers()),
      spell.castSpell(game.state),
    ]
  }

  it('answers in-world on the Sorceress, her staff, the whispers and the room', () => {
    const answers = chamberAnswers(new Game([new Act4()]))
    for (const answer of answers) {
      expect(answer).not.toBe(ORDINARY)
      expect(answer).not.toContain('[dim]')
      expect(answer).toContain('Your sight sharpens')
      expectMarkupWellFormed(answer)
    }
    expect(new Set(answers).size).toBe(answers.length)
  })

  it('points away from the eyes: the lie is in what she says', () => {
    const [sorceress] = chamberAnswers(new Game([new Act4()]))
    expect(sorceress).toContain('They are in what she says')
  })

  it('sets nothing, so it changes nothing about the solution', () => {
    const game = new Game([new Act4()])
    const flags = JSON.stringify(game.state.storyFlags)
    chamberAnswers(game)
    expect(JSON.stringify(game.state.storyFlags)).toBe(flags)
  })

  it('finds nothing left to see through once she is redeemed', () => {
    const game = new Game([new Act4()])
    game.state.setStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED, true)
    for (const answer of chamberAnswers(game)) {
      expect(answer).toBe(ORDINARY)
    }
  })

  it('still finds no illusion in a room without one', () => {
    const game = new Game([new Act4()])
    expect(new TruthSight().castSpell(game.state)).toBe(ORDINARY)
  })
})
