import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { AncientAmulet } from './AncientAmulet'
import { executeCommands, expectMarkupWellFormed } from '@/testing/gameHelpers'

const BASE = 'A family heirloom whose runes glint like dew at dawn. '
const BEFORE = BASE + 'It is faintly warm in your hand.'
const AFTER_LETTER =
  BASE +
  'In its depths two faces linger: a man and a woman, laughing beside a ' +
  'third figure who has turned away.'
const AFTER_INSCRIPTION =
  BASE +
  "In its depths the woman's face is clear: Lysa, with Grandmother's eyes. " +
  'The man laughs beside her, and the third figure keeps his back turned.'
const AFTER_DRAGON =
  BASE +
  'In its depths Aren and Lysa stand hand in hand. The third figure keeps ' +
  'his back turned.'

/** The amulet in the bag of a new Act III game. */
function bagAmulet(game: Game): AncientAmulet {
  const amulet = game.state.inventory.find((i) => i instanceof AncientAmulet)
  if (!amulet) throw new Error('no amulet in the bag')
  return amulet
}

describe('AncientAmulet', () => {
  it('starts in the bag, not in Mira’s Hut', () => {
    const game = new Game([new Act3()])

    expect(bagAmulet(game).description).toBe(BEFORE)
    expect(
      game.state.currentRoom.items.some((i) => i instanceof AncientAmulet),
    ).toBe(false)
  })

  it('examines to the line of the furthest clue reached', () => {
    const game = new Game([new Act3()])
    const amulet = bagAmulet(game)

    expect(amulet.examine(game.state)).toContain(BEFORE)
    amulet.glow(1)
    expect(amulet.examine(game.state)).toContain(AFTER_LETTER)
    amulet.glow(2)
    expect(amulet.examine(game.state)).toContain(AFTER_INSCRIPTION)
    amulet.glow(3)
    expect(amulet.examine(game.state)).toContain(AFTER_DRAGON)
    expectMarkupWellFormed(amulet.examine(game.state))
  })

  it('shows the same line in the inventory panel', () => {
    const game = new Game([new Act3()])
    const amulet = bagAmulet(game)

    amulet.glow(1)
    expect(amulet.description).toBe(AFTER_LETTER)
    amulet.glow(2)
    expect(amulet.description).toBe(AFTER_INSCRIPTION)
    amulet.glow(3)
    expect(amulet.description).toBe(AFTER_DRAGON)
  })

  it('glows with the agreed words, once per stage', () => {
    const amulet = new AncientAmulet()

    const first = amulet.glow(1)
    expect(first).toContain('grows warm, then glows')
    expect(first).toContain('[item_name]Ancient Amulet[/item_name]')
    expect(amulet.glow(1)).toBe('')
    expect(amulet.glow(2)).toContain('glows again, brighter than before')
    expect(amulet.glow(3)).toContain('blazes in your hand a third time')
    expect(amulet.glow(3)).toBe('')
  })

  it('never glows for an earlier stage than the one reached', () => {
    const amulet = new AncientAmulet()

    amulet.glow(2)

    expect(amulet.glow(1)).toBe('')
    expect(amulet.description).toBe(AFTER_INSCRIPTION)
  })

  it('glowInBag is silent when the bag holds no amulet', () => {
    const game = new Game([new Act3()])
    game.state.inventory = []

    expect(AncientAmulet.glowInBag(game.state, 1)).toBe('')
  })

  it('keeps its picture through a save and load', () => {
    const game = new Game([new Act3()])
    bagAmulet(game).glow(2)
    const fresh = new Game([new Act3()])

    fresh.loadSaveData(game.toSaveData())

    expect(bagAmulet(fresh).description).toBe(AFTER_INSCRIPTION)
    expect(bagAmulet(fresh).glow(2)).toBe('')
  })

  it('can be taken by hand in no room: Mira no longer refuses', () => {
    const game = new Game([new Act3()])

    const out = executeCommands(game, ['examine amulet'])

    expect(out).toContain(BEFORE)
    expect(out).not.toContain('Not yet')
  })
})
