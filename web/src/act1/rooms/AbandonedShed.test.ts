import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { Act1 } from '../Act1'
import { Key } from '../items/Key'
import { Lantern } from '../items/Lantern'
import { LightSpell } from '../spells/LightSpell'
import { expectItemInRoom } from '@/testing/gameHelpers'
import { AbandonedShed } from './AbandonedShed'

/** An Act I game with Elior inside the unlocked shed, holding nothing else. */
function gameInUnlockedShed(): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.AbandonedShed
  game.state.addItemToInventory(new Key())
  game.commandParser.parse('use key with door')
  return game
}

/** A lantern, lit when asked. */
function lantern(game: Game, lit: boolean): Lantern {
  const lamp = new Lantern()
  if (lit) {
    lamp.name = 'lantern (lit)'
    lamp.shortName = 'lantern'
  }
  game.state.addItemToInventory(lamp)
  return lamp
}

describe('Searching the dark Abandoned Shed', () => {
  it('finds nothing without a light, but sees the cat’s eyes', () => {
    const game = gameInUnlockedShed()
    const answer = game.commandParser.parse('search')
    expect(answer).toContain('too dark to rummage')
    expect(answer).toContain('green eyes')
    expect(findMarkupProblems(answer)).toEqual([])
    expectItemInRoom(game.state.currentRoom, 'fishing rod', false)
    expectItemInRoom(game.state.currentRoom, 'magnet', false)
  })

  it('stays dark with an unlit lantern', () => {
    const game = gameInUnlockedShed()
    lantern(game, false)
    expect(game.commandParser.parse('search')).toContain('too dark')
    expectItemInRoom(game.state.currentRoom, 'fishing rod', false)
  })

  it('finds the fishing rod and magnet by the light of a held lantern', () => {
    const game = gameInUnlockedShed()
    game.commandParser.parse('search')
    lantern(game, true)
    const answer = game.commandParser.parse('search')
    expect(answer).toContain('lantern')
    expect(findMarkupProblems(answer)).toEqual([])
    expectItemInRoom(game.state.currentRoom, 'fishing rod')
    expectItemInRoom(game.state.currentRoom, 'magnet')
  })

  it('can also be lit with the light spell', () => {
    const game = gameInUnlockedShed()
    game.state.learnSpell(new LightSpell())
    const answer = game.commandParser.parse('cast light')
    expect(answer).toContain('workbench')
    expect(findMarkupProblems(answer)).toEqual([])
    game.commandParser.parse('search')
    expectItemInRoom(game.state.currentRoom, 'fishing rod')
  })

  it('is not lit by a light spell cast outside the locked door', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.AbandonedShed
    game.state.learnSpell(new LightSpell())
    expect(game.commandParser.parse('cast light')).toContain('locked')
    game.state.addItemToInventory(new Key())
    game.commandParser.parse('use key with door')
    expect(game.commandParser.parse('search')).toContain('too dark')
  })

  it('lets Patches be coaxed out in the dark', () => {
    const game = gameInUnlockedShed()
    game.commandParser.parse('talk to patches')
    expect(game.state.getStoryFlag('patches_found')).toBe(true)
  })

  it('stays searched in a save made before the shed was dark', () => {
    const game = gameInUnlockedShed()
    const shed = game.state.currentRoom
    if (!(shed instanceof AbandonedShed)) throw new Error('not in the shed')
    shed.roomSearched = true
    const loaded = new Game([new Act1()])
    expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')

    const answer = loaded.commandParser.parse('search')

    expect(answer).not.toContain('too dark')
    expect(answer).toContain('nothing else')
  })
})

describe('The Abandoned Shed as a workshop', () => {
  it('opens onto an old workbench', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.AbandonedShed
    game.state.addItemToInventory(new Key())
    expect(game.commandParser.parse('use key with door')).toContain('workbench')
  })
})
