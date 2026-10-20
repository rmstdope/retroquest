import { describe, it, expect } from 'vitest'
import { ClassRegistry } from './ClassRegistry'
import { serialize, deserialize } from './Serializer'
import { GameState } from './GameState'
import { Character } from './Character'
import { Item } from './Item'
import { Quest } from './Quest'
import { Room } from './Room'
import { Spell } from './Spell'

class Chest extends Item {
  opened = false

  constructor() {
    super({ name: 'chest', description: 'A chest.' })
  }

  override open(): string {
    this.opened = true
    return 'The chest creaks open.'
  }
}

class Cellar extends Room {
  searched = false

  constructor() {
    super({ name: 'Cellar', description: 'Dark.', items: [new Chest()] })
  }

  override getExits(gameState: GameState): Record<string, string> {
    return gameState.getStoryFlag('door_open') ? { up: 'Hall' } : {}
  }
}

class FindChest extends Quest {
  constructor() {
    super({ name: 'Find the chest', description: 'Look for a chest.' })
  }

  override checkTrigger(): boolean {
    return true
  }

  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag('chest_found')
  }
}

const registry = new ClassRegistry().registerAll({
  GameState,
  Character,
  Item,
  Room,
  Spell,
  Quest,
  Chest,
  Cellar,
  FindChest,
})

function roundTrip<T>(value: T): T {
  return deserialize(
    JSON.parse(JSON.stringify(serialize(value, registry))),
    registry,
  ) as T
}

describe('serialize / deserialize', () => {
  it('round-trips primitives, arrays and plain objects', () => {
    const value = {
      n: 1,
      s: 'two',
      b: true,
      nothing: null,
      list: [1, 'a', [true, null]],
      nested: { deep: { deeper: 'x' } },
      flags: { a: true, b: false } as Record<string, boolean>,
    }
    expect(roundTrip(value)).toEqual(value)
  })

  it('restores class instances with their prototype and fields', () => {
    const chest = new Chest()
    chest.open()
    const copy = roundTrip(chest)
    expect(copy).toBeInstanceOf(Chest)
    expect(copy).not.toBe(chest)
    expect(copy.opened).toBe(true)
    expect(copy.name).toBe('chest')
    expect(copy.preventPickup()).toContain("can't take")
  })

  it('keeps shared references and cycles', () => {
    const shared = new Item({ name: 'coin', description: 'd' })
    const graph: { a: Item; b: Item; self?: unknown } = { a: shared, b: shared }
    graph.self = graph
    const copy = roundTrip(graph)
    expect(copy.a).toBe(copy.b)
    expect(copy.self).toBe(copy)
  })

  it('refuses objects of unregistered classes', () => {
    class Unknown {}
    expect(() => serialize({ x: new Unknown() }, registry)).toThrow(/Unknown/)
  })

  it('refuses a graph naming a class the registry does not know', () => {
    const graph = serialize(new Chest(), registry)
    const other = new ClassRegistry().register('Item', Item)
    expect(() => deserialize(graph, other)).toThrow(/Chest/)
  })

  it('leaves out functions and undefined fields', () => {
    const value = { keep: 1, fn: () => 2, gone: undefined } as Record<
      string,
      unknown
    >
    expect(roundTrip(value)).toEqual({ keep: 1 })
  })

  it('round-trips a game state with rooms, items, spells, quests and flags', () => {
    const cellar = new Cellar()
    const hall = new Room({
      name: 'Hall',
      description: 'Bright.',
      exits: { down: 'Cellar' },
    })
    const quest = new FindChest()
    const state = new GameState(cellar, { Cellar: cellar, Hall: hall }, [quest])
    state.setStoryFlag('door_open', true)
    state.learnSpell(
      new Spell({ id: 'light', name: 'light', description: 'd' }),
    )
    state.nextActivatedQuest()
    state.addItemToInventory(
      new Item({ name: 'key', description: 'd', canBeCarried: true }),
      2,
    )
    const chest = cellar.items[0] as Chest
    chest.open()
    state.markVisited(hall)

    const copy = roundTrip(state)

    expect(copy).toBeInstanceOf(GameState)
    expect(copy.currentRoom).toBeInstanceOf(Cellar)
    expect(copy.currentRoom).toBe(copy.allRooms.Cellar)
    expect(copy.currentRoom.getExits(copy)).toEqual({ up: 'Hall' })
    expect((copy.currentRoom.items[0] as Chest).opened).toBe(true)
    expect(copy.visitedRooms).toEqual(['Cellar', 'Hall'])
    expect(copy.hasSpell('light')).toBe(true)
    expect(copy.getItemCount('key')).toBe(2)
    expect(copy.inventory[0]).toBe(copy.inventory[1])
    expect(copy.activatedQuests[0]).toBeInstanceOf(FindChest)
    expect(copy.nextCompletedQuest()).toBeNull()
    copy.setStoryFlag('chest_found', true)
    expect(copy.nextCompletedQuest()).toBe(copy.completedQuests[0])
    expect(state.completedQuests).toEqual([])
  })

  it('keeps shared arrays and arrays containing themselves', () => {
    const shared = [new Item({ name: 'coin', description: 'd' })]
    const graph: { a: Item[]; b: Item[]; loop: unknown[] } = {
      a: shared,
      b: shared,
      loop: [],
    }
    graph.loop.push(graph.loop)
    const copy = roundTrip(graph)
    expect(copy.a).toBe(copy.b)
    expect(copy.a[0]).toBeInstanceOf(Item)
    expect(copy.loop[0]).toBe(copy.loop)
  })

  it('turns undefined and non-finite numbers in arrays into null', () => {
    expect(roundTrip([1, undefined, NaN, Infinity])).toEqual([
      1,
      null,
      null,
      null,
    ])
  })

  it('round-trips a primitive root and a null-prototype object', () => {
    expect(roundTrip(5)).toBe(5)
    expect(roundTrip(null)).toBeNull()
    const bare = Object.assign(Object.create(null) as object, { x: 1 })
    expect(roundTrip(bare)).toEqual({ x: 1 })
  })

  it('leaves a field that was undefined without a key', () => {
    const copy = roundTrip({ gone: undefined } as { gone?: number })
    expect('gone' in copy).toBe(false)
  })

  it('rejects Dates, Maps and Sets as unregistered', () => {
    expect(() => serialize({ when: new Date() }, registry)).toThrow(/Date/)
    expect(() => serialize({ m: new Map() }, registry)).toThrow(/Map/)
    expect(() => serialize({ s: new Set() }, registry)).toThrow(/Set/)
  })

  it('keeps a merchant ware item shared with the room items', () => {
    const rope = new Item({ name: 'rope', description: 'd' })
    const shopkeeper = Object.assign(
      new Character({ name: 'Shopkeeper', description: 'd' }),
      { wares: { rope: { item: rope, price: 1 } } },
    )
    const room = new Room({
      name: 'Shop',
      description: 'd',
      items: [rope],
      characters: [shopkeeper],
    })
    const copy = roundTrip(room)
    const seller = copy.characters[0] as typeof shopkeeper
    expect(seller).toBeInstanceOf(Character)
    expect(seller.wares.rope.price).toBe(1)
    expect(seller.wares.rope.item).toBe(copy.items[0])
  })

  it('fails loudly on a missing reference', () => {
    const graph = serialize({ a: 1 }, registry)
    graph.objects.push({ c: null, f: { bad: { $ref: 99 } } })
    graph.root = { $ref: 1 }
    expect(() => deserialize(graph, registry)).toThrow(/missing object: 99/)
  })

  it('does not let a __proto__ key change the prototype', () => {
    const graph = serialize(new Chest(), registry)
    graph.objects.push({ c: null, f: { evil: true } })
    const entry = graph.objects[0]
    if ('f' in entry) entry.f['__proto__'] = { $ref: 1 }
    const copy = deserialize(graph, registry) as Chest
    expect(copy).toBeInstanceOf(Chest)
    expect(Object.getPrototypeOf(copy)).toBe(Chest.prototype)
    expect(copy.open()).toBe('The chest creaks open.')
  })

  it('produces plain JSON that survives stringify', () => {
    const graph = serialize(new Cellar(), registry)
    expect(JSON.parse(JSON.stringify(graph))).toEqual(graph)
  })
})
