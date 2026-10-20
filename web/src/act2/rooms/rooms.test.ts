import { describe, it, expect } from 'vitest'
import { GameState, Room, type Exits } from '@/engine'
import { MountainPath } from './MountainPath'
import { GreendaleGates } from './GreendaleGates'
import { MainSquare } from './MainSquare'
import { MarketDistrict } from './MarketDistrict'
import { SilverStagInn } from './SilverStagInn'
import { InnRooms } from './InnRooms'
import { MerchantsWarehouse } from './MerchantsWarehouse'
import { CastleApproach } from './CastleApproach'
import { CastleCourtyard } from './CastleCourtyard'
import { GreatHall } from './GreatHall'
import { ResidentialQuarter } from './ResidentialQuarter'
import { HealersHouse } from './HealersHouse'
import { HiddenLibrary } from './HiddenLibrary'
import { ForestTransition } from './ForestTransition'
import { ForestEntrance } from './ForestEntrance'
import { AncientGrove } from './AncientGrove'
import { WhisperingGlade } from './WhisperingGlade'
import { HeartOfTheForest } from './HeartOfTheForest'

/** A game state with no story flags set, for exit checks. */
function emptyState(): GameState {
  return new GameState(new Room({ name: 'Nowhere', description: '' }), {}, [])
}

const ROOM_CLASSES = {
  MountainPath,
  GreendaleGates,
  MainSquare,
  MarketDistrict,
  SilverStagInn,
  InnRooms,
  MerchantsWarehouse,
  CastleApproach,
  CastleCourtyard,
  GreatHall,
  ResidentialQuarter,
  HealersHouse,
  HiddenLibrary,
  ForestTransition,
  ForestEntrance,
  AncientGrove,
  WhisperingGlade,
  HeartOfTheForest,
}

type RoomKey = keyof typeof ROOM_CLASSES

const ROOM_ENTRIES = Object.entries(ROOM_CLASSES) as [
  RoomKey,
  (typeof ROOM_CLASSES)[RoomKey],
][]

function allRooms(): Record<RoomKey, Room> {
  return Object.fromEntries(
    ROOM_ENTRIES.map(([key, Cls]) => [key, new Cls()]),
  ) as Record<RoomKey, Room>
}

/** Exits that are not expected to lead to another Act 2 room. */
const SPECIAL_EXITS = ['secret_passage', 'upstairs', 'downstairs']

const DIRECTION_OPPOSITES: Exits = {
  north: 'south',
  south: 'north',
  east: 'west',
  west: 'east',
}

/** Unlock the inn's exits, as the Python test did through use_key. */
function unlockInn(room: Room): void {
  if (room instanceof SilverStagInn) room.useKey()
}

describe('Act 2 rooms', () => {
  it.each(ROOM_ENTRIES)('creates %s without errors', (_roomName, RoomClass) => {
    const room = new RoomClass()
    expect(room).not.toBeNull()
    expect(room.name).not.toBeNull()
    expect(room.description).not.toBeNull()
    expect(room).toHaveProperty('items')
    expect(room).toHaveProperty('characters')
    expect(room).toHaveProperty('exits')
  })

  it('has valid exits in every room', () => {
    const validRoomNames = new Set<string>(Object.keys(ROOM_CLASSES))
    const state = emptyState()

    for (const [roomName, RoomClass] of ROOM_ENTRIES) {
      const room = new RoomClass()
      const exits = room.getExits(state)
      for (const [direction, targetRoom] of Object.entries(exits)) {
        if (SPECIAL_EXITS.includes(direction)) continue
        expect(
          validRoomNames.has(targetRoom),
          `Room ${roomName} has invalid exit to ${targetRoom}`,
        ).toBe(true)
      }
    }
  })

  it('connects rooms bidirectionally where expected', () => {
    const rooms = allRooms()

    for (const [roomName, room] of Object.entries(rooms) as [RoomKey, Room][]) {
      for (const [direction, targetRoomName] of Object.entries(room.exits)) {
        if (!(direction in DIRECTION_OPPOSITES) || !(targetRoomName in rooms))
          continue
        const targetRoom = rooms[targetRoomName as RoomKey]
        const oppositeDirection = DIRECTION_OPPOSITES[direction]

        if (
          roomName === 'SilverStagInn' ||
          targetRoomName === 'SilverStagInn'
        ) {
          unlockInn(room)
          unlockInn(targetRoom)
        }

        expect(
          oppositeDirection in targetRoom.exits,
          `Room ${targetRoomName} should have ${oppositeDirection} exit back to ${roomName}`,
        ).toBe(true)
        expect(
          targetRoom.exits[oppositeDirection],
          `Room ${targetRoomName}'s ${oppositeDirection} exit should lead to ${roomName}`,
        ).toBe(roomName)
      }
    }
  })

  it('gives every room a non-empty description', () => {
    for (const [roomName, RoomClass] of ROOM_ENTRIES) {
      const room = new RoomClass()
      expect(
        room.description.trim().length,
        `Room ${roomName} has empty description`,
      ).toBeGreaterThan(0)
    }
  })

  it('names rooms as expected', () => {
    const expectedNames: Record<RoomKey, string> = {
      MountainPath: 'Mountain Path',
      GreendaleGates: 'Greendale Gates',
      MainSquare: 'Main Square',
      MarketDistrict: 'Market District',
      SilverStagInn: 'The Silver Stag Inn',
      InnRooms: 'Inn Rooms',
      MerchantsWarehouse: "Merchant's Warehouse",
      CastleApproach: 'Castle Approach',
      CastleCourtyard: 'Castle Courtyard',
      GreatHall: 'Great Hall',
      ResidentialQuarter: 'Residential Quarter',
      HealersHouse: "Healer's House",
      HiddenLibrary: 'Hidden Library',
      ForestTransition: 'Forest Transition',
      ForestEntrance: 'Forest Entrance',
      AncientGrove: 'Ancient Grove',
      WhisperingGlade: 'Whispering Glade',
      HeartOfTheForest: 'Heart of the Forest',
    }

    for (const [className, RoomClass] of ROOM_ENTRIES) {
      const room = new RoomClass()
      const expectedName = expectedNames[className]
      expect(
        room.name,
        `Room ${className} should have name '${expectedName}', got '${room.name}'`,
      ).toBe(expectedName)
    }
  })
})
