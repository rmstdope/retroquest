import { describe, it, expect } from 'vitest'
import { ClassRegistry } from './ClassRegistry'
import { Item } from './Item'
import { Room } from './Room'

class Lantern extends Item {
  constructor() {
    super({ name: 'lantern', description: 'A lantern.' })
  }
}

describe('ClassRegistry', () => {
  it('maps registered names to classes and instances back to names', () => {
    const registry = new ClassRegistry().registerAll({ Item, Lantern })
    expect(registry.classOf('Lantern')).toBe(Lantern)
    expect(registry.classOf('Room')).toBeUndefined()
    expect(registry.nameOf(new Lantern())).toBe('Lantern')
    expect(registry.nameOf(new Item({ name: 'x', description: '' }))).toBe(
      'Item',
    )
    expect(
      registry.nameOf(new Room({ name: 'r', description: '' })),
    ).toBeUndefined()
  })

  it('uses the given name, not the class name, so minified builds still work', () => {
    const registry = new ClassRegistry().register('act1.Lantern', Lantern)
    expect(registry.nameOf(new Lantern())).toBe('act1.Lantern')
    expect(registry.classOf('Lantern')).toBeUndefined()
  })

  it('does not match subclasses to their parent', () => {
    const registry = new ClassRegistry().register('Item', Item)
    expect(registry.nameOf(new Lantern())).toBeUndefined()
  })

  it('refuses to register the same name twice', () => {
    const registry = new ClassRegistry().register('Lantern', Lantern)
    expect(() => registry.register('Lantern', Item)).toThrow(/Lantern/)
  })

  it('lists its names', () => {
    const registry = new ClassRegistry().registerAll({ Item, Lantern })
    expect(registry.names()).toEqual(['Item', 'Lantern'])
  })
})
