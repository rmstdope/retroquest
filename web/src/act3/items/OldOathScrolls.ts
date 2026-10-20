import { Item, type GameState } from '@/engine'
import { FLAG_ACT3_OATH_SCROLLS_EXAMINED } from '../Act3StoryFlags'

/** Ancient scrolls containing binding oaths from ages past. */
export class OldOathScrolls extends Item {
  constructor() {
    super({
      name: 'Old Oath Scrolls',
      description:
        'Weathered parchment scrolls bound with golden thread that shimmer with ' +
        'an inner light, inscribed with sacred vows and solemn pledges in ' +
        'languages both ancient and forgotten. The archaic script speaks of ' +
        'binding oaths that must be spoken with absolute sincerity to prove ' +
        "one's true selflessness—words that can only be uttered by those who " +
        'have demonstrated genuine sacrifice for others without thought of ' +
        'personal gain. The mystical texts describe how the Ancient Dragon ' +
        'judges the hearts of supplicants, requiring them to speak an oath ' +
        'that resonates with their deepest nature and purest intentions. Each ' +
        'syllable pulses faintly with residual magic, as if the very essence ' +
        'of countless noble souls who have spoken these words still lingers ' +
        'within the parchment, waiting to recognize a kindred spirit worthy ' +
        "of the dragon's trust and wisdom.\n" +
        '[success]After having read the scrolls, you know that you will be able ' +
        'to speak the oath from your heart. With that understanding, the scrolls ' +
        'disintegrate, leaving you only with a pile of dust in your hands.[/success]',
      canBeCarried: true,
      shortName: 'scrolls',
    })
  }

  /** Examine the oath scrolls and set the examined flag. */
  override examine(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT3_OATH_SCROLLS_EXAMINED, true)
    // Remove the scrolls from inventory (they disintegrate after being read)
    gameState.removeItemFromInventory(this.name)
    // Remove the scrolls from the current room as well
    const roomItems = gameState.currentRoom.items
    const index = roomItems.indexOf(this)
    if (index >= 0) roomItems.splice(index, 1)
    return super.examine(gameState)
  }
}
