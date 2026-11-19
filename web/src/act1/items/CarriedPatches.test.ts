import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../Act1'
import { Key } from './Key'
import { Fish } from './Fish'
import { CarriedPatches } from './CarriedPatches'
import { Patches } from '../characters/Patches'
import {
  FLAG_PATCHES_RETURNED,
  FLAG_PATCHES_STAYED_WITH_GRANDMOTHER,
} from '../Act1StoryFlags'

/** Whether the room holds Patches as a character. */
function catIn(game: Game, roomKey: string): boolean {
  return game.state.allRooms[roomKey].characters.some(
    (c) => c instanceof Patches,
  )
}

/** An Act I game where Patches has just been coaxed out of the shed. */
function gameCarrying(): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.AbandonedShed
  game.state.addItemToInventory(new Fish())
  game.state.addItemToInventory(new Key())
  game.commandParser.parse('use key with door')
  game.commandParser.parse('talk to patches')
  return game
}

describe('CarriedPatches', () => {
  it('rides first in the bag once she is scooped up', () => {
    const game = gameCarrying()
    expect(game.state.inventory[0]).toBeInstanceOf(CarriedPatches)
    expect(game.state.inventory[0].name).toBe('Patches')
  })

  it('is listed plainly by the typed inventory', () => {
    const game = gameCarrying()
    expect(game.commandParser.parse('inventory')).toContain(
      '- [item_name]Patches[/item_name]',
    )
  })

  it('tucks her head for anything she is used with but the two homes', () => {
    const game = gameCarrying()
    const answer = game.commandParser.parse('use patches with fish')
    expect(answer).toContain(
      'Patches tucks her head under your chin. ' +
        'She has had enough of strangers for one day.',
    )
  })

  it('tucks her head for a person who is not one of her homes', () => {
    const game = gameCarrying()
    game.state.currentRoom = game.state.allRooms.Riverbank
    const answer = game.commandParser.parse('use patches with fisherman')
    expect(answer).toContain('Patches tucks her head under your chin.')
    expect(game.state.inventory[0]).toBeInstanceOf(CarriedPatches)
  })

  it('sniffs a thing used with her', () => {
    const game = gameCarrying()
    const answer = game.commandParser.parse('use fish with patches')
    expect(answer).toContain(
      'Patches sniffs it, then settles back into your arms.',
    )
  })

  it('has no verbs of her own but Use with and Examine', () => {
    expect(new CarriedPatches().ringVerbs()).toEqual([])
  })
})

describe('handing CarriedPatches over', () => {
  it('welcomes her home when she is used with Hemlock', () => {
    const game = gameCarrying()
    game.state.currentRoom = game.state.allRooms.GeneralStore
    const answer = game.commandParser.parse('use patches with hemlock')
    expect(answer).toContain('You found her!')
    expect(game.state.getStoryFlag(FLAG_PATCHES_RETURNED)).toBe(true)
    expect(game.state.inventory.some((i) => i instanceof CarriedPatches)).toBe(
      false,
    )
    expect(catIn(game, 'GeneralStore')).toBe(true)
  })

  it('lets her stay when she is used with Grandmother', () => {
    const game = gameCarrying()
    game.state.currentRoom = game.state.allRooms.EliorsCottage
    const answer = game.commandParser.parse('use patches with grandmother')
    expect(answer).toContain("that's settled")
    expect(game.state.getStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER)).toBe(
      true,
    )
    expect(game.state.inventory.some((i) => i instanceof CarriedPatches)).toBe(
      false,
    )
    expect(catIn(game, 'EliorsCottage')).toBe(true)
  })

  it('still lets talking to Hemlock or saying stay hand her over', () => {
    const a = gameCarrying()
    a.state.currentRoom = a.state.allRooms.GeneralStore
    a.commandParser.parse('talk to hemlock')
    expect(a.state.inventory.some((i) => i instanceof CarriedPatches)).toBe(
      false,
    )
    const b = gameCarrying()
    b.state.currentRoom = b.state.allRooms.EliorsCottage
    b.commandParser.parse('say stay to grandmother')
    expect(b.state.inventory.some((i) => i instanceof CarriedPatches)).toBe(
      false,
    )
  })
})

describe('CarriedPatches in saves', () => {
  it('is back in the first pocket after a reload while carried', () => {
    const game = gameCarrying()
    const fresh = new Game([new Act1()])
    fresh.loadSaveData(game.toSaveData())
    expect(fresh.state.inventory[0]).toBeInstanceOf(CarriedPatches)
    expect(
      fresh.state.inventory.filter((i) => i instanceof CarriedPatches),
    ).toHaveLength(1)
  })

  it('is given to a save made before she had a pocket', () => {
    const game = gameCarrying()
    CarriedPatches.release(game.state)
    const fresh = new Game([new Act1()])
    fresh.loadSaveData(game.toSaveData())
    expect(fresh.state.inventory[0]).toBeInstanceOf(CarriedPatches)
  })

  it('is not in a save made after the handover', () => {
    const game = gameCarrying()
    game.state.currentRoom = game.state.allRooms.GeneralStore
    game.commandParser.parse('use patches with hemlock')
    const fresh = new Game([new Act1()])
    fresh.loadSaveData(game.toSaveData())
    expect(fresh.state.inventory.some((i) => i instanceof CarriedPatches)).toBe(
      false,
    )
  })
})
