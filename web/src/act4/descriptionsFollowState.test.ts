import { describe, it, expect } from 'vitest'
import { Game, GameController } from '@/engine'
import { Act4 } from './Act4'
import {
  FLAG_ACT4_CHAIN_GIVEN,
  FLAG_ACT4_ELIXIR_ON_KING,
  FLAG_ACT4_ELIXIR_ON_MALAKAR,
  FLAG_ACT4_MEMORY_ORBS_MENDED,
  FLAG_ACT4_PARENTS_LEGACY_COMPLETED,
  FLAG_ACT4_REDEMPTION_ENDING,
  FLAG_ACT4_SERVANTS_FREED,
  FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED,
  FLAG_ACT4_THRONE_AMULET_OPENED,
  FLAG_ACT4_THRONE_REFRAIN_SAID,
} from './Act4StoryFlags'
import {
  THRONE_CHAMBER_AMULET,
  THRONE_CHAMBER_HEALED,
  THRONE_CHAMBER_REDEMPTION,
  THRONE_CHAMBER_SHATTERED,
} from './rooms/throneDescriptions'
import {
  COURTYARD_AFTER_DESCRIPTION,
  COURTYARD_CAPTAIN_GONE_DESCRIPTION,
} from './rooms/courtyardDescriptions'
import { CHAMBER_AFTER_REDEMPTION } from './rooms/chamberDescriptions'
import {
  MEMORY_VAULT_AFTER,
  PARENTS_VAULT_AFTER,
} from './rooms/vaultDescriptions'

/** What a room says for itself in the game's current state. */
function look(game: Game, room: string): string {
  return game.state.allRooms[room].descriptionFor(game.state)
}

describe('Act IV rooms describe the state they are in, never rewriting their saved text', () => {
  it.each([
    ['ThroneChamber', FLAG_ACT4_THRONE_AMULET_OPENED, THRONE_CHAMBER_AMULET],
    ['ThroneChamber', FLAG_ACT4_ELIXIR_ON_MALAKAR, THRONE_CHAMBER_HEALED],
    ['ThroneChamber', FLAG_ACT4_ELIXIR_ON_KING, THRONE_CHAMBER_SHATTERED],
    ['ThroneChamber', FLAG_ACT4_REDEMPTION_ENDING, THRONE_CHAMBER_REDEMPTION],
    ['OuterCourtyard', FLAG_ACT4_SERVANTS_FREED, COURTYARD_AFTER_DESCRIPTION],
    [
      'OuterCourtyard',
      FLAG_ACT4_CHAIN_GIVEN,
      COURTYARD_CAPTAIN_GONE_DESCRIPTION,
    ],
    [
      'ChamberOfWhispers',
      FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED,
      CHAMBER_AFTER_REDEMPTION,
    ],
    ['ParentsVault', FLAG_ACT4_PARENTS_LEGACY_COMPLETED, PARENTS_VAULT_AFTER],
    ['MemoryVault', FLAG_ACT4_MEMORY_ORBS_MENDED, MEMORY_VAULT_AFTER],
  ])('%s after %s', (room, flag, text) => {
    const game = new Game([new Act4()])
    const saved = game.state.allRooms[room].description
    game.state.setStoryFlag(flag, true)
    expect(look(game, room)).toBe(text)
    expect(game.state.allRooms[room].description).toBe(saved)
  })
})

describe('the Bag and examine agree on the amulet', () => {
  it.each([
    [[]],
    [[FLAG_ACT4_MEMORY_ORBS_MENDED]],
    [[FLAG_ACT4_MEMORY_ORBS_MENDED, FLAG_ACT4_THRONE_REFRAIN_SAID]],
    [[FLAG_ACT4_REDEMPTION_ENDING]],
  ])('with flags %j', (flags) => {
    const game = new Game([new Act4()])
    for (const flag of flags) game.state.setStoryFlag(flag, true)
    const amulet = game.state.inventory.find((i) => i.name === 'ancient amulet')
    const note = new GameController(game)
      .getInventory()
      .find((entry) => entry.name.includes('ancient amulet'))?.description
    expect(note).toBe(amulet?.examine(game.state))
  })
})
