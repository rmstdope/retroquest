import { describe, it, expect } from 'vitest'
import { inventoryChanges, parseCountedName } from './inventoryChanges'

const item = (name: string) => `[item_name]${name}[/item_name]`
const spell = (name: string) => `[spell_name]${name}[/spell_name]`

describe('parseCountedName', () => {
  it('reads a plain name as one', () => {
    expect(parseCountedName(item('bucket'))).toEqual({
      name: 'bucket',
      count: 1,
    })
  })

  it('reads the count prefix the engine adds for stacks', () => {
    expect(parseCountedName(item('3 apple'))).toEqual({
      name: 'apple',
      count: 3,
    })
  })

  it('keeps numbers that are part of the name', () => {
    expect(parseCountedName(item('page 12 of the journal'))).toEqual({
      name: 'page 12 of the journal',
      count: 1,
    })
  })
})

describe('inventoryChanges', () => {
  it('reports nothing when nothing changed', () => {
    const bag = [item('bucket'), item('2 apple')]
    expect(inventoryChanges(bag, bag, 'item')).toEqual({
      gained: [],
      lost: [],
    })
  })

  it('reports a new item as gained', () => {
    expect(
      inventoryChanges([item('bucket')], [item('bucket'), item('map')], 'item'),
    ).toEqual({
      gained: [{ kind: 'item', name: 'map', count: 1 }],
      lost: [],
    })
  })

  it('reports a removed item as lost', () => {
    expect(
      inventoryChanges([item('bucket'), item('map')], [item('map')], 'item'),
    ).toEqual({
      gained: [],
      lost: [{ kind: 'item', name: 'bucket', count: 1 }],
    })
  })

  it('reports changes in a stack by the difference', () => {
    expect(
      inventoryChanges([item('2 apple')], [item('3 apple')], 'item').gained,
    ).toEqual([{ kind: 'item', name: 'apple', count: 1 }])
    expect(
      inventoryChanges([item('3 apple')], [item('apple')], 'item').lost,
    ).toEqual([{ kind: 'item', name: 'apple', count: 2 }])
  })

  it('works for spells', () => {
    expect(inventoryChanges([], [spell('revive')], 'spell').gained).toEqual([
      { kind: 'spell', name: 'revive', count: 1 },
    ])
  })

  it('treats names case-insensitively but reports the new spelling', () => {
    expect(
      inventoryChanges([item('Old Key')], [item('old key')], 'item'),
    ).toEqual({ gained: [], lost: [] })
  })
})
