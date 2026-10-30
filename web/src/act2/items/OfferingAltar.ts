import { Item, characterName, type GameState } from '@/engine'
import { Nyx } from '../characters/Nyx'
import { DruidicCharm } from './DruidicCharm'
import { NaturesCharm } from './NaturesCharm'
import { ProtectiveCharm } from './ProtectiveCharm'

/** The altar's description; `Act2.afterLoad` restores it in older saves. */
export const OFFERING_ALTAR_DESCRIPTION =
  'An altar cut from one block of starstone, pale and speckled. Three ' +
  'hollows are carved in its top, and beside each a sign is cut: an oak ' +
  'leaf, a braid of grass, and a sword laid across a branch.'

/** A starstone altar where the three sacred charms can be placed to summon Nyx. */
export class OfferingAltar extends Item {
  constructor() {
    super({
      name: 'offering altar',
      description: OFFERING_ALTAR_DESCRIPTION,
    })
  }

  /**
   * Also answers to plain "altar", in code rather than a short name so that
   * saves made before this change reach it too.
   */
  override answersTo(name: string): boolean {
    return super.answersTo(name) || name.toLowerCase() === 'altar'
  }

  /**
   * Any item used with the altar gets the altar's answer, so a wrong item
   * fits none of the hollows whichever way round the player says it.
   */
  override answerUseFrom(gameState: GameState, item: Item): string {
    return this.useWith(gameState, item)
  }

  /** Use the offering altar with one of the three sacred charms to summon Nyx. */
  override useWith(gameState: GameState, other: Item): string {
    const isCharm = (item: Item): boolean =>
      item instanceof DruidicCharm ||
      item instanceof ProtectiveCharm ||
      item instanceof NaturesCharm
    // Check if the other item is one of the three sacred charms
    if (!isCharm(other)) {
      return (
        `${other.nameInSentence({ atStart: true })} fits none of the hollows. ` +
        'The runes stay dark.'
      )
    }
    // Check if player has all three sacred charms
    const hasDruidic = gameState.inventory.some(
      (item) => item instanceof DruidicCharm,
    )
    const hasProtective = gameState.inventory.some(
      (item) => item instanceof ProtectiveCharm,
    )
    const hasNatures = gameState.inventory.some(
      (item) => item instanceof NaturesCharm,
    )
    if (!(hasDruidic && hasProtective && hasNatures)) {
      return (
        `You set ${other.nameInSentence()} in its hollow, and the runes ` +
        'beside it wake. The others stay dark, and so do their hollows.'
      )
    }
    // Player has all three charms - complete the ritual!
    // Remove all three charms from inventory
    gameState.inventory = gameState.inventory.filter((item) => !isCharm(item))
    // Create and add Nyx to the current room if not already present
    const nyx = new Nyx()
    gameState.currentRoom.characters.push(nyx)
    const summonMessage =
      'The three charms sink into the starstone, and the runes light one ' +
      'after another. Above the altar the light gathers and stays, the ' +
      `height of a woman. ${characterName('Nyx')} has come.`
    return `[success]${summonMessage}[/success]`
  }
}
