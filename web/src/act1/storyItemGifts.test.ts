/**
 * Act 1's story items handed to the people of Willowbrook (rq-nqk7): the
 * amulet, the cursed rune token, the rare flower, a fish and a coin each get
 * an answer of their own from the people the bead names, never the stock
 * give-back line meant for clutter. The item stays with Elior and nothing
 * else changes.
 */
import { describe, expect, it } from 'vitest'
import { Character, Game, Item } from '@/engine'
import { Act1 } from './Act1'
import { Fisherman } from './characters/Fisherman'
import { Grandmother } from './characters/Grandmother'
import { Merchant } from './characters/Merchant'
import { Priest } from './characters/Priest'
import { Shopkeeper } from './characters/Shopkeeper'
import { Villager } from './characters/Villager'
import { AncientAmulet } from './items/AncientAmulet'
import { Coin } from './items/Coin'
import { Fish } from './items/Fish'
import { RareFlower } from './items/RareFlower'
import { RuneToken } from './items/RuneToken'

const GRANDMOTHER_STOCK = 'My shelves are full enough.'
const TILDA_STOCK = 'People will talk.'
const HEMLOCK_STOCK = "I don't take them in."
const FISHERMAN_STOCK = "Won't catch anything with that"
const PRIEST_STOCK = 'The road will want it more than I do.'
const MERCHANT_STOCK = "I'd not get a copper for that"

const CASES: [string, () => Character, () => Item, string][] = [
  [
    'the amulet to Grandmother',
    () => new Grandmother(),
    () => new AncientAmulet(),
    GRANDMOTHER_STOCK,
  ],
  [
    'the rune token to Grandmother',
    () => new Grandmother(),
    () => new RuneToken(),
    GRANDMOTHER_STOCK,
  ],
  [
    'the rare flower to Grandmother',
    () => new Grandmother(),
    () => new RareFlower(),
    GRANDMOTHER_STOCK,
  ],
  [
    'a fish to Grandmother',
    () => new Grandmother(),
    () => new Fish(),
    GRANDMOTHER_STOCK,
  ],
  [
    'a coin to Grandmother',
    () => new Grandmother(),
    () => new Coin(),
    GRANDMOTHER_STOCK,
  ],
  [
    'the rune token to Tilda',
    () => new Villager(),
    () => new RuneToken(),
    TILDA_STOCK,
  ],
  [
    'the rune token to Hemlock',
    () => new Shopkeeper(),
    () => new RuneToken(),
    HEMLOCK_STOCK,
  ],
  [
    'a coin to Hemlock',
    () => new Shopkeeper(),
    () => new Coin(),
    HEMLOCK_STOCK,
  ],
  [
    'the rune token to the fisherman',
    () => new Fisherman(),
    () => new RuneToken(),
    FISHERMAN_STOCK,
  ],
  [
    'the rune token to the priest',
    () => new Priest(),
    () => new RuneToken(),
    PRIEST_STOCK,
  ],
  [
    'the rune token to the merchant',
    () => new Merchant(),
    () => new RuneToken(),
    MERCHANT_STOCK,
  ],
  [
    'a coin to the merchant',
    () => new Merchant(),
    () => new Coin(),
    MERCHANT_STOCK,
  ],
]

describe('story items given in Willowbrook', () => {
  it.each(CASES)(
    'answers %s with its own line, keeps the item and changes nothing',
    (_name, person, item, stock) => {
      const game = new Game([new Act1()])
      const gift = item()
      game.state.addItemToInventory(gift)
      const flagsBefore = JSON.stringify(game.state.storyFlags)
      const who = person()
      const first = who.giveItem(game.state, gift)
      expect(first).not.toContain(stock)
      expect(first).toContain('[character_name]')
      expect(who.giveItem(game.state, gift)).toBe(first)
      expect(game.state.inventory).toContain(gift)
      expect(JSON.stringify(game.state.storyFlags)).toBe(flagsBefore)
    },
  )

  it('still gives the stock line for clutter', () => {
    const game = new Game([new Act1()])
    const stone = new Item({ name: 'pebble', description: 'A pebble.' })
    game.state.addItemToInventory(stone)
    expect(new Grandmother().giveItem(game.state, stone)).toContain(
      GRANDMOTHER_STOCK,
    )
    expect(new Shopkeeper().giveItem(game.state, stone)).toContain(
      HEMLOCK_STOCK,
    )
  })
})
