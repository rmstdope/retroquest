import { describe, it, expect, beforeEach } from 'vitest'
import { GameState } from './GameState'
import { Item } from './Item'
import { Quest } from './Quest'
import { Room } from './Room'
import { Spell } from './Spell'

/** A quest whose trigger, update and completion answers the test controls. */
class DummyQuest extends Quest {
  triggers: boolean
  completes: boolean
  updates = false
  main = false

  constructor(name: string, triggers = false, completes = false) {
    super({ name, description: `${name} description` })
    this.triggers = triggers
    this.completes = completes
  }

  override checkTrigger(): boolean {
    return this.triggers
  }

  override checkCompletion(): boolean {
    return this.completes
  }

  override checkUpdate(): boolean {
    return this.updates
  }

  override isMain(): boolean {
    return this.main
  }
}

function item(name: string, shortName?: string): Item {
  return new Item({ name, description: `A ${name}`, shortName })
}

describe('GameState', () => {
  let room: Room
  let quest1: DummyQuest
  let quest2: DummyQuest
  let gs: GameState

  beforeEach(() => {
    room = new Room({ name: 'TestRoom', description: 'A test room.' })
    quest1 = new DummyQuest('Quest1', true, false)
    quest2 = new DummyQuest('Quest2', false, true)
    gs = new GameState(room, { TestRoom: room }, [quest1, quest2])
  })

  it("keeps its own quest list, leaving the act's untouched", () => {
    const quests = [quest1, quest2]
    const state = new GameState(room, { TestRoom: room }, quests)
    state.nextActivatedQuest()
    expect(quests).toEqual([quest1, quest2])
  })

  it('starts in the starting room, which counts as visited', () => {
    expect(gs.currentRoom).toBe(room)
    expect(gs.visitedRooms).toEqual(['TestRoom'])
    expect(gs.inventory).toEqual([])
    expect(gs.knownSpells).toEqual([])
    expect(gs.nonActivatedQuests).toEqual([quest1, quest2])
    expect(gs.activatedQuests).toEqual([])
    expect(gs.completedQuests).toEqual([])
  })

  describe('quests', () => {
    it('moves a triggered quest from non-activated to activated', () => {
      expect(gs.nextActivatedQuest()).toBe(quest1)
      expect(gs.activatedQuests).toContain(quest1)
      expect(gs.nonActivatedQuests).not.toContain(quest1)
      expect(gs.nextActivatedQuest()).toBeNull()
    })

    it('returns the first activated quest reporting an update', () => {
      const q1 = new DummyQuest('Q1')
      const q2 = new DummyQuest('Q2')
      q2.updates = true
      gs.activatedQuests = [q1, q2]
      expect(gs.nextUpdatedQuest()).toBe(q2)
      q2.updates = false
      expect(gs.nextUpdatedQuest()).toBeNull()
    })

    it('moves a completed quest from activated to completed', () => {
      gs.activatedQuests = [quest1, quest2]
      expect(gs.nextCompletedQuest()).toBe(quest2)
      expect(gs.completedQuests).toContain(quest2)
      expect(gs.activatedQuests).not.toContain(quest2)
      expect(gs.nextCompletedQuest()).toBeNull()
    })

    it('settles every pending quest event in one call, then reports nothing', () => {
      const starts = new DummyQuest('Starts', true, false)
      const changes = new DummyQuest('Changes')
      changes.updates = true
      // a real quest reports its log change once, then settles
      changes.checkUpdate = (): boolean => {
        const changed = changes.updates
        changes.updates = false
        return changed
      }
      const ends = new DummyQuest('Ends', false, true)
      gs.nonActivatedQuests = [starts]
      gs.activatedQuests = [changes, ends]
      const settled = gs.settleQuests()
      expect(settled.activated).toEqual([starts])
      expect(settled.completed).toEqual([ends])
      expect(gs.completedQuests).toEqual([ends])
      expect(settled.updated).toEqual([changes])
      expect(gs.settleQuests()).toEqual({
        activated: [],
        updated: [],
        completed: [],
      })
    })

    it('tells whether a quest is activated or completed by name', () => {
      gs.activatedQuests = [quest1]
      expect(gs.isQuestActivated('Quest1')).toBe(true)
      expect(gs.isQuestCompleted('Quest1')).toBe(false)
      gs.completedQuests = [quest2]
      expect(gs.isQuestCompleted('Quest2')).toBe(true)
      expect(gs.isQuestActivated('Quest2')).toBe(false)
    })

    it('finds quests by name in every list, case-insensitively', () => {
      const quest3 = new DummyQuest('Quest3', true, true)
      gs.nonActivatedQuests = [quest1]
      gs.activatedQuests = [quest2]
      gs.completedQuests = [quest3]
      expect(gs.getQuest('Quest1')).toBe(quest1)
      expect(gs.getQuest('quest1')).toBe(quest1)
      expect(gs.getQuest('Quest2')).toBe(quest2)
      expect(gs.getQuest('Quest3')).toBe(quest3)
      expect(gs.getQuest('NotAQuest')).toBeNull()
    })
  })

  describe('story flags', () => {
    it('sets, reads and overwrites flags; unknown flags are false', () => {
      expect(gs.getStoryFlag('door_open')).toBe(false)
      gs.setStoryFlag('door_open', true)
      expect(gs.getStoryFlag('door_open')).toBe(true)
      gs.setStoryFlag('door_open', false)
      expect(gs.getStoryFlag('door_open')).toBe(false)
    })
  })

  describe('rooms', () => {
    it('marks rooms visited once', () => {
      const other = new Room({ name: 'AnotherRoom', description: '' })
      gs.markVisited(other)
      gs.markVisited(other)
      expect(gs.visitedRooms).toEqual(['TestRoom', 'AnotherRoom'])
    })

    it('finds rooms by display name, case-insensitively', () => {
      const other = new Room({ name: 'AnotherRoom', description: '' })
      gs.allRooms = { TestRoom: room, Other: other }
      expect(gs.getRoom('anotherroom')).toBe(other)
      expect(gs.getRoom('NonExistentRoom')).toBeNull()
    })
  })

  describe('inventory', () => {
    it('resolves a story name once: bag first, then room, short or full', () => {
      const roomKey = item('Rusted Locker Key', 'key')
      const bagKey = item("Miner's Key", 'key')
      room.addItem(roomKey)
      gs.addItemToInventory(bagKey)
      expect(gs.findItems('KEY')).toEqual([bagKey, roomKey])
      expect(gs.findItem('key')).toBe(bagKey)
      expect(gs.findItem('rusted locker key')).toBe(roomKey)
      expect(gs.findItems('key', { inventory: false })).toEqual([roomKey])
      expect(gs.findItems('key', { room: false })).toEqual([bagKey])
      expect(gs.findItem('nope')).toBeNull()
    })

    it('removes carried items by short name as well as full name', () => {
      gs.addItemToInventory(item('Rusty Hoe', 'hoe'), 2)
      expect(gs.removeItemFromInventory('hoe')).toBe(1)
      expect(gs.removeAllItemsFromInventory('hoe')).toBe(1)
      expect(gs.hasItem('Rusty Hoe')).toBe(false)
    })

    it('adds, finds (by name or short name) and removes items', () => {
      gs.addItemToInventory(item('item1', 'itm1'))
      expect(gs.hasItem('item1')).toBe(true)
      expect(gs.hasItem('itm1')).toBe(true)
      gs.removeItemFromInventory('item1')
      expect(gs.hasItem('item1')).toBe(false)
    })

    it('batches several items of the same kind', () => {
      for (let i = 0; i < 5; i++) gs.addItemToInventory(item('coin'))
      for (let i = 0; i < 3; i++) gs.addItemToInventory(item('key'))
      gs.addItemToInventory(item('sword'))

      expect(gs.getInventorySummary()).toEqual({ coin: 5, key: 3, sword: 1 })
      expect(gs.getItemCount('coin')).toBe(5)
      expect(gs.getItemCount('nonexistent')).toBe(0)
      expect(gs.hasItem('potion')).toBe(false)

      const stats = gs.stats()
      expect(stats).toContain('5 coin')
      expect(stats).toContain('3 key')
      expect(stats).toContain('sword')
      expect(stats).not.toContain('1 sword')

      expect(gs.removeItemFromInventory('coin', 2)).toBe(2)
      expect(gs.getItemCount('coin')).toBe(3)
      expect(gs.removeItemFromInventory('key', 5)).toBe(3)
      expect(gs.getItemCount('key')).toBe(0)
      expect(gs.removeAllItemsFromInventory('coin')).toBe(3)
      expect(gs.hasItem('coin')).toBe(false)
      expect(gs.inventory).toHaveLength(1)
    })

    it('adds an item several times with a count', () => {
      const coin = item('coin')
      gs.addItemToInventory(item('sword'))
      gs.addItemToInventory(coin, 5)
      gs.addItemToInventory(coin, 3)
      expect(gs.getItemCount('coin')).toBe(8)
      expect(gs.getInventorySummary()).toEqual({ coin: 8, sword: 1 })
      expect(gs.inventory).toHaveLength(9)
    })

    it('removes from the inventory first, then from the current room', () => {
      gs.addItemToInventory(item('coin'), 3)
      gs.addItemToInventory(item('sword'))
      room.items.push(item('coin'), item('coin'), item('gem'))

      expect(gs.removeItemFromInventoryOrRoom('sword', 1)).toBe(1)
      expect(room.items).toHaveLength(3)
      expect(gs.removeItemFromInventoryOrRoom('coin', 5)).toBe(5)
      expect(gs.getItemCount('coin')).toBe(0)
      expect(room.items).toHaveLength(1)
      expect(gs.removeItemFromInventoryOrRoom('gem', 3)).toBe(1)
      expect(room.items).toHaveLength(0)
      expect(gs.removeItemFromInventoryOrRoom('nonexistent', 1)).toBe(0)

      gs.addItemToInventory(item('Health Potion', 'potion'))
      expect(gs.removeItemFromInventoryOrRoom('potion', 1)).toBe(1)
      expect(gs.getItemCount('Health Potion')).toBe(0)
    })

    it('prefers the inventory over rooms when finding an item', () => {
      const inInventory = item('amulet')
      const inRoom = item('amulet')
      const chamber = new Room({ name: 'Chamber', description: '' })
      chamber.items = [inRoom]
      gs.addItemToInventory(inInventory)
      gs.allRooms = { Chamber: chamber }
      expect(gs.getItem('amulet')).toBe(inInventory)
    })

    it('finds items in the inventory and in any room by name or short name', () => {
      const carried = item('item1', 'itm1')
      const elsewhere = item('item2', 'itm2')
      const other = new Room({ name: 'RoomWithItem', description: '' })
      other.items = [elsewhere]
      gs.addItemToInventory(carried)
      gs.allRooms = { TestRoom: room, RoomWithItem: other }
      expect(gs.getItem('item1')).toBe(carried)
      expect(gs.getItem('itm1')).toBe(carried)
      expect(gs.getItem('item2')).toBe(elsewhere)
      expect(gs.getItem('itm2')).toBe(elsewhere)
      expect(gs.getItem('notfound')).toBeNull()
    })
  })

  describe('spells', () => {
    it('learns a spell once and finds it by name', () => {
      const fireball = new Spell({
        id: 'fireball',
        name: 'fireball',
        description: 'Burns.',
      })
      gs.learnSpell(fireball)
      gs.learnSpell(
        new Spell({
          id: 'Fireball',
          name: 'Fireball',
          description: 'Burns.',
        }),
      )
      expect(gs.hasSpell('fireball')).toBe(true)
      expect(gs.hasSpell('FIREBALL')).toBe(true)
      expect(gs.knownSpells).toEqual([fireball])
    })
  })

  describe('stats', () => {
    it('lists the room, items, spells, visited rooms and quests', () => {
      gs.addItemToInventory(item('item1'))
      gs.learnSpell(
        new Spell({ id: 'fireball', name: 'fireball', description: '' }),
      )
      gs.activatedQuests = [quest1]
      quest2.main = true
      gs.completedQuests = [quest2]
      const stats = gs.stats()
      expect(stats).toContain('item1')
      expect(stats).toContain('fireball')
      expect(stats).toContain('TestRoom')
      expect(stats).toContain('Quest1 (side)')
      expect(stats).toContain('Quest2 (main)')
    })

    it('lists a spell by its shown name, not its id', () => {
      gs.learnSpell(
        new Spell({
          id: 'foo_bar',
          name: 'foo bar',
          description: '',
        }),
      )
      expect(gs.stats()).toContain('[spell_name]foo bar[/spell_name]')
    })

    it('shows placeholders when there is nothing to list', () => {
      const stats = gs.stats()
      expect(stats).toContain('(empty)')
      expect(stats).toContain('(none)')
    })
  })

  describe('virtues', () => {
    it('counts every recorded moment of a virtue and reports unknown ones as absent', () => {
      const state = new GameState(
        new Room({ name: 'A', description: '' }),
        {},
        [],
      )
      expect(state.hasVirtue('mercy')).toBe(false)
      expect(state.virtueCount('mercy')).toBe(0)
      state.addVirtue('mercy')
      state.addVirtue('mercy')
      state.addVirtue('truth')
      expect(state.hasVirtue('mercy')).toBe(true)
      expect(state.virtueCount('mercy')).toBe(2)
      expect(state.virtueCount('truth')).toBe(1)
      expect(state.virtues).toEqual(['mercy', 'mercy', 'truth'])
    })
  })
})
