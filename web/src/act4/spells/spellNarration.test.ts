import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { parseTurn, type TurnBlock } from '@/lantern/parseTurn'
import { Act4 } from '../Act4'
import {
  FLAG_ACT4_HOME_REACHED,
  FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED,
} from '../Act4StoryFlags'
import { CaptainOfTheGuard } from '../characters/CaptainOfTheGuard'
import { GhostlyWarriors } from '../characters/GhostlyWarriors'
import { Malakar } from '../characters/Malakar'
import { ShadowOfThePast } from '../characters/ShadowOfThePast'
import { SorceressOfLies } from '../characters/SorceressOfLies'
import { TrappedServants } from '../characters/TrappedServants'
import { Banners } from '../items/Banners'
import { CrystalWhispers } from '../items/CrystalWhispers'
import { SorceressStaff } from '../items/SorceressStaff'
import { Bless } from './Bless'
import { Forgiveness } from './Forgiveness'
import { Grow } from './Grow'
import { HeartsTruth } from './HeartsTruth'
import { Light } from './Light'
import { RedemptionsLight } from './RedemptionsLight'
import { TruthSight } from './TruthSight'

/** An Act IV game in its first room. */
function newGame(): Game {
  const act = new Act4()
  act.musicFile = ''
  return new Game([act])
}

/** The block kinds of an answer, in order, with a star on a read red box. */
function shape(text: string): string[] {
  return parseTurn(text).map((b: TurnBlock) =>
    b.kind === 'failure' && b.narrated ? 'failure*' : b.kind,
  )
}

describe('Act IV spells narrate their effect', () => {
  it('grow away from home answers with the plants alone', () => {
    const game = newGame()
    const out = new Grow().castSpell(game.state)
    expect(out).toBe(
      'The nearby plants seem to respond with vibrant energy, ' +
        'but nothing else happens.',
    )
    expect(shape(out)).toEqual(['text'])
  })

  it('grow at home starts on the earth, with no echo', () => {
    const game = newGame()
    game.state.setStoryFlag(FLAG_ACT4_HOME_REACHED, true)
    const out = new Grow().castSpell(game.state)
    expect(out).not.toContain('You cast')
    expect(out).toMatch(/^You press your hands into the dry earth/)
    expect(shape(out)[0]).toBe('text')
    expect(shape(out)).not.toContain('event')
  })

  it('grow on a person at home is a read red box', () => {
    const game = newGame()
    game.state.setStoryFlag(FLAG_ACT4_HOME_REACHED, true)
    const out = new Grow().castOnCharacter(game.state, new Malakar())
    expect(parseTurn(out)).toEqual([
      {
        kind: 'failure',
        narrated: true,
        markup: 'Grow is for the field, not for people.',
      },
    ])
  })

  it('light on an ordinary thing is one read sentence', () => {
    const game = newGame()
    const out = new Light().castOnItem(game.state, new Banners())
    expect(out).toBe('The light shows it clearly, but has no special effect.')
  })

  it('bless where nothing answers is one read sentence', () => {
    const game = newGame()
    expect(new Bless().castSpell(game.state)).toBe(
      'Warm, golden light fills the area, but there is nothing here that ' +
        'responds to the blessing.',
    )
  })

  it('bless on the servants from the wrong place is a read red box', () => {
    const game = newGame()
    const out = new Bless().castOnCharacter(game.state, new TrappedServants())
    expect(parseTurn(out)).toEqual([
      {
        kind: 'failure',
        narrated: true,
        markup: 'The magic seems unable to reach the servants fully here.',
      },
    ])
  })

  it('bless on anyone else is one read sentence naming them', () => {
    const game = newGame()
    const out = new Bless().castOnCharacter(game.state, new CaptainOfTheGuard())
    expect(out).toBe(
      '[character_name]Captain of the Guard[/character_name] glows ' +
        'briefly with golden light.',
    )
    expect(shape(out)).toEqual(['text'])
  })

  it('forgiveness on Malakar is a read red box', () => {
    const game = newGame()
    expect(
      shape(new Forgiveness().castOnCharacter(game.state, new Malakar())),
    ).toEqual(['failure*'])
  })

  it('truth sight results are read, not grey', () => {
    const game = newGame()
    const spell = new TruthSight()
    expect(shape(spell.castOnItem(game.state, new Banners()))).toEqual(['text'])
    expect(shape(spell.castOnCharacter(game.state, new Malakar()))).toEqual([
      'text',
    ])
  })

  it("heart's truth results are read, not grey", () => {
    const game = newGame()
    const spell = new HeartsTruth()
    expect(shape(spell.castOnItem(game.state, new SorceressStaff()))).toEqual([
      'text',
    ])
    expect(shape(spell.castOnItem(game.state, new CrystalWhispers()))).toEqual([
      'text',
    ])
    expect(shape(spell.castOnCharacter(game.state, new Malakar()))).toEqual([
      'text',
    ])
  })

  it("redemption's light on the Shadow and the Sorceress is read", () => {
    const game = newGame()
    const spell = new RedemptionsLight()
    expect(
      shape(spell.castOnCharacter(game.state, new ShadowOfThePast())),
    ).toEqual(['text'])
    game.state.setStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED, true)
    const out = spell.castOnCharacter(game.state, new SorceressOfLies())
    expect(shape(out)).toEqual(['text'])
  })

  it("redemption's light on the warriors is read, and the silent marker closes it", () => {
    const game = newGame()
    game.state.currentRoom = game.state.allRooms.HallOfEchoes
    const warriors = new GhostlyWarriors()
    game.state.currentRoom.addCharacter(warriors)
    const out = new RedemptionsLight().castOnCharacter(game.state, warriors)
    expect(shape(out)).toEqual(['text', 'text', 'dialogue', 'event'])
    expect(out).toContain('Soft light spills from your hands')
  })
})
