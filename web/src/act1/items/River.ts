import { Item, type GameState, clue } from '@/engine'
import { Fish } from './Fish'
import { FishingRod } from './FishingRod'

const RIVER_DESCRIPTION =
  'A gentle river, its waters flowing steadily. It looks like a good spot ' +
  'for fishing.'
const RIVER_GAVE_FISH_DESCRIPTION =
  'A gentle river, its waters flowing steadily. It gave you one fish, ' +
  'and it will not give another.'

/** Natural fishing location that gives one fish per game, and never another. */
export class River extends Item {
  fishAvailable = true

  constructor() {
    super({
      name: 'river',
      description: RIVER_DESCRIPTION,
      shortName: 'river',
    })
  }

  /** The river's look: it says so once it has given its fish. */
  override descriptionFor(_gameState: GameState): string {
    return this.fishAvailable ? RIVER_DESCRIPTION : RIVER_GAVE_FISH_DESCRIPTION
  }

  /** Use with FishingRod to catch fish if basics are learned, otherwise fail. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof FishingRod) {
      if (!gameState.getStoryFlag('learned_fishing_basics')) {
        return clue(
          "You have a [item_name]rod[/item_name], but you're not quite sure " +
            'how to fish effectively yet. Perhaps someone could teach you.',
        )
      }
      if (this.fishAvailable) {
        gameState.addItemToInventory(new Fish())
        this.fishAvailable = false
        return (
          'After a moment, you feel a tug and reel in a plump ' +
          '[item_name]fish[/item_name]!\nYou tuck it into your pack.'
        )
      }
      return clue(
        'Nothing bites. The river gave you one fish, and it will not ' +
          'give another.',
      )
    }
    return super.useWith(gameState, other)
  }
}
