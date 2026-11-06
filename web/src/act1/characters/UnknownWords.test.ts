import { describe, it, expect } from 'vitest'
import { Game, type Character } from '@/engine'
import { Act1 } from '../Act1'
import { Villager } from './Villager'
import { Shopkeeper } from './Shopkeeper'
import { Mira } from './Mira'
import { Blacksmith } from './Blacksmith'
import { Fisherman } from './Fisherman'
import { Priest } from './Priest'
import { Merchant } from './Merchant'
import { Deer } from './Deer'
import { FLAG_PATCHES_RETURNED } from '../Act1StoryFlags'

const game = (): Game => new Game([new Act1()])

/** The first words of each character's two answers (after the label). */
const ANSWERS: [string, () => Character, string, string][] = [
  [
    'Tilda',
    () => new Villager(),
    "That's a new one on me, love, and I hear everything in this square.",
    "Whatever that means, love, nobody's told me, and that's a first.",
  ],
  [
    'Hemlock',
    () => new Shopkeeper(),
    "Can't say I follow you, lad.",
    'Means nothing to me, lad. Sorry.',
  ],
  [
    'Mira',
    () => new Mira(),
    'Not a word I know, Elior.',
    "If it matters, you'll tell me what it means.",
  ],
  [
    'Borin',
    () => new Blacksmith(),
    "Can't hear a word over this, lad. If it's got an edge, bring it here.",
    "Words aren't my trade, lad. Iron is.",
  ],
  [
    'fisherman',
    () => new Fisherman(),
    "Keep your voice down, lad. You'll put the fish off.",
    'Never heard it, lad. Ask the river.',
  ],
  [
    'priest',
    () => new Priest(),
    'I have heard a great many words in this chapel, child. Not that one.',
    'If it is a prayer, child, it is not one of ours.',
  ],
  [
    'merchant',
    () => new Merchant(),
    "Never heard that one, friend, and I've walked every road between here and Greendale.",
    "You'd fetch a poor price for that word on any road I know, friend.",
  ],
]

describe('Act 1 unknown words', () => {
  it.each(ANSWERS)('%s answers in turn', (_n, make, one, two) => {
    const g = game().state
    const c = make()
    const a1 = c.sayTo(g, 'blorp')
    const a2 = c.sayTo(g, 'blorp')
    const a3 = c.sayTo(g, 'blorp')
    expect(a1).toContain(one)
    expect(a2).toContain(two)
    expect(a3).toContain(one)
    expect(a1).toContain('[character_name]')
    expect(a1).not.toContain('blorp')
    expect(a1).not.toContain("don't seem to understand")
  })

  it('has the deer answer in narration only', () => {
    const g = game().state
    const deer = new Deer()
    const a1 = deer.sayTo(g, 'blorp')
    expect(a1).toContain(
      'watches you, ears forward, and does not answer, not in words.',
    )
    expect(a1).not.toContain('[dialogue]')
    expect(deer.sayTo(g, 'blorp')).toContain(
      'lowers its head to the grass, then lifts it again to look at you.',
    )
  })

  it('keeps each character its own turn', () => {
    const g = game().state
    new Blacksmith().sayTo(g, 'x')
    expect(new Villager().sayTo(g, 'x')).toContain('new one on me')
  })

  it.each([
    ['Tilda', () => new Villager(), 'Hush, love. Not out loud', 0],
    ['Hemlock', () => new Shopkeeper(), 'Not under this roof, lad.', 1],
  ])('%s hushes at Malakar without advancing', (_n, make, knock, row) => {
    const g = game().state
    const c = make()
    const first = c.sayTo(g, 'Tell me of MALAKAR please')
    expect(first).toContain(knock)
    expect(c.sayTo(g, 'malakar')).toBe(first)
    expect(c.sayTo(g, 'blorp')).toContain(ANSWERS[row][2])
  })

  it('has Hemlock knock while the store is shut and after it reopens', () => {
    const g = game()
    g.state.currentRoom = g.state.allRooms.GeneralStore
    g.state.currentRoom.addCharacter(new Shopkeeper())
    expect(g.commandParser.parse('say malakar to hemlock')).toContain(
      'Not under this roof, lad.',
    )
    g.state.setStoryFlag(FLAG_PATCHES_RETURNED, true)
    expect(g.commandParser.parse('say malakar to hemlock')).toContain(
      'Not under this roof, lad.',
    )
  })

  it('has others answer Malakar as any unknown word', () => {
    const g = game().state
    expect(new Blacksmith().sayTo(g, 'malakar')).toContain(
      "Can't hear a word over this",
    )
  })

  it('carries the turn through a save and load', () => {
    const g = game()
    g.state.currentRoom = g.state.allRooms.VillageSquare
    g.commandParser.parse('say blorp to tilda')
    const fresh = game()
    fresh.loadSaveData(g.toSaveData())
    expect(fresh.commandParser.parse('say blorp to tilda')).toContain(
      "nobody's told me",
    )
  })
})
