/** The Sorceress of Lies' mark on Elena's curse (rq-roe.4). */
import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { BarmaidElena } from './BarmaidElena'
import { CrystalClearWater } from '../items/CrystalClearWater'
import { FLAG_INNKEEPERS_DAUGHTER_COMPLETED } from '../Act2StoryFlags'

const HEAL_PARAGRAPH =
  "As the golden light fades, something surfaces on the inside of Elena's " +
  'wrist: a small silver mark in the shape of a mask, smooth and smiling, ' +
  'with no eyes behind it. The curse is wearing a face. You have never seen ' +
  'its like, and you cannot say whose it is.'
const HEAL_SENTENCE =
  ' On the inside of her wrist, a small silver mask shows through her skin.'
const WATER_SENTENCE =
  ' The silver mask on her wrist is untouched by the water.'
const STAGE_LINE =
  '[character_name]Elena[/character_name] sees you looking at her wrist and ' +
  'tugs her sleeve down over the silver mark.'
const ELENA_SPEECH =
  'It came the same night as the curse. Since then I dream of a smiling ' +
  'face with no eyes, and it never says a true word.'
const DISPEL_SENTENCE =
  'On her wrist the silver mask goes on smiling a moment longer, then fades ' +
  'like breath on a cold window, and is gone.'

function setup(): { game: Game; elena: BarmaidElena } {
  const game = new Game([new Act2()])
  const elena = game.state.allRooms.SilverStagInn.characters.find(
    (c): c is BarmaidElena => c instanceof BarmaidElena,
  )
  if (!elena) throw new Error('Elena missing')
  return { game, elena }
}

function purify(game: Game, elena: BarmaidElena): void {
  game.state.inventory.push(new CrystalClearWater())
  elena.receiveCrystalWaterPurification(game.state)
}

describe('Elena and the silver mask', () => {
  it('has no mark before the heal', () => {
    const { game, elena } = setup()
    expect(elena.description).not.toContain('mask')
    expect(elena.talkTo(game.state)).not.toContain('mask')
  })

  it('heal: mark paragraph follows the success text as plain story text', () => {
    const { elena } = setup()
    const out = elena.receiveGreaterHeal()
    expect(out.endsWith('[/success]\n\n' + HEAL_PARAGRAPH)).toBe(true)
    expect(out.indexOf(HEAL_PARAGRAPH)).toBeGreaterThan(
      out.indexOf('[/success]'),
    )
    expect(elena.description.endsWith(HEAL_SENTENCE)).toBe(true)
  })

  it('heal again: no second mark paragraph', () => {
    const { elena } = setup()
    elena.receiveGreaterHeal()
    expect(elena.receiveGreaterHeal()).toBe(
      'Elena is already strengthened by your healing magic.',
    )
  })

  it('water: description swaps in the water sentence', () => {
    const { game, elena } = setup()
    elena.receiveGreaterHeal()
    purify(game, elena)
    expect(elena.description.endsWith(WATER_SENTENCE)).toBe(true)
    expect(elena.description).not.toContain(HEAL_SENTENCE)
  })

  it('first talk after the heal: stage line, speech, then today reply; once', () => {
    const { game, elena } = setup()
    elena.receiveGreaterHeal()
    const first = elena.talkTo(game.state)
    expect(first.startsWith(STAGE_LINE + '\n\n')).toBe(true)
    expect(first).toContain(ELENA_SPEECH)
    expect(first).toContain('looks much better, but still weak.')
    const second = elena.talkTo(game.state)
    expect(second).not.toContain('mask')
    expect(second).not.toContain(STAGE_LINE)
    expect(second.startsWith('[character_name]Elena')).toBe(true)
  })

  it('first talk after purification without an earlier talk gives the lines', () => {
    const { game, elena } = setup()
    elena.receiveGreaterHeal()
    purify(game, elena)
    const first = elena.talkTo(game.state)
    expect(first).toContain(STAGE_LINE)
    expect(first).toContain('glows with pure energy.')
    expect(elena.talkTo(game.state)).not.toContain(STAGE_LINE)
  })

  it('does not repeat after the lines were heard before the water', () => {
    const { game, elena } = setup()
    elena.receiveGreaterHeal()
    elena.talkTo(game.state)
    purify(game, elena)
    expect(elena.talkTo(game.state)).not.toContain(STAGE_LINE)
  })

  it('remembers across save and load that the lines were spoken', () => {
    const { game, elena } = setup()
    elena.receiveGreaterHeal()
    elena.talkTo(game.state)
    const fresh = new Game([new Act2()])
    fresh.loadSaveData(game.toSaveData())
    const loaded = fresh.state.allRooms.SilverStagInn.characters.find(
      (c): c is BarmaidElena => c instanceof BarmaidElena,
    )!
    expect(loaded.description.endsWith(HEAL_SENTENCE)).toBe(true)
    expect(loaded.talkTo(fresh.state)).not.toContain(STAGE_LINE)
  })

  it('remembers across save and load that the lines are still unspoken', () => {
    const { game, elena } = setup()
    elena.receiveGreaterHeal()
    const fresh = new Game([new Act2()])
    fresh.loadSaveData(game.toSaveData())
    const loaded = fresh.state.allRooms.SilverStagInn.characters.find(
      (c): c is BarmaidElena => c instanceof BarmaidElena,
    )!
    expect(loaded.talkTo(fresh.state)).toContain(STAGE_LINE)
  })

  it('dispel: sentence follows the success text, and no trace remains', () => {
    const { game, elena } = setup()
    elena.receiveGreaterHeal()
    purify(game, elena)
    const out = elena.receiveDispelFinalCure(game.state)
    expect(out.endsWith('[/success]\n\n' + DISPEL_SENTENCE)).toBe(true)
    expect(elena.description).not.toContain('mask')
    const talk = elena.talkTo(game.state)
    expect(talk).not.toContain('mask')
    expect(talk).not.toContain(STAGE_LINE)
    expect(game.state.getStoryFlag(FLAG_INNKEEPERS_DAUGHTER_COMPLETED)).toBe(
      true,
    )
  })

  it('an older mid-cure save shows no mark, yet the dispel sentence appears', () => {
    const { game, elena } = setup()
    // As an older save would have it: healed and purified, no mark fields.
    elena.elenaInitialHealing = true
    elena.elenaPurified = true
    expect(elena.talkTo(game.state)).not.toContain(STAGE_LINE)
    expect(elena.receiveDispelFinalCure(game.state)).toContain(DISPEL_SENTENCE)
  })
})
