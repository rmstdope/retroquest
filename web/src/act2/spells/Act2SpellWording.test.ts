import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'
import { Act2 } from '../Act2'
import { DispelSpell } from './DispelSpell'
import { ForestSpeechSpell } from './ForestSpeechSpell'
import { GreaterHealSpell } from './GreaterHealSpell'
import { MendSpell } from './MendSpell'
import { NatureSenseSpell } from './NatureSenseSpell'
import { PropheticVision } from './PropheticVision'
import { FLAG_GATHERING_STORM_COMPLETED } from '../Act2StoryFlags'
import { SirCedric } from '../characters/SirCedric'
import { Item } from '@/engine'

const DESCRIPTIONS: [string, () => { description: string }, string][] = [
  [
    'mend',
    () => new MendSpell(),
    'The old woman at the end bench taught you over a split bowl: close what is cracked, slowly.',
  ],
  [
    'greater heal',
    () => new GreaterHealSpell(),
    "Lyria taught you over the carter's bed: gather your healing into a narrow light. It makes the weak strong. It does not lift a curse.",
  ],
  [
    'dispel',
    () => new DispelSpell(),
    "The Wardens' unbinding, from their chronicle: loosen what another hand has bound.",
  ],
  [
    'nature sense',
    () => new NatureSenseSpell(),
    'Read from the runes on the standing stones: a way of listening to everything that grows.',
  ],
  [
    'forest speech',
    () => new ForestSpeechSpell(),
    "The tree spirit's gift for your acorn: the talk of roots, branches and small creatures, in words.",
  ],
  [
    'prophetic vision',
    () => new PropheticVision(),
    "Nyx's gift: a look at what is coming. She told you not to look at it alone.",
  ],
]

function gameIn(roomKey: string): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom = game.state.allRooms[roomKey]
  return game
}

describe('Act II spell descriptions', () => {
  it.each(DESCRIPTIONS)('%s remembers who taught it', (_n, make, text) => {
    expect(make().description).toBe(text)
  })

  it('shows the current wording for spells learned in an older save', () => {
    const game = new Game([new Act2()])
    for (const [, make] of DESCRIPTIONS) {
      const spell = make()
      game.state.learnSpell(spell as never)
    }
    for (const spell of game.state.knownSpells) spell.description = 'old'
    new Act2().afterLoad(game.state)
    expect(game.state.knownSpells.map((s) => s.description)).toEqual(
      DESCRIPTIONS.map(([, , text]) => text),
    )
  })
})

describe('Act II spell fallback lines', () => {
  it('forest speech in the forest', () => {
    const out = new ForestSpeechSpell().castSpell(gameIn('AncientGrove').state)
    expect(out).toBe(
      "[success]The forest's talk sorts itself into words: roots complaining of dry ground, a jay telling everyone you are here.[/success]",
    )
  })

  it('nature sense in the forest, at the stones and in town', () => {
    const spell = new NatureSenseSpell()
    expect(spell.castSpell(gameIn('HeartOfTheForest').state)).toBe(
      '[success]You let your awareness spread through the roots and the undergrowth. Everything here is alive and busy, and none of it is hiding from you.[/success]',
    )
    expect(spell.castSpell(gameIn('ForestTransition').state)).toBe(
      '[success]At the stones the living things around you thin to a line. On the far side of it the forest begins, thick and watchful.[/success]',
    )
    expect(spell.castSpell(gameIn('MainSquare').state)).toBe(
      '[dim]There is little growing here: weeds between the cobbles, a sparrow, moss on a wall.[/dim]',
    )
  })

  it('prophetic vision once the act is over', () => {
    const game = gameIn('GreatHall')
    game.state.currentRoom.characters.push(new SirCedric())
    game.state.setStoryFlag(FLAG_GATHERING_STORM_COMPLETED, true)
    const out = new PropheticVision().castSpell(game.state)
    expect(out).toBe(
      'Shapes stir at the edge of sight and will not settle. Whatever is coming, it is not ready to be seen.',
    )
    expectMarkupWellFormed(out)
  })

  it('dispel on an item and greater heal on anyone else', () => {
    const game = gameIn('MainSquare')
    const item = new Item({ name: 'cup', description: 'A cup.' })
    expect(new DispelSpell().castOnItem(game.state, item)).toBe(
      '[success]The unbinding finds nothing bound in it.[/success]',
    )
    const other = game.state.currentRoom.characters[0]
    expect(new GreaterHealSpell().castOnCharacter(game.state, other)).toBe(
      '[success]Golden light settles over them. There was nothing in them that needed it.[/success]',
    )
  })
})
