import { Item, clue, type GameState } from '@/engine'
import { BrokenShovel } from './BrokenShovel'
import { MothersLetter } from './MothersLetter'
import {
  FLAG_FISHERMAN_TOLD_OF_TIN,
  FLAG_FOUND_MOTHERS_LETTER,
} from '../Act1StoryFlags'

/**
 * The broad stone bedded at the water's edge of the river bend. It stays where
 * it is; Elior's mother hid a tin in the mud beneath it. Once the fisherman has
 * told of the tin, searching the bank, lifting the stone or digging at it with
 * the broken shovel all uncover it (see uncoverTin).
 */
export class SmoothStone extends Item {
  constructor() {
    super({
      name: 'smooth stone',
      description:
        "A broad, flat stone at the water's edge, polished smooth by the river's " +
        'current. It sits snugly in the mud, as if it has always been there.',
      shortName: 'stone',
    })
  }

  /**
   * Uncovers the mother's tin once the fisherman has told of it and it has not
   * been found yet: leaves the MothersLetter in the current room, sets
   * FLAG_FOUND_MOTHERS_LETTER and tells the find. Returns '' otherwise.
   */
  uncoverTin(gameState: GameState): string {
    if (
      !gameState.getStoryFlag(FLAG_FISHERMAN_TOLD_OF_TIN) ||
      gameState.getStoryFlag(FLAG_FOUND_MOTHERS_LETTER)
    ) {
      return ''
    }
    const letter = new MothersLetter()
    gameState.currentRoom.items.push(letter)
    gameState.setStoryFlag(FLAG_FOUND_MOTHERS_LETTER, true)
    return (
      'You tip the [item_name]smooth stone[/item_name] aside and dig into ' +
      'the cold mud beneath it. Your fingers close on a small tin, sealed ' +
      'with wax. Inside, wrapped in oilcloth, lies a ' +
      `[item_name]${letter.name}[/item_name].`
    )
  }

  /**
   * The stone belongs to the bend and is never carried off, even in older
   * saves; lifting it once the fisherman has told of the tin uncovers it.
   */
  override preventPickup(gameState: GameState): string {
    return (
      this.uncoverTin(gameState) ||
      clue(
        'You lift the [item_name]smooth stone[/item_name] a little, ' +
          'then set it back. It belongs here, at the bend of the river.',
      )
    )
  }

  /** Digging at the stone with the broken shovel uncovers the tin once the fisherman has told of it. */
  override answerUseFrom(gameState: GameState, item: Item): string {
    if (item instanceof BrokenShovel) return this.uncoverTin(gameState)
    return ''
  }
}
