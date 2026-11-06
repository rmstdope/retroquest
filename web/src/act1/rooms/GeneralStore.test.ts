import { describe, it, expect } from 'vitest'
import { Game, GameController } from '@/engine'
import { Act1 } from '../Act1'
import {
  FLAG_PATCHES_FOUND,
  FLAG_PATCHES_RETURNED,
  FLAG_PATCHES_STAYED_WITH_GRANDMOTHER,
  FLAG_RUSTY_HOE_SECOND_COIN_FOUND,
  TRIGGER_PATCHES_RETURNS,
} from '../Act1StoryFlags'
import { GeneralStore } from './GeneralStore'
import { Coin } from '../items/Coin'

const SHUT =
  'A cluttered shop with the shutters half down. Rope, apples and ' +
  'trinkets crowd the shelves in the gloom. [character_name]Hemlock[/character_name] ' +
  'stands at the window, watching the lane to the chapel.'
const OPEN =
  'A cluttered shop. Rope, apples and trinkets crowd the shelves, ' +
  'and the air smells of fruit, wax and old wood. ' +
  'Outside, the lane runs east to the chapel. [character_name]Hemlock[/character_name] ' +
  'dusts jars between customers'
const CAT = ', and every so often looks at the counter, where his cat sleeps.'

/** The store's room text in a fresh game with the given flags set. */
function storeText(...flags: string[]): string {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.GeneralStore
  flags.forEach((flag) => game.state.setStoryFlag(flag, true))
  return new GameController(game).getRoomDescription()
}

describe('General Store ways out (rq-un37)', () => {
  it('leads west to the square, east to the chapel and south to the forge', () => {
    const game = new Game([new Act1()])
    const store = game.state.allRooms.GeneralStore
    expect(store.getExits(game.state)).toEqual({
      west: 'VillageSquare',
      east: 'VillageChapel',
      south: 'BlacksmithsForge',
    })
  })
})

describe('General Store room text', () => {
  it("never puts the priest's matches on the shelves (rq-03s1)", () => {
    expect(storeText()).not.toContain('matches')
    expect(storeText(FLAG_PATCHES_RETURNED)).not.toContain('matches')
  })

  it('shows the shut text while Patches is missing', () => {
    expect(storeText()).toBe(SHUT)
  })

  it('mentions the sleeping cat when Patches is on the counter', () => {
    expect(storeText(FLAG_PATCHES_RETURNED)).toBe(OPEN + CAT)
  })

  it('drops the cat when Patches stayed with Grandmother', () => {
    expect(storeText(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER)).toBe(OPEN + '.')
  })

  it('drops the cat when the hoe second coin opened the store', () => {
    expect(storeText(FLAG_RUSTY_HOE_SECOND_COIN_FOUND)).toBe(OPEN + '.')
  })

  it('switches in the same game the moment the store opens', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.GeneralStore
    const controller = new GameController(game)
    expect(controller.getRoomDescription()).toBe(SHUT)
    game.state.setStoryFlag(FLAG_PATCHES_RETURNED, true)
    expect(controller.getRoomDescription()).toBe(OPEN + CAT)
  })
})

describe("General Store room text after Hemlock's last rope (rq-25qz)", () => {
  it('stops naming rope on the shelves once the rope is sold', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.GeneralStore
    game.state.setStoryFlag(FLAG_PATCHES_RETURNED, true)
    game.state.addItemToInventory(new Coin())
    game.commandParser.parse('buy rope from shopkeeper')

    const text = new GameController(game).getRoomDescription()

    expect(text).toContain('Apples and trinkets crowd the shelves')
    expect(text).not.toMatch(/rope/i)
  })

  it('stops naming rope on the shelves once the rope is given', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.GeneralStore
    game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)
    game.state.setStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER, true)
    game.commandParser.parse('talk to shopkeeper')

    const text = new GameController(game).getRoomDescription()

    expect(text).toBe(
      OPEN.replace('Rope, apples and trinkets', 'Apples and trinkets') + '.',
    )
  })

  it('stops putting rope beside the trinkets once the rope is sold', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.GeneralStore
    game.state.setStoryFlag(FLAG_PATCHES_RETURNED, true)
    expect(game.commandParser.parse('examine shelves')).toContain(
      'Between the rope and the apples',
    )
    game.state.addItemToInventory(new Coin())
    game.commandParser.parse('buy rope from shopkeeper')

    const line = game.commandParser.parse('examine shelves')

    expect(line).toContain('Beside the apples sit trinkets')
    expect(line).not.toMatch(/rope/i)
  })

  it('still names the rope while it is on the shelf', () => {
    expect(storeText(FLAG_PATCHES_RETURNED)).toContain(
      'Rope, apples and trinkets',
    )
  })
})

describe('General Store sound', () => {
  /** The store's sound state in a fresh game with the given flags set. */
  function storeSound(...flags: string[]): string {
    const game = new Game([new Act1()])
    flags.forEach((flag) => game.state.setStoryFlag(flag, true))
    return game.state.allRooms.GeneralStore.soundState(game.state)
  }

  it('has the cat purring only once Patches is home on the counter', () => {
    expect(storeSound()).toBe('')
    expect(storeSound(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER)).toBe('')
    expect(storeSound(FLAG_PATCHES_RETURNED)).toBe(GeneralStore.SOUND_CAT_HOME)
  })
})

describe('General Store sound triggers', () => {
  it('declares the one the shopkeeper fires as Patches comes home', () => {
    expect(new GeneralStore().soundTriggers()).toEqual([
      TRIGGER_PATCHES_RETURNS,
    ])
    expect(TRIGGER_PATCHES_RETURNS).toBe('patches-returns')
  })
})
