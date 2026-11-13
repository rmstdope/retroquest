import { describe, it, expect } from 'vitest'
import { Game, GameController, GameState, Room, type Exits } from '@/engine'
import { Act1 } from '../Act1'
import {
  FLAG_MAGIC_FULLY_UNLOCKED,
  FLAG_VEGETABLE_FIELD_WATERED,
} from '../Act1StoryFlags'
import { Grandmother } from '../characters/Grandmother'
import { FadedPhotograph } from '../items/FadedPhotograph'
import { PurifySpell } from '../spells/PurifySpell'
import { ReviveSpell } from '../spells/ReviveSpell'
import { AbandonedShed } from './AbandonedShed'
import { BlacksmithsForge } from './BlacksmithsForge'
import { ChickenCoop } from './ChickenCoop'
import { EliorsCottage } from './EliorsCottage'
import { ForestPath } from './ForestPath'
import { GeneralStore } from './GeneralStore'
import { HiddenGlade } from './HiddenGlade'
import { MirasHut } from './MirasHut'
import { OldMill } from './OldMill'
import { Riverbank } from './Riverbank'
import { RoadToGreendale } from './RoadToGreendale'
import { VegetableField } from './VegetableField'
import { VillageChapel } from './VillageChapel'
import { VillageSquare } from './VillageSquare'
import { VillageWell } from './VillageWell'
import { Well } from '../items/Well'
import { Rope } from '../items/Rope'
import { Bucket } from '../items/Bucket'

/** A game state knowing the given spells, for exit checks. */
function stateWithSpells(spells: string[]): GameState {
  const state = new GameState(
    new Room({ name: 'Nowhere', description: '' }),
    {},
    [],
  )
  if (spells.includes('revive')) state.learnSpell(new ReviveSpell())
  return state
}

const ROOM_CLASSES = {
  EliorsCottage,
  VegetableField,
  ChickenCoop,
  VillageSquare,
  MirasHut,
  BlacksmithsForge,
  GeneralStore,
  VillageWell,
  AbandonedShed,
  OldMill,
  Riverbank,
  ForestPath,
  HiddenGlade,
  VillageChapel,
  RoadToGreendale,
}

type RoomKey = keyof typeof ROOM_CLASSES

function allRooms(): Record<RoomKey, Room> {
  return Object.fromEntries(
    Object.entries(ROOM_CLASSES).map(([key, Cls]) => [key, new Cls()]),
  ) as Record<RoomKey, Room>
}

const OPPOSITE: Exits = {
  north: 'south',
  south: 'north',
  east: 'west',
  west: 'east',
}

describe("Elior's Cottage exits", () => {
  it('are locked before learning revive', () => {
    expect(new EliorsCottage().getExits(stateWithSpells([]))).toEqual({})
  })

  it('open once revive is known, from the state alone', () => {
    const exits = new EliorsCottage().getExits(stateWithSpells(['revive']))
    expect(exits).toHaveProperty('south')
    expect(exits).toHaveProperty('east')
  })
})

describe('Act 1 room graph', () => {
  it('reaches every room from every room', () => {
    const state = stateWithSpells(['revive'])
    const rooms = allRooms()
    const keys = Object.keys(rooms)
    const failures: string[] = []
    for (const start of keys) {
      const visited = new Set<string>()
      const queue: string[] = [start]
      while (queue.length > 0) {
        const current = queue.shift() as RoomKey
        if (visited.has(current)) continue
        visited.add(current)
        for (const dest of Object.values(rooms[current].getExits(state))) {
          if (!visited.has(dest) && dest in rooms) queue.push(dest)
        }
      }
      const missing = keys.filter((key) => !visited.has(key))
      if (missing.length > 0) {
        failures.push(`${start} cannot reach ${missing.join(', ')}`)
      }
    }
    expect(failures).toEqual([])
  })

  it('has every exit lead back', () => {
    const state = stateWithSpells(['revive'])
    const rooms = allRooms()
    const failures: string[] = []
    for (const [key, room] of Object.entries(rooms)) {
      for (const [direction, destKey] of Object.entries(room.getExits(state))) {
        if (!(direction in OPPOSITE)) continue
        if (!(destKey in rooms)) {
          failures.push(
            `${key} -> ${direction} -> ${destKey} is not an act 1 room`,
          )
          continue
        }
        const back =
          rooms[destKey as RoomKey].getExits(state)[OPPOSITE[direction]]
        if (back !== key) {
          failures.push(
            `${key} -> ${direction} -> ${destKey} does not lead back`,
          )
        }
      }
    }
    expect(failures).toEqual([])
  })
})

describe('Grandmother and the photograph', () => {
  it('returns the photo when it has not been examined yet', () => {
    const game = new Game([new Act1()])
    const photo = new FadedPhotograph()
    game.state.addItemToInventory(photo)

    new Grandmother().giveItem(game.state, photo)

    expect(game.state.inventory.map((i) => i.name.toLowerCase())).toContain(
      'faded photograph',
    )
  })
})

describe('Village Well description', () => {
  /** An Act I game with Elior at the well, which he has examined. */
  function gameAtWell(): Game {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.VillageWell
    game.commandParser.parse('examine well')
    return game
  }

  it('shows dark, foul water before the well is purified', () => {
    const game = gameAtWell()
    const description = game.state.currentRoom.describe(game.state)

    expect(description).toContain('dark and still')
    expect(description).not.toContain('crystalline')
    expect(description).not.toContain('rope')
  })

  it('shows clear water on the room card right after purify is cast', () => {
    const game = gameAtWell()
    game.state.learnSpell(new PurifySpell())
    game.state.setStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED, true)

    game.commandParser.parse('cast purify on well')

    const description = new GameController(game).getRoomDescription()
    expect(description).toContain('crystalline clarity')
    expect(description).not.toContain('dark and still')
  })

  it('shows clear water once the well is purified', () => {
    const game = gameAtWell()
    const well = game.state.currentRoom.getItemByName('well')
    expect(well).toBeInstanceOf(Well)
    if (well instanceof Well) well.purify(game.state)

    const description = game.state.currentRoom.describe(game.state)

    expect(description).toContain('crystalline clarity')
    expect(description).not.toContain('dark and still')
  })
})

describe('Old Mill description', () => {
  it('shows the whirring device until the rope jams it', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.OldMill
    game.state.addItemToInventory(new Rope())
    expect(new GameController(game).getRoomDescription()).toContain('whirring')

    game.commandParser.parse('use rope with mechanism')

    const description = new GameController(game).getRoomDescription()
    expect(description).toContain('jammed')
    expect(description).not.toContain('whirring')
  })
})

describe('Vegetable Field description', () => {
  it('shows the field green on the room card right after it is watered', () => {
    const game = new Game([new Act1()])
    const well = new Well()
    well.isPurified = true
    const bucket = new Bucket()
    bucket.useWith(game.state, well)
    game.state.addItemToInventory(bucket)
    game.state.currentRoom = game.state.allRooms.VegetableField

    game.commandParser.parse('use bucket')

    const description = new GameController(game).getRoomDescription()
    expect(description).toContain('green')
    expect(description).not.toContain('withered crops')
  })

  it('shows the field green after loading a save made once it was watered', () => {
    const game = new Game([new Act1()])
    game.state.setStoryFlag(FLAG_VEGETABLE_FIELD_WATERED, true)
    game.state.currentRoom = game.state.allRooms.VegetableField

    const description = game.state.currentRoom.describe(game.state)

    expect(description).toContain('green')
  })
})
