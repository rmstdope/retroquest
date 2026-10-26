import { describe, it, expect } from 'vitest'
import { Room } from './Room'
import type { NameOptions } from './names'
import { Item } from './Item'
import { Character } from './Character'
import { GameState } from './GameState'

function item(name: string): Item {
  return new Item({ name, description: 'A dummy item' })
}

function character(name: string): Character {
  return new Character({ name, description: 'A test character' })
}

function gameState(): GameState {
  const start = new Room({ name: 'Start', description: 'Starting room' })
  return new GameState(start, { Start: start }, [])
}

describe('Room', () => {
  it('describes with the text its descriptionFor hook gives', () => {
    class Changing extends Room {
      /** Test override: a description that depends on the state. */
      override descriptionFor(_gameState: GameState): string {
        return `${this.description} Changed.`
      }
    }
    const room = new Changing({ name: 'R', description: 'Plain.' })

    expect(room.describe(gameState())).toContain('Plain. Changed.')
    expect(
      new Room({ name: 'R', description: 'Plain.' }).describe(gameState()),
    ).toBe('[bold]R[/bold]\nPlain.\n')
  })

  it('initializes with empty items, characters and exits', () => {
    const r = new Room({ name: 'TestRoom', description: 'A simple room.' })
    expect(r.name).toBe('TestRoom')
    expect(r.description).toBe('A simple room.')
    expect(r.items).toEqual([])
    expect(r.characters).toEqual([])
    expect(r.exits).toEqual({})
  })

  describe('items', () => {
    it('keeps added items in insertion order', () => {
      const r = new Room({ name: 'R', description: 'Desc' })
      const [i1, i2, i3] = [item('apple'), item('apple'), item('sword')]
      r.addItem(i1)
      r.addItem(i2)
      r.addItem(i3)
      expect(r.items).toEqual([i1, i2, i3])
    })

    it('finds items by name, case-insensitively', () => {
      const r = new Room({ name: 'R', description: 'Desc' })
      const i = item('Golden Apple')
      r.addItem(i)
      expect(r.getItemByName('golden apple')).toBe(i)
      expect(r.getItemByName('GOLDEN APPLE')).toBe(i)
      expect(r.getItemByName('nope')).toBeNull()
      expect(
        new Room({ name: 'E', description: '' }).getItemByName('x'),
      ).toBeNull()
    })

    it('finds items by short name too', () => {
      const r = new Room({ name: 'R', description: 'Desc' })
      const i = new Item({
        name: 'Golden Apple',
        description: 'An apple.',
        shortName: 'apple',
      })
      r.addItem(i)
      expect(r.getItemByName('Apple')).toBe(i)
    })

    it('removes an item by name and returns it', () => {
      const r = new Room({ name: 'R', description: 'Desc' })
      const i = item('Lantern')
      r.addItem(i)
      expect(r.removeItem('lantern')).toBe(i)
      expect(r.items).toEqual([])
      expect(r.removeItem('ghost')).toBeNull()
    })
  })

  describe('characters', () => {
    it('keeps added characters and finds them case-insensitively', () => {
      const r = new Room({ name: 'R', description: 'Desc' })
      const c1 = character('Villager')
      const c2 = character('Blacksmith John')
      r.addCharacter(c1)
      r.addCharacter(c2)
      expect(r.characters).toEqual([c1, c2])
      expect(r.getCharacterByName('blacksmith john')).toBe(c2)
      expect(r.getCharacterByName('BLACKSMITH JOHN')).toBe(c2)
      expect(r.getCharacterByName('wizard')).toBeNull()
      expect(
        new Room({ name: 'E', description: '' }).getCharacterByName('x'),
      ).toBeNull()
    })

    it('finds a character by any name it answers to', () => {
      class Baker extends Character {
        override answersTo(name: string): boolean {
          return super.answersTo(name) || name.toLowerCase() === 'tilda'
        }
      }
      const r = new Room({ name: 'R', description: '' })
      const baker = new Baker({ name: 'villager', description: '' })
      r.addCharacter(baker)
      expect(r.getCharacterByName('Tilda')).toBe(baker)
      expect(r.getCharacterByName('villager')).toBe(baker)
      expect(r.getCharacterByName('baker')).toBeNull()
    })
  })

  describe('exits', () => {
    it('returns the exits given at construction', () => {
      const exits = { north: 'Forest', south: 'Village' }
      const r = new Room({ name: 'R', description: 'Desc', exits })
      expect(r.getExits(gameState())).toEqual(exits)
    })
  })

  describe('describe', () => {
    it('groups identical items with counts', () => {
      const r = new Room({ name: 'R', description: 'Desc' })
      r.addItem(item('apple'))
      r.addItem(item('apple'))
      r.addItem(item('sword'))
      const desc = r.describe(gameState())
      expect(desc).toContain('Items you can see:')
      expect(desc).toContain('[item_name]2 apple[/item_name]')
      expect(desc).toContain('[item_name]sword[/item_name]')
    })

    it('counts many identical items', () => {
      const r = new Room({ name: 'R', description: 'Desc' })
      for (let i = 0; i < 4; i++) r.addItem(item('coin'))
      expect(r.describe(gameState())).toContain('4 coin')
    })

    it('lists characters and exits', () => {
      const r = new Room({
        name: 'R',
        description: 'Desc',
        exits: { north: 'Forest', east: 'River' },
      })
      r.addCharacter(character('Mira'))
      const desc = r.describe(gameState())
      expect(desc).toContain('[bold]R[/bold]')
      expect(desc).toContain(
        'Characters present: [character_name]Mira[/character_name]',
      )
      expect(desc).toContain(
        'Exits: [exits]north[/exits] (Forest), [exits]east[/exits] (River)',
      )
    })

    it('omits empty sections', () => {
      const desc = new Room({ name: 'R', description: 'Desc' }).describe(
        gameState(),
      )
      expect(desc).not.toContain('Items you can see:')
      expect(desc).not.toContain('Characters present:')
      expect(desc).not.toContain('Exits:')
    })
  })

  describe('defaults', () => {
    it('is quiet, finds nothing, rests, is lit and does nothing on enter', () => {
      const r = new Room({ name: 'R', description: 'Desc' })
      const gs = gameState()
      expect(r.getAmbientSound(gs)).toBe('It is quiet here.')
      expect(r.search(gs)).toContain('find nothing of interest')
      expect(r.rest(gs)).toBe('You rest for a moment, gathering your strength.')
      expect(r.light(gs)).toBe('The room is already well lit.')
      expect(r.onEnter(gs)).toBeUndefined()
    })

    it('searches around the room by name, with "the" before it', () => {
      const r = new Room({ name: 'Old Mill', description: 'Desc' })
      expect(r.search(gameState())).toBe(
        'You search around the [room_name]Old Mill[/room_name], but find nothing ' +
          'of interest beyond what you can already see.',
      )
    })

    it('does not put a second "the" before a name that starts with "The"', () => {
      const r = new Room({ name: 'The Silver Stag Inn', description: 'Desc' })
      expect(r.search(gameState())).toBe(
        'You search around the [room_name]Silver Stag Inn[/room_name], but find ' +
          'nothing of interest beyond what you can already see.',
      )
    })
  })
})

describe('Room names in a sentence', () => {
  it('keeps "the" before a possessive name that is no person\'s own', () => {
    const forge = new Room({ name: "Blacksmith's Forge", description: 'd' })
    expect(forge.search(gameState())).toContain(
      "around the [room_name]Blacksmith's Forge[/room_name],",
    )
  })

  it('says "the" mid-sentence and drops its own "The"', () => {
    const mill = new Room({ name: 'The Old Mill', description: 'd' })
    expect(mill.search(gameState())).toContain(
      'around the [room_name]Old Mill[/room_name],',
    )
  })

  it("takes no article when the subclass says the name is a person's own", () => {
    class Hut extends Room {
      /** Test override: named after a person. */
      protected override nameInSentence(options?: NameOptions): string {
        return super.nameInSentence({ ...options, bare: true })
      }
    }
    const hut = new Hut({ name: "Mira's Hut", description: 'd' })
    expect(hut.search(gameState())).toContain(
      "around [room_name]Mira's Hut[/room_name],",
    )
  })
})
