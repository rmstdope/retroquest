import { describe, it, expect } from 'vitest'
import { Game, GameController } from '@/engine'
import { Act1 } from '../Act1'
import {
  FLAG_PATCHES_RETURNED,
  FLAG_PATCHES_STAYED_WITH_GRANDMOTHER,
  FLAG_RUSTY_HOE_SECOND_COIN_FOUND,
  TRIGGER_PATCHES_RETURNS,
} from '../Act1StoryFlags'
import { GeneralStore } from './GeneralStore'

const SHUT =
  'A cluttered shop with the shutters half down. Rope, apples, matches and ' +
  'trinkets crowd the shelves in the gloom. The [character_name]shopkeeper[/character_name] ' +
  'stands at the window, watching the lane.'
const OPEN =
  'A cluttered shop. Rope, apples, matches and trinkets crowd the shelves, ' +
  'and the air smells of fruit, wax and old wood. The [character_name]shopkeeper[/character_name] ' +
  'dusts jars between customers'
const CAT = ', and every so often looks at the counter, where his cat sleeps.'

/** The store's room text in a fresh game with the given flags set. */
function storeText(...flags: string[]): string {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.GeneralStore
  flags.forEach((flag) => game.state.setStoryFlag(flag, true))
  return new GameController(game).getRoomDescription()
}

describe('General Store room text', () => {
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
