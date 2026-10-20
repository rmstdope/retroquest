import { Item, type GameState, event } from '@/engine'
import { Fish } from './Fish'
import { FishingRod } from './FishingRod'

/** Natural fishing location with a one-time catch until reset. */
export class River extends Item {
  fishAvailable = true

  constructor() {
    super({
      name: 'river',
      description:
        'A gentle river, its waters flowing steadily. It looks like a good spot ' +
        'for fishing.',
      shortName: 'river',
    })
  }

  /** Use with FishingRod to catch fish if basics are learned, otherwise fail. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof FishingRod) {
      if (!gameState.getStoryFlag('learned_fishing_basics')) {
        const rodName = other.name
        return (
          '[failure]You have the [item_name]' +
          rodName +
          ("[/item_name], but you're not quite sure how to fish effectively yet. " +
            'Perhaps someone could teach you.[/failure]')
        )
      }
      if (this.fishAvailable) {
        gameState.addItemToInventory(new Fish())
        this.fishAvailable = false
        this.description =
          "A gentle river, its waters flowing steadily. You've already fished " +
          'here recently.'
        const riverName = this.name
        const rodName = other.name
        return (
          event(
            'You cast your line into the [item_name]' +
              riverName +
              '[/item_name] using the [item_name]' +
              rodName +
              '[/item_name]. After a moment, you feel a tug and reel in a ' +
              'plump [item_name]fish[/item_name]!',
          ) + '\nYou add the fish to your inventory.'
        )
      }
      return (
        "[failure]You cast your line again, but the fish aren't biting " +
        'right now.[/failure]'
      )
    }
    return super.useWith(gameState, other)
  }
}
