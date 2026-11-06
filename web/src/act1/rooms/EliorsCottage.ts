import { characterName, Room } from '@/engine'
import type { Exits, GameState } from '@/engine'
import { Bread } from '../items/Bread'
import { Hearth } from '../items/Hearth'
import { Lantern } from '../items/Lantern'
import { Grandmother } from '../characters/Grandmother'
import { FadedPhotograph } from '../items/FadedPhotograph'
import { FLAG_FOUND_PHOTO, FLAG_LANTERN_LIT } from '../Act1StoryFlags'
import { Scenery } from '../items/Scenery'

/** The table clause while the loaf still cools on it. */
const LOAF_ON_TABLE = ', with a small loaf cooling on it,'

/** The light sentence while the lantern is still dark. */
const DARK_CORNER =
  'The curtains are still drawn on a grey morning, and the corner by your ' +
  'bed is too dark to see into. '

/** The light sentence once the lantern has been lit, wherever it is now. */
const GREY_MORNING =
  'Grey morning comes through the lace curtains onto shelves lined with ' +
  'trinkets and memories. '

/** The cottage's room text, with the light sentence and table clause given. */
function descriptionWith(lightSentence: string, tableClause: string): string {
  return (
    'A modest cottage with a straw roof and a cozy hearth. ' +
    'The scent of fresh bread and old books fills the air. ' +
    lightSentence +
    'A sturdy wooden ' +
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
 * names the loaf on the table only while the bread is still in the room, and
 * the dark corner by the bed until the lantern has been lit.
 */
export class EliorsCottage extends Room {
  constructor() {
    super({
      name: "Elior's Cottage",
      description: descriptionWith(DARK_CORNER, LOAF_ON_TABLE),
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

  /**
   * The room text: the dark corner until the lantern is lit, and the loaf on
   * the table only while it lies there.
   */
  override descriptionFor(gameState: GameState): string {
    const loafOnTable = this.items.some((item) => item instanceof Bread)
    const lit = gameState.getStoryFlag(FLAG_LANTERN_LIT)
    return descriptionWith(
      lit ? GREY_MORNING : DARK_CORNER,
      loafOnTable ? LOAF_ON_TABLE : ',',
    )
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
