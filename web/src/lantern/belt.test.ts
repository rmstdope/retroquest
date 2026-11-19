/** The belt of pictures: what is on it, the ring of a carried thing or spell, and what a thing in hand sends. */
import { describe, expect, it } from 'vitest'
import type { ActionContext } from './actions'
import {
  withoutOwed,
  beltPictures,
  carriedRing,
  handCommand,
  handStrip,
  pressedOnBelt,
  subjectOf,
  type Hand,
} from './belt'
import type { RingSubject } from './pressRing'

const EMPTY: ActionContext = {
  roomItems: [],
  characters: [],
  inventory: [],
  spells: [],
  exits: {},
  wares: [],
}
const bread: RingSubject = {
  areaId: 'belt:item:bread',
  name: 'bread',
  label: 'Bread',
  kind: 'item',
}
const light: RingSubject = {
  areaId: 'belt:spell:light',
  name: 'light',
  label: 'Light',
  kind: 'spell',
}
const items = [
  {
    name: '[item_name]2 bread[/item_name]',
    description: 'A [bold]loaf[/bold].',
  },
  { name: "[item_name]Elior's Journal[/item_name]", description: 'Notes.' },
]
const spells = [
  { name: '[spell_name]light[/spell_name]', description: 'Glow.' },
]
const labels = (subject: RingSubject, ctx: ActionContext, placed = 0) =>
  carriedRing(subject, ctx, placed).map((a) => a.label)

describe('beltPictures', () => {
  it('lists the carried things with their counts, names and first letters', () => {
    const pictures = beltPictures(items, spells, 'bag')
    expect(pictures.map((p) => [p.name, p.label, p.count, p.letter])).toEqual([
      ['bread', 'Bread', 2, 'B'],
      ["Elior's Journal", "Elior's Journal", 1, 'E'],
    ])
    expect(pictures[0].kind).toBe('item')
    expect(pictures[0].note).toBe('A [bold]loaf[/bold].')
  })

  it('lists the spells when that list shows', () => {
    const pictures = beltPictures(items, spells, 'spells')
    expect(pictures.map((p) => [p.kind, p.name, p.letter])).toEqual([
      ['spell', 'light', 'L'],
    ])
  })
})

describe('carriedRing', () => {
  it('offers a thing that narrows its ring only Use with… and Examine', () => {
    const cat: RingSubject = { ...bread, name: 'Patches', verbs: [] }
    const ctx = { ...EMPTY, characters: ['Hemlock'] }
    expect(labels(cat, ctx)).toEqual(['Use with…', 'Examine'])
  })
  it('carries the narrowed ring verbs from the bag entry to the picture', () => {
    const [picture] = beltPictures(
      [
        {
          name: '[item_name]Patches[/item_name]',
          description: 'A cat.',
          ringVerbs: [],
        },
      ],
      [],
      'bag',
    )
    expect(subjectOf(picture).verbs).toEqual([])
  })
  it('offers a thing Use and Examine when nothing else is anywhere', () => {
    expect(labels(bread, EMPTY)).toEqual(['Use', 'Examine'])
  })

  it('offers Open only on what opens or is read, and never Close', () => {
    const ctx = { ...EMPTY, canOpen: (name: string) => name === 'bread' }
    expect(labels(bread, ctx)).toEqual(['Use', 'Open', 'Examine'])
    expect(labels(bread, { ...EMPTY, canOpen: () => false })).toEqual([
      'Use',
      'Examine',
    ])
  })

  it('offers every action in order when there is something to use it on, someone to hand it to and spells', () => {
    const ctx = {
      ...EMPTY,
      characters: ['tilda'],
      inventory: ['2 bread', 'rope'],
      spells: ['light'],
    }
    expect(labels(bread, ctx, 1)).toEqual([
      'Use',
      'Use with…',
      'Cast on…',
      'Examine',
    ])
  })

  it('keeps Use with… for someone to hand the thing to when nothing else is carried or placed', () => {
    const ctx = { ...EMPTY, inventory: ['bread'], characters: ['tilda'] }
    expect(labels(bread, ctx, 0)).toEqual(['Use', 'Use with…', 'Examine'])
  })

  it('offers Use with… for a placed thing even with nothing else carried', () => {
    const ctx = { ...EMPTY, inventory: ['bread'] }
    expect(labels(bread, ctx, 2)).toContain('Use with…')
  })

  it('fans the spells known for Cast on… and sends cast <spell> on <thing>', () => {
    const ctx = { ...EMPTY, inventory: ['bread'], spells: ['light'] }
    const cast = carriedRing(bread, ctx, 0).find((a) => a.id === 'caston')
    expect(cast?.choices).toEqual([
      { label: 'Light', command: 'cast light on bread' },
    ])
  })

  it('takes the thing in hand for Use with…', () => {
    const ctx = { ...EMPTY, inventory: ['bread'], characters: ['tilda'] }
    const ring = carriedRing(bread, ctx, 1)
    expect(ring.find((a) => a.id === 'usewith')?.hand).toBe('usewith')
    expect(ring.find((a) => a.id === 'give')).toBeUndefined()
    expect(ring.find((a) => a.id === 'use')?.command).toBe('use bread')
    expect(ring.find((a) => a.id === 'examine')?.command).toBe('examine bread')
  })

  it('offers a spell Cast, which sends at once, and Cast on…, which takes it in hand', () => {
    const ring = carriedRing(light, { ...EMPTY, spells: ['light'] }, 0)
    expect(ring.map((a) => a.label)).toEqual(['Cast', 'Cast on…'])
    expect(ring[0].command).toBe('cast light')
    expect(ring[1].hand).toBe('caston')
  })
})

describe('the hand', () => {
  const inHand = (verb: Hand['verb'], subject = bread): Hand => ({
    kind: subject.kind === 'spell' ? 'spell' : 'item',
    name: subject.name,
    label: subject.label,
    verb,
  })

  it('says what the next press will do', () => {
    expect(handStrip(inHand('usewith'))).toBe('Use Bread with…')
    expect(handStrip(inHand('caston', light))).toBe('Cast Light on…')
  })

  it('sends the command that already exists for the pressed thing', () => {
    expect(handCommand(inHand('usewith'), { name: 'tilda' })).toBe(
      'use bread with tilda',
    )
    expect(handCommand(inHand('caston', light), { name: 'bread' })).toBe(
      'cast light on bread',
    )
  })

  it('takes another carried thing as the target, but not a spell or itself', () => {
    const [first, second] = beltPictures(items, spells, 'bag')
    const [spell] = beltPictures(items, spells, 'spells')
    const hand = inHand('usewith')
    expect(pressedOnBelt(hand, second)).toBe("use bread with Elior's Journal")
    expect(pressedOnBelt(hand, first)).toBeNull()
    expect(pressedOnBelt(hand, spell)).toBeNull()
  })
})

describe('withoutOwed', () => {
  const bag = [
    { name: '3 apple', description: 'Red.' },
    { name: 'lantern', description: 'Lit.' },
  ]
  const owing =
    (owed: Record<string, number>) =>
    (name: string): number =>
      owed[name] ?? 0

  it('leaves everything when nothing is owed', () => {
    expect(withoutOwed(bag, owing({}))).toEqual(bag)
  })

  it('drops a thing that is wholly owed', () => {
    expect(withoutOwed(bag, owing({ lantern: 1 })).map((e) => e.name)).toEqual([
      '3 apple',
    ])
  })

  it('lowers a counted thing by what is owed, and drops it at none', () => {
    expect(withoutOwed(bag, owing({ apple: 1 }))[0].name).toBe('2 apple')
    expect(withoutOwed(bag, owing({ apple: 2 }))[0].name).toBe('apple')
    expect(withoutOwed(bag, owing({ apple: 3 })).map((e) => e.name)).toEqual([
      'lantern',
    ])
  })
})
