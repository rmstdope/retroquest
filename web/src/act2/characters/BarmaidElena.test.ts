/** The Sorceress of Lies' mark on Elena's curse (rq-roe.4). */
import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { expectDialogueSpeaker } from '@/testing/gameHelpers'
import { Act2 } from '../Act2'
import { BarmaidElena } from './BarmaidElena'
import { CrystalClearWater } from '../items/CrystalClearWater'
import { Coins } from '../items/Coins'
import { MountainFlower } from '../items/MountainFlower'
import {
  FLAG_ELENA_HEALED,
  FLAG_MARCUS_TOLD_TRUTH,
  FLAG_INNKEEPERS_DAUGHTER_COMPLETED,
} from '../Act2StoryFlags'

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
const HEALED_STAGE =
  '[character_name]Elena[/character_name] turns her hand over and looks at it as if it belonged to someone else.'
const DIDNT_TAKE =
  "It didn't take. I felt it go in, warm as a hearth, and then the cold closed over it again."
const LYRIA_HINT =
  'Master Lyria sat with me once, when it began. If anyone knows what comes next, she does.'
const WASHED_STAGE =
  '[character_name]Elena[/character_name] rubs at the inside of her wrist.'
const WASHED_SPEECH =
  'The water stung, and then it was gone, and some of the cold went with it. But it is still holding on. I can feel it, here.'
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
    const { game, elena } = setup()
    const out = elena.receiveGreaterHeal(game.state)
    expect(out.endsWith('[/success]\n\n' + HEAL_PARAGRAPH)).toBe(true)
    expect(elena.description.endsWith(HEAL_SENTENCE)).toBe(true)
  })

  it('heal again: no second mark paragraph', () => {
    const { game, elena } = setup()
    elena.receiveGreaterHeal(game.state)
    expect(elena.receiveGreaterHeal(game.state)).toBe(
      '[failure]Elena is already strengthened by your healing magic.[/failure]',
    )
  })

  it('water: description swaps in the water sentence', () => {
    const { game, elena } = setup()
    elena.receiveGreaterHeal(game.state)
    purify(game, elena)
    expect(elena.description.endsWith(WATER_SENTENCE)).toBe(true)
    expect(elena.description).not.toContain(HEAL_SENTENCE)
  })

  it('first talk after the heal: stage line, speech, then today reply; once', () => {
    const { game, elena } = setup()
    elena.receiveGreaterHeal(game.state)
    const first = elena.talkTo(game.state)
    expect(first.startsWith(STAGE_LINE + '\n\n')).toBe(true)
    expect(first).toContain(ELENA_SPEECH)
    expect(first).toContain(HEALED_STAGE)
    expect(first).toContain(DIDNT_TAKE)
    expect(first).toContain(LYRIA_HINT)
    const second = elena.talkTo(game.state)
    expect(second).not.toContain('mask')
    expect(second).not.toContain(STAGE_LINE)
    expect(second.startsWith('[character_name]Elena')).toBe(true)
  })

  it('first talk after purification without an earlier talk gives the lines', () => {
    const { game, elena } = setup()
    elena.receiveGreaterHeal(game.state)
    purify(game, elena)
    const first = elena.talkTo(game.state)
    expect(first).toContain(STAGE_LINE)
    expect(first).toContain(WASHED_STAGE)
    expect(first).toContain(WASHED_SPEECH)
    expect(elena.talkTo(game.state)).not.toContain(STAGE_LINE)
  })

  it('does not repeat after the lines were heard before the water', () => {
    const { game, elena } = setup()
    elena.receiveGreaterHeal(game.state)
    elena.talkTo(game.state)
    purify(game, elena)
    expect(elena.talkTo(game.state)).not.toContain(STAGE_LINE)
  })

  it('remembers across save and load that the lines were spoken', () => {
    const { game, elena } = setup()
    elena.receiveGreaterHeal(game.state)
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
    elena.receiveGreaterHeal(game.state)
    const fresh = new Game([new Act2()])
    fresh.loadSaveData(game.toSaveData())
    const loaded = fresh.state.allRooms.SilverStagInn.characters.find(
      (c): c is BarmaidElena => c instanceof BarmaidElena,
    )!
    expect(loaded.talkTo(fresh.state)).toContain(STAGE_LINE)
  })

  it('dispel: sentence follows the success text, and no trace remains', () => {
    const { game, elena } = setup()
    elena.receiveGreaterHeal(game.state)
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

  it('an older mid-cure save, without the mark fields, shows no mark but the dispel sentence', () => {
    const { game, elena } = setup()
    elena.elenaInitialHealing = true
    const fresh = new Game([new Act2()])
    fresh.loadSaveData(game.toSaveData())
    const loaded = fresh.state.allRooms.SilverStagInn.characters.find(
      (c): c is BarmaidElena => c instanceof BarmaidElena,
    )!
    // Older saves lack these fields entirely, so they read as undefined.
    Reflect.deleteProperty(loaded, 'markShown')
    Reflect.deleteProperty(loaded, 'markSpoken')
    expect(loaded.talkTo(fresh.state)).not.toContain(STAGE_LINE)
    purify(fresh, loaded)
    expect(loaded.description).not.toContain('mask')
    expect(loaded.receiveDispelFinalCure(fresh.state)).toContain(
      DISPEL_SENTENCE,
    )
  })
})

describe('Elena names no next step (rq-nun)', () => {
  it('heal: sets the healed flag and the narration names no next step', () => {
    const { game, elena } = setup()
    const out = elena.receiveGreaterHeal(game.state)
    expect(game.state.getStoryFlag(FLAG_ELENA_HEALED)).toBe(true)
    expect(out).toContain(
      'The healing has made her stronger, but the curse still clings to her.',
    )
    expect(out).not.toMatch(/purif|dispel/i)
  })

  it('every talk until the water says it did not take and points at Lyria', () => {
    const { game, elena } = setup()
    elena.receiveGreaterHeal(game.state)
    elena.talkTo(game.state)
    const again = elena.talkTo(game.state)
    expect(again).toContain(HEALED_STAGE)
    expect(again).toContain(DIDNT_TAKE)
    expect(again).toContain(LYRIA_HINT)
    expect(again).not.toMatch(/purif|dispel|blessed|water/i)
  })

  it('water: narration loses the dispelling sentence; talks name no next step', () => {
    const { game, elena } = setup()
    elena.receiveGreaterHeal(game.state)
    game.state.inventory.push(new CrystalClearWater())
    const out = elena.receiveCrystalWaterPurification(game.state)
    expect(out).not.toContain('dispelling')
    expect(out).toContain('greatly weakened by the purification.[/success]')
    const talk = elena.talkTo(game.state)
    expect(talk).not.toMatch(/dispel|spell|Lyria/i)
  })

  it('out-of-order refusals stay word for word', () => {
    const { game, elena } = setup()
    expect(elena.receiveCrystalWaterPurification(game.state)).toBe(
      'Elena is too weak from the curse; the water would run off her like rain off stone. She wants mending first.',
    )
    expect(elena.receiveDispelFinalCure(game.state)).toContain(
      'The counter-magic finds nothing to take hold of',
    )
  })
})

describe('Elena remarks on her father after the truth (rq-coj)', () => {
  const TRUTH_STAGE =
    '[character_name]Elena[/character_name] glances toward the taproom.'
  const TRUTH_SPEECH =
    'Father has bolted every shutter in the house, and he sleeps down in the ' +
    "taproom now with the poker across his knees. I'm glad you told him. " +
    "He'd have gone on blaming the wind."
  const USUAL = 'Oh, thank you so much!'

  function cured(): { game: Game; elena: BarmaidElena } {
    const { game, elena } = setup()
    elena.receiveGreaterHeal(game.state)
    purify(game, elena)
    elena.receiveDispelFinalCure(game.state)
    return { game, elena }
  }

  function reload(game: Game): { fresh: Game; loaded: BarmaidElena } {
    const fresh = new Game([new Act2()])
    fresh.loadSaveData(game.toSaveData())
    const loaded = fresh.state.allRooms.SilverStagInn.characters.find(
      (c): c is BarmaidElena => c instanceof BarmaidElena,
    )!
    return { fresh, loaded }
  }

  it('first talk after the truth: stage line, speech, blank line, usual reply', () => {
    const { game, elena } = cured()
    game.state.setStoryFlag(FLAG_MARCUS_TOLD_TRUTH, true)
    const first = elena.talkTo(game.state)
    expect(
      first.startsWith(
        TRUTH_STAGE +
          '\n\n[character_name]barmaid elena[/character_name]: ' +
          '[dialogue]' +
          TRUTH_SPEECH +
          '[/dialogue]\n\n',
      ),
    ).toBe(true)
    expect(first).toContain(USUAL)
  })

  it('never repeats after the first talk', () => {
    const { game, elena } = cured()
    game.state.setStoryFlag(FLAG_MARCUS_TOLD_TRUTH, true)
    elena.talkTo(game.state)
    const second = elena.talkTo(game.state)
    expect(second).not.toContain('taproom')
    expect(second).toContain(USUAL)
  })

  it('says nothing new when cured but the truth is not told', () => {
    const { game, elena } = cured()
    expect(elena.talkTo(game.state)).not.toContain('taproom')
    expect(elena.talkTo(game.state)).not.toContain('taproom')
  })

  it('waits for the next talk, then plays once after a later truth', () => {
    const { game, elena } = cured()
    elena.talkTo(game.state)
    game.state.setStoryFlag(FLAG_MARCUS_TOLD_TRUTH, true)
    expect(elena.talkTo(game.state)).toContain(TRUTH_STAGE)
    expect(elena.talkTo(game.state)).not.toContain(TRUTH_STAGE)
  })

  it('does not play while she is still cursed', () => {
    const { game, elena } = setup()
    game.state.setStoryFlag(FLAG_MARCUS_TOLD_TRUTH, true)
    expect(elena.talkTo(game.state)).not.toContain('taproom')
  })

  it('save before the talk plays it once after loading', () => {
    const { game } = cured()
    game.state.setStoryFlag(FLAG_MARCUS_TOLD_TRUTH, true)
    const { fresh, loaded } = reload(game)
    expect(loaded.talkTo(fresh.state)).toContain(TRUTH_STAGE)
    expect(loaded.talkTo(fresh.state)).not.toContain(TRUTH_STAGE)
  })

  it('an older save without the field plays the remark once', () => {
    const { game } = cured()
    game.state.setStoryFlag(FLAG_MARCUS_TOLD_TRUTH, true)
    const { fresh, loaded } = reload(game)
    Reflect.deleteProperty(loaded, 'truthRemarkSpoken')
    expect(loaded.talkTo(fresh.state)).toContain(TRUTH_STAGE)
    expect(loaded.talkTo(fresh.state)).not.toContain(TRUTH_STAGE)
  })

  it('save after the remark does not replay it', () => {
    const { game, elena } = cured()
    game.state.setStoryFlag(FLAG_MARCUS_TOLD_TRUTH, true)
    elena.talkTo(game.state)
    const { fresh, loaded } = reload(game)
    expect(loaded.talkTo(fresh.state)).not.toContain(TRUTH_STAGE)
  })
})

describe('Elena answers to her own name (rq-aum)', () => {
  /** An Act II game standing in the Silver Stag Inn. */
  function atInn(): Game {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.SilverStagInn
    return game
  }

  it('is examined as elena', () => {
    const game = atInn()
    const answer = game.commandParser.parse('examine elena')
    expect(answer).not.toContain("You don't see")
    expect(answer).toContain('A young woman who moves slowly')
  })

  it('is talked to as elena', () => {
    const game = atInn()
    const answer = game.commandParser.parse('talk to elena')
    expect(answer).not.toContain('There is no character named')
    expectDialogueSpeaker(answer, 'barmaid elena')
  })

  it('is given things as elena', () => {
    const game = atInn()
    game.state.inventory.push(new Coins())
    const answer = game.commandParser.parse('give coins to elena')
    expect(answer).not.toContain('There is no character named')
    expect(answer).toContain('[character_name]Barmaid Elena[/character_name]')
  })

  it('still answers to barmaid elena', () => {
    const game = atInn()
    expect(game.commandParser.parse('examine barmaid elena')).toContain(
      'A young woman who moves slowly',
    )
  })

  it('opens a refused gift with her capitalised name (rq-4if)', () => {
    const { game, elena } = setup()
    expect(elena.giveItem(game.state, new MountainFlower())).toBe(
      "[character_name]Barmaid Elena[/character_name] doesn't seem " +
        'interested in the [item_name]mountain flower[/item_name].',
    )
  })
})
