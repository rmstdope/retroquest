import { Room } from '@/engine'
import type { Exits, GameState } from '@/engine'
import { Lantern } from '../items/Lantern'
import { Grandmother } from '../characters/Grandmother'
import { FadedPhotograph } from '../items/FadedPhotograph'
import { FLAG_FOUND_PHOTO } from '../Act1StoryFlags'

/**
 * Elior's Cottage room: tutorial sanctuary with gated exits and first search reward.
 *
 * Exits stay hidden until the player has learned the `revive` spell; the first
 * search spawns a FadedPhotograph and sets FLAG_FOUND_PHOTO.
 */
export class EliorsCottage extends Room {
  constructor() {
    super({
      name: "Elior's Cottage",
      description:
        'A modest cottage with a straw roof and a cozy hearth. ' +
        'The scent of fresh bread and old books fills the air. ' +
        'Sunlight filters through lace curtains, illuminating ' +
        'shelves lined with trinkets and memories. A sturdy wooden ' +
        'table sits in the center, and a gentle fire crackles in the ' +
        'hearth. Grandmother hums softly in her rocking chair, her ' +
        'eyes twinkling with wisdom and warmth.',
      items: [new Lantern()],
      characters: [new Grandmother()],
      exits: {},
    })
  }

  /** Exits are unlocked once the player has learned the `revive` spell. */
  override getExits(gameState: GameState): Exits {
    if (gameState.hasSpell('revive')) {
      return { south: 'VegetableField', east: 'VillageSquare' }
    }
    return {}
  }

  /** The first search spawns a FadedPhotograph and sets FLAG_FOUND_PHOTO. */
  override search(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_FOUND_PHOTO)) {
      const photo = new FadedPhotograph()
      this.items.push(photo)
      gameState.setStoryFlag(FLAG_FOUND_PHOTO, true)
      return (
        'You search the cottage thoroughly and discover a ' +
        `[item_name]${photo.name}[/item_name] hidden in a drawer.`
      )
    }
    return 'You search the cottage but find nothing new.'
  }
}
