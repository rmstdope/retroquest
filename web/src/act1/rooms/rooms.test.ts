import { describe, it, expect } from 'vitest'
import { Game, GameState, Room, type Exits } from '@/engine'
import { Act1 } from '../Act1'
import { Grandmother } from '../characters/Grandmother'
import { FadedPhotograph } from '../items/FadedPhotograph'
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
  it.each(Object.keys(ROOM_CLASSES) as RoomKey[])(
    'reaches every room from %s',
    (start) => {
      const state = stateWithSpells(['revive'])
      const rooms = allRooms()
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
      expect([...visited].sort()).toEqual(Object.keys(rooms).sort())
    },
  )

  it.each(Object.keys(ROOM_CLASSES) as RoomKey[])(
    '%s exits lead back',
    (key) => {
      const state = stateWithSpells(['revive'])
      const rooms = allRooms()
      for (const [direction, destKey] of Object.entries(
        rooms[key].getExits(state),
      )) {
        if (!(direction in OPPOSITE)) continue
        const back =
          rooms[destKey as RoomKey].getExits(state)[OPPOSITE[direction]]
        expect(back, `${key} -> ${direction} -> ${destKey} leads back`).toBe(
          key,
        )
      }
    },
  )
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
