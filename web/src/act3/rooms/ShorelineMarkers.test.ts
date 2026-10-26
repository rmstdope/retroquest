import { describe, it, expect, beforeEach } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import {
  executeCommands,
  expectItemInRoom,
  expectItemInInventory,
} from '@/testing/gameHelpers'

const SHARDS = 'Moon Rune Shards'

/**
 * Tests for searching the steles and collecting Moon Rune Shards. Tests jump
 * the game state directly to the Shoreline Markers room so that the suite
 * focuses on room mechanics.
 */
describe('Shoreline Markers', () => {
  let game: Game

  beforeEach(() => {
    game = new Game([new Act3()])
    // Focus tests on the Shoreline Markers
    game.state.currentRoom = game.state.allRooms.ShorelineMarkers
  })

  it('reveals the moon rune shards on search and lets them be taken', () => {
    expectItemInRoom(game.state.currentRoom, SHARDS, false)
    expectItemInInventory(game.state, SHARDS, false)

    const out = executeCommands(game, ['search'])
    expect(
      out.toLowerCase().includes('moon') || out.toLowerCase().includes('shard'),
    ).toBe(true)

    expectItemInRoom(game.state.currentRoom, SHARDS, true)

    executeCommands(game, ['take moon rune shards'])
    expectItemInInventory(game.state, SHARDS, true)
  })

  it('does not create duplicate shards on repeated searches', () => {
    const first = executeCommands(game, ['search'])
    expect(
      first.toLowerCase().includes('moon') ||
        first.toLowerCase().includes('shard'),
    ).toBe(true)

    const second = executeCommands(game, ['search'])
    expect(
      second.toLowerCase().includes('already') ||
        second.toLowerCase().includes('again'),
    ).toBe(true)

    // Only one instance should be present
    const items = game.state.currentRoom.items.map((i) => i.name)
    expect(items.filter((n) => n === SHARDS)).toHaveLength(1)
  })

  it('does not recreate the shards after they were removed', () => {
    // Reveal shards via search
    game.state.currentRoom.search(game.state)
    let itemsHere = game.state.currentRoom.items
    expect(itemsHere.some((i) => i.name === SHARDS)).toBe(true)

    // Remove shards from room and ensure not in inventory
    game.state.currentRoom.removeItem(SHARDS)
    game.state.removeAllItemsFromInventory(SHARDS)
    itemsHere = game.state.currentRoom.items
    expect(itemsHere.some((i) => i.name === SHARDS)).toBe(false)
    expect(game.state.getItemCount(SHARDS)).toBe(0)

    // Subsequent search should not recreate shards
    const out = game.state.currentRoom.search(game.state)
    expect(
      out.toLowerCase().includes('already') ||
        out.toLowerCase().includes('again'),
    ).toBe(true)
    itemsHere = game.state.currentRoom.items
    expect(itemsHere.some((i) => i.name === SHARDS)).toBe(false)
  })
})
