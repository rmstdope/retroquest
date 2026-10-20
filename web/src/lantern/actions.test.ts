import { describe, it, expect } from 'vitest'
import {
  VERBS,
  verbById,
  buildCommand,
  keepsDoIt,
  isFinished,
  targetsFor,
  type ActionContext,
} from './actions'

const CONTEXT: ActionContext = {
  roomItems: ['bucket', 'old notice'],
  characters: ['villager', 'mira'],
  inventory: [
    '[item_name]lantern[/item_name]',
    '[item_name]2 apple[/item_name]',
  ],
  spells: [
    '[spell_name]revive[/spell_name]',
    '[spell_name]greater_heal[/spell_name]',
  ],
  exits: { north: "Mira's Hut", east: 'General Store' },
  wares: [
    { name: 'rope', price: 1, seller: 'shopkeeper' },
    { name: 'matches', price: 4, seller: 'shopkeeper' },
  ],
}

describe('buildCommand', () => {
  it.each([
    ['look', [], 'look'],
    ['search', [], 'search'],
    ['rest', [], 'rest'],
    ['inventory', [], 'inventory'],
    ['spells', [], 'spells'],
    ['map', [], 'map'],
    ['stats', [], 'stats'],
    ['help', [], 'help'],
    ['go', ['north'], 'go north'],
    ['examine', ['old notice'], 'examine old notice'],
    ['take', ['bucket'], 'take bucket'],
    ['drop', ['lantern'], 'drop lantern'],
    ['use', ['lantern'], 'use lantern'],
    ['use', ['bucket', 'well'], 'use bucket with well'],
    ['talk', ['mira'], 'talk to mira'],
    ['say', ['hello there', 'mira'], 'say hello there to mira'],
    ['give', ['apple', 'mira'], 'give apple to mira'],
    ['buy', ['rope', 'shopkeeper'], 'buy rope from shopkeeper'],
    ['open', ['chest'], 'open chest'],
    ['close', ['chest'], 'close chest'],
    ['cast', ['revive'], 'cast revive'],
    ['cast', ['revive', 'withered carrot'], 'cast revive on withered carrot'],
  ] as const)('%s %j → "%s"', (id, args, expected) => {
    expect(buildCommand(verbById(id), [...args])).toBe(expected)
  })

  it('is incomplete while a required slot is empty', () => {
    expect(buildCommand(verbById('take'), [])).toBeNull()
    expect(buildCommand(verbById('give'), ['apple'])).toBeNull()
    expect(buildCommand(verbById('say'), ['', 'mira'])).toBeNull()
    // The engine rejects "buy rope": the seller is required.
    expect(buildCommand(verbById('buy'), ['rope'])).toBeNull()
  })

  it('leaves out an empty optional slot', () => {
    expect(buildCommand(verbById('use'), ['lantern', null])).toBe('use lantern')
  })

  it('trims free text', () => {
    expect(buildCommand(verbById('say'), ['  hello  ', 'mira'])).toBe(
      'say hello to mira',
    )
  })
})

describe('targetsFor', () => {
  it('lists room items and characters for examine, with display names', () => {
    const targets = targetsFor(verbById('examine').slots[0], CONTEXT)

    expect(targets).toContainEqual({
      value: 'old notice',
      label: 'Old Notice',
      kind: 'item',
    })
    expect(targets).toContainEqual({
      value: 'mira',
      label: 'Mira',
      kind: 'character',
    })
  })

  it('uses plain bag names without markup or stack counts', () => {
    const targets = targetsFor(verbById('drop').slots[0], CONTEXT)

    expect(targets.map((t) => t.value)).toEqual(['lantern', 'apple'])
    expect(targets[1].label).toBe('Apple')
  })

  it('lists spells by id with readable labels', () => {
    const targets = targetsFor(verbById('cast').slots[0], CONTEXT)

    expect(targets).toEqual([
      { value: 'revive', label: 'Revive', kind: 'spell' },
      { value: 'greater_heal', label: 'Greater Heal', kind: 'spell' },
    ])
  })

  it('lists exits by direction with the destination', () => {
    expect(targetsFor(verbById('go').slots[0], CONTEXT)).toEqual([
      { value: 'north', label: "North · Mira's Hut", kind: 'exit' },
      { value: 'east', label: 'East · General Store', kind: 'exit' },
    ])
  })

  it('has no choices for a free-text slot', () => {
    expect(targetsFor(verbById('say').slots[0], CONTEXT)).toEqual([])
  })

  it('does not list the same name twice', () => {
    const targets = targetsFor(verbById('use').slots[0], {
      ...CONTEXT,
      roomItems: ['lantern'],
    })

    expect(targets.filter((t) => t.value === 'lantern')).toHaveLength(1)
  })
})

describe('VERBS', () => {
  it('has unique ids', () => {
    const ids = VERBS.map((v) => v.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('puts reference commands in the "more" group', () => {
    const more = VERBS.filter((v) => v.group === 'more').map((v) => v.id)
    expect(more).toEqual(['inventory', 'spells', 'map', 'stats', 'help'])
  })
})

describe('buying from a shop', () => {
  it('offers the wares with their prices', () => {
    expect(targetsFor(verbById('buy').slots[0], CONTEXT)).toEqual([
      { value: 'rope', label: 'Rope · 1 coin', kind: 'item' },
      { value: 'matches', label: 'Matches · 4 coins', kind: 'item' },
    ])
  })

  it('offers only characters who sell something as the seller', () => {
    expect(
      targetsFor(verbById('buy').slots[1], {
        ...CONTEXT,
        characters: ['shopkeeper', 'villager'],
      }),
    ).toEqual([{ value: 'shopkeeper', label: 'Shopkeeper', kind: 'character' }])
  })
})

describe('opening and closing', () => {
  it('offers things in the room and in the bag', () => {
    const values = targetsFor(verbById('open').slots[0], CONTEXT).map(
      (t) => t.value,
    )
    expect(values).toEqual(['bucket', 'old notice', 'lantern', 'apple'])
  })
})

describe('keepsDoIt', () => {
  it('is true only for verbs that can take more after a complete command', () => {
    const keeping = VERBS.filter((v) => keepsDoIt(v)).map((v) => v.id)
    expect([...keeping].sort()).toEqual(['cast', 'say', 'use'])
  })
})

describe('isFinished', () => {
  it('is false while a required choice is missing', () => {
    expect(isFinished(verbById('take'), [null])).toBe(false)
    expect(isFinished(verbById('give'), ['lantern', null])).toBe(false)
  })

  it('is true when every choice is made', () => {
    expect(isFinished(verbById('take'), ['bucket'])).toBe(true)
    expect(isFinished(verbById('give'), ['lantern', 'mira'])).toBe(true)
    expect(isFinished(verbById('say'), ['hi', 'mira'])).toBe(true)
  })

  it('waits while an optional choice is still empty', () => {
    expect(isFinished(verbById('use'), ['lantern', null])).toBe(false)
    expect(isFinished(verbById('use'), ['lantern', 'bucket'])).toBe(true)
  })
})
