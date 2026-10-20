import { describe, it, expect } from 'vitest'
import type { Room } from '@/engine'
import { FortressGates } from './FortressGates'
import { OuterCourtyard } from './OuterCourtyard'
import { MirrorLabyrinth } from './MirrorLabyrinth'
import { HallOfEchoes } from './HallOfEchoes'
import { TowerOfShadows } from './TowerOfShadows'
import { ChamberOfWhispers } from './ChamberOfWhispers'
import { MemoryVault } from './MemoryVault'
import { ThroneChamberApproach } from './ThroneChamberApproach'
import { ThroneChamer } from './ThroneChamer'
import { RoyalGardens } from './RoyalGardens'

/** Map of direction to its opposite. */
const OPPOSITE: Record<string, string> = {
  north: 'south',
  south: 'north',
  east: 'west',
  west: 'east',
  up: 'down',
  down: 'up',
}

/** All room classes in Act 4. */
const ROOM_CLASSES: Record<string, new () => Room> = {
  FortressGates,
  OuterCourtyard,
  MirrorLabyrinth,
  HallOfEchoes,
  TowerOfShadows,
  ChamberOfWhispers,
  MemoryVault,
  ThroneChamberApproach,
  ThroneChamer,
  RoyalGardens,
}

describe('Act 4 rooms', () => {
  it('has bidirectional exits everywhere', () => {
    // Create instances of all rooms
    const rooms: Record<string, Room> = {}
    for (const [className, RoomClass] of Object.entries(ROOM_CLASSES)) {
      rooms[className] = new RoomClass()
    }

    // Check each room's exits
    for (const [roomName, room] of Object.entries(rooms)) {
      for (const [direction, destinationName] of Object.entries(room.exits)) {
        // Check if destination room exists
        expect(
          destinationName in rooms,
          `Room ${roomName} has exit ${direction} to ${destinationName}, ` +
            `but ${destinationName} room class doesn't exist`,
        ).toBe(true)

        const destinationRoom = rooms[destinationName]
        const oppositeDirection = OPPOSITE[direction]

        // Check if the destination has a return path
        expect(
          oppositeDirection in destinationRoom.exits,
          `Room ${roomName} has exit ${direction} to ${destinationName}, ` +
            `but ${destinationName} has no ${oppositeDirection} exit back`,
        ).toBe(true)

        // Check if the return path leads back to the original room
        const returnDestination = destinationRoom.exits[oppositeDirection]
        expect(
          returnDestination,
          `Room ${roomName} has exit ${direction} to ${destinationName}, ` +
            `but ${destinationName} has ${oppositeDirection} exit to ` +
            `${returnDestination} instead of ${roomName}`,
        ).toBe(roomName)
      }
    }
  })
})
