import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { AncientTreeSpirit } from './AncientTreeSpirit'
import { CrystalClearWater } from '../items/CrystalClearWater'
import { EnchantedAcorn } from '../items/EnchantedAcorn'
import { Moonflowers } from '../items/Moonflowers'
import { SilverLeaves } from '../items/SilverLeaves'
import { FLAG_WHISPERS_IN_WIND_COMPLETED } from '../Act2StoryFlags'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

const POINTER =
  "Now you can hear them, you'll hear the grove is uneasy. The nymphs in " +
  'the glade east of the entrance have something for these roots. Answer ' +
  'them, and bring back what they give you.'
const HALF_HARVEST =
  'Half a harvest. The nymphs gave you two things — go back for the other.'
const REPEAT_REFUSAL =
  'does not take it. [dialogue]' + 'Keep it. The roots have what they need.'

/** A game running Act II. */
function createGame(): Game {
  return new Game([new Act2()])
}

/** A game where the spirit already holds the acorn. */
function gameAfterAcorn(): { game: Game; spirit: AncientTreeSpirit } {
  const game = createGame()
  const spirit = new AncientTreeSpirit()
  const acorn = new EnchantedAcorn()
  game.state.addItemToInventory(acorn)
  spirit.giveItem(game.state, acorn)
  return { game, spirit }
}

describe('Ancient Tree Spirit voice', () => {
  it('speaks of spring before the acorn', () => {
    const answer = new AncientTreeSpirit().talkTo(createGame().state)

    expect(answer).not.toContain('You approach the')
    expect(answer).not.toContain('reverence')
    expect(answer).toContain(
      'A face gathers in the knots of the silver bark and turns toward you.',
    )
    expect(answer).toContain(
      'You walk like spring. Everything new, nothing kept.',
    )
    expect(answer).toContain(
      "I don't teach for nothing. Bring me something that hasn't grown yet.",
    )
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, 'ancient tree spirit')
  })

  it('accepts the acorn, teaches the spell and points to the glade east of the entrance', () => {
    const game = createGame()
    const spirit = new AncientTreeSpirit()
    const acorn = new EnchantedAcorn()
    game.state.addItemToInventory(acorn)

    const answer = spirit.giveItem(game.state, acorn)

    expect(answer).toContain(
      'The bark around the knots softens.\n' +
        '[character_name]ancient tree spirit[/character_name]\n' +
        "[dialogue]Next spring's tree, and you carried it here instead of " +
        'planting it. Good. Listen, then.',
    )
    const flavour = answer.indexOf('The voices of the grove settle into you')
    const learned = answer.indexOf(
      'You have learned the [spell_name]Forest Speech[/spell_name] spell!',
    )
    expect(flavour).toBeGreaterThan(-1)
    expect(learned).toBeGreaterThan(flavour)
    expect(answer.indexOf(POINTER)).toBeGreaterThan(learned)
    expect(answer).not.toContain('north')
    expect(
      game.state.currentRoom.items.some((i) => i instanceof SilverLeaves),
    ).toBe(true)
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, 'ancient tree spirit')
  })

  it('speaks of summer after the acorn and repeats the pointer', () => {
    const { game, spirit } = gameAfterAcorn()

    const answer = spirit.talkTo(game.state)

    expect(answer).toContain('Still summer for you, then — all errands.')
    expect(answer).toContain(
      'The nymphs in the glade east of the entrance have something for ' +
        'these roots. Answer them, and bring back what they give you.',
    )
    expect(answer).not.toContain('north')
    expect(answer).not.toContain('crystal-clear')
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, 'ancient tree spirit')
  })

  it('says the same half-harvest line for water or flowers alone', () => {
    for (const gift of [new CrystalClearWater(), new Moonflowers()]) {
      const { game, spirit } = gameAfterAcorn()
      game.state.addItemToInventory(gift)

      const answer = spirit.giveItem(game.state, gift)

      expect(answer).toContain(HALF_HARVEST)
      expect(game.state.getStoryFlag(FLAG_WHISPERS_IN_WIND_COMPLETED)).toBe(
        false,
      )
      expectMarkupWellFormed(answer)
      expectDialogueSpeaker(answer, 'ancient tree spirit')
    }
  })

  it('completes the quest with the second gift and points to Nyx', () => {
    const { game, spirit } = gameAfterAcorn()
    const moonflowers = new Moonflowers()
    game.state.addItemToInventory(new CrystalClearWater())
    game.state.addItemToInventory(moonflowers)

    const answer = spirit.giveItem(game.state, moonflowers)

    expect(answer).toContain(
      'You pour some of the crystal-clear water at the foot of the silver ' +
        'tree and set the moonflowers in the wet soil. They take root at ' +
        'once and begin to glow.',
    )
    expect(answer).toContain(
      "Rain and a night's flowers. That will see the roots through winter.",
    )
    expect(answer).toContain(
      'South of the grove, branches pull apart with a long creak.',
    )
    expect(answer).toContain(
      "The way south is open. Nyx lives at the end of it. She doesn't come " +
        'for asking — read her altar before you call her.',
    )
    expect(answer).not.toContain('Heart of the Forest')
    expect(game.state.getStoryFlag(FLAG_WHISPERS_IN_WIND_COMPLETED)).toBe(true)
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, 'ancient tree spirit')
  })

  it('speaks of autumn after the quest is done', () => {
    const { game, spirit } = gameAfterAcorn()
    game.state.setStoryFlag(FLAG_WHISPERS_IN_WIND_COMPLETED, true)

    const answer = spirit.talkTo(game.state)

    expect(answer).toContain(
      'Autumn, for you. You came with nothing and you leave carrying ' +
        'things. The way south is yours.',
    )
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, 'ancient tree spirit')
  })

  it('gives one refusal for the acorn, water or flowers once it is done', () => {
    const { game, spirit } = gameAfterAcorn()
    game.state.setStoryFlag(FLAG_WHISPERS_IN_WIND_COMPLETED, true)

    for (const gift of [
      new EnchantedAcorn(),
      new CrystalClearWater(),
      new Moonflowers(),
    ]) {
      const answer = spirit.giveItem(game.state, gift)

      expect(answer).toContain(REPEAT_REFUSAL)
      expectMarkupWellFormed(answer)
      expectDialogueSpeaker(answer, 'ancient tree spirit')
    }
  })

  it('names the wrong season for any other item', () => {
    const game = createGame()
    const spirit = new AncientTreeSpirit()
    const leaves = new SilverLeaves()

    const answer = spirit.giveItem(game.state, leaves)

    expect(answer).toContain(
      'does not stir. [dialogue]' + 'Wrong season for that.',
    )
    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, 'ancient tree spirit')
  })

  it('describes itself without calling itself old or wise', () => {
    const spirit = new AncientTreeSpirit()

    const answer = spirit.examine(createGame().state)

    expect(spirit.description).toBe(
      'The spirit lives in the silver-barked tree. Its face is only there ' +
        'when you stop looking for it: two knots for eyes, a split in the ' +
        'bark for a mouth. Moss grows on it in rings, one for every winter.',
    )
    expect(answer).toContain(
      'The bark is warm under your hand, and below your feet the roots ' +
        'shift slowly, like someone turning over in their sleep.',
    )
    expect(answer).not.toMatch(/ancient beyond|wise|sacred|millennia/i)
    expectMarkupWellFormed(answer)
  })
})
