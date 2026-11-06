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
import { Grandmother } from './Grandmother'
import { FLAG_PATCHES_RETURNED } from '../Act1StoryFlags'

const game = (): Game => new Game([new Act1()])

/** Words by which a speaker would claim not to know a word. */
const DENIAL =
  /not a word I know|not that one\.|never heard|new one on me|means nothing|nobody's told me|follow you|what it means/i

/** The first words of each character's two answers (after the label). */
const ANSWERS: [string, () => Character, string, string][] = [
  [
    'Tilda',
    () => new Villager(),
    "Hush, love, you'll have the whole square guessing at it.",
    "Keep that one to yourself, love, or it'll be round the square by supper.",
  ],
  [
    'Hemlock',
    () => new Shopkeeper(),
    "You'd best ask someone with more time than I have, lad.",
    "Keep it for later, lad. I've a shop to mind.",
  ],
  [
    'Mira',
    () => new Mira(),
    'Some words keep, Elior. That one can keep a while.',
    'If it matters, Elior, it will still matter tomorrow.',
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
    "Ask the river, lad. It's been listening longer than I have.",
  ],
  [
    'priest',
    () => new Priest(),
    'I have heard a great many words in this chapel, child. ' +
      'Not all of them were meant for me.',
    'If it is a prayer, child, it is not one of ours.',
  ],
  [
    'merchant',
    () => new Merchant(),
    "Tell it to the road, friend. I've walked every road between here " +
      'and Greendale, and not one of them ever answered.',
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
    expect(new Villager().sayTo(g, 'x')).toContain('whole square guessing')
  })

  it.each(ANSWERS)('%s never claims not to know the word', (_n, make) => {
    const g = game().state
    const c = make()
    const said = [c.sayTo(g, 'blorp'), c.sayTo(g, 'blorp')].join('\n')
    expect(said).not.toMatch(DENIAL)
  })

  it.each([
    ['Tilda', () => new Villager(), 'Hush, love. Not out loud', 0],
    ['Hemlock', () => new Shopkeeper(), 'Not under this roof, lad.', 1],
    ['Mira', () => new Mira(), 'Leave it at the door.', 2],
    ['priest', () => new Priest(), 'Not in the chapel, child.', 5],
  ])('%s hushes at Malakar without advancing', (_n, make, knock, row) => {
    const g = game().state
    const c = make()
    const first = c.sayTo(g, 'Tell me of MALAKAR please')
    expect(first).toContain(knock)
    expect(c.sayTo(g, 'malakar')).toBe(first)
    expect(c.sayTo(g, 'blorp')).toContain(ANSWERS[row][2])
  })

  it('has Grandmother hush at Malakar and turn to the bread', () => {
    const g = game().state
    const grandmother = new Grandmother()
    const first = grandmother.sayTo(g, 'malakar')
    expect(first).toContain("We don't say that one in this house, dear.")
    expect(first).toContain('bread')
    expect(first).not.toMatch(DENIAL)
    expect(grandmother.sayTo(g, 'Malakar?')).toBe(first)
  })

  it('has Mira answer a dream as one she knows of', () => {
    const g = game().state
    const mira = new Mira()
    const first = mira.sayTo(g, 'dream')
    expect(first).toContain('Some dreams are worth keeping, Elior.')
    expect(first).not.toMatch(DENIAL)
    expect(mira.sayTo(g, 'my dreams')).toBe(first)
    expect(mira.sayTo(g, 'blorp')).toContain(ANSWERS[2][2])
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
      'round the square by supper',
    )
  })
})
