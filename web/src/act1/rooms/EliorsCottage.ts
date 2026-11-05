import { characterName, Room } from '@/engine'
import type { Exits, GameState } from '@/engine'
import { Bread } from '../items/Bread'
import { Hearth } from '../items/Hearth'
import { Lantern } from '../items/Lantern'
import { Grandmother } from '../characters/Grandmother'
import { FadedPhotograph } from '../items/FadedPhotograph'
import { FLAG_FOUND_PHOTO } from '../Act1StoryFlags'
import { Scenery } from '../items/Scenery'

/** The table clause while the loaf still cools on it. */
const LOAF_ON_TABLE = ', with a small loaf cooling on it,'

/** The cottage's room text, with the table clause given. */
function descriptionWith(tableClause: string): string {
  return (
    'A modest cottage with a straw roof and a cozy hearth. ' +
    'The scent of fresh bread and old books fills the air. ' +
    'Sunlight filters through lace curtains, illuminating ' +
    'shelves lined with trinkets and memories. A sturdy wooden ' +
    `table sits in the center${tableClause} and a gentle fire crackles in the ` +
    `hearth. ${characterName('Grandmother')} stands by it, humming, ` +
    'and keeps an eye on the bread.'
  )
}

/**
 * Elior's Cottage room: tutorial sanctuary with gated exits and first search reward.
 *
 * Exits stay hidden until the player has learned the `revive` spell; the first
 * search spawns a FadedPhotograph and sets FLAG_FOUND_PHOTO. The room text
 * names the loaf on the table only while the bread is still in the room.
 */
export class EliorsCottage extends Room {
  constructor() {
    super({
      name: "Elior's Cottage",
      description: descriptionWith(LOAF_ON_TABLE),
      items: [
        new Hearth(),
        new Lantern(),
        new Bread(),
        ...Scenery.forRoom('EliorsCottage'),
      ],
      characters: [new Grandmother()],
      exits: {},
    })
  }

  /** The room text, naming the loaf on the table only while it lies there. */
  override descriptionFor(_gameState: GameState): string {
    const loafOnTable = this.items.some((item) => item instanceof Bread)
    return descriptionWith(loafOnTable ? LOAF_ON_TABLE : ',')
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
