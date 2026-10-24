import { Item, type GameState } from '@/engine'
import { CooledSlag } from './CooledSlag'
import { HeatWardMix } from './HeatWardMix'

/** Ash-fern is a brittle, ashy frond used in simple warding mixtures. */
export class AshFern extends Item {
  constructor() {
    super({
      name: 'ash-fern',
      description:
        "A brittle frond blackened by the mountain's breath. When mixed " +
        'with cooled slag it can form a rudimentary heat‑ward paste.',
      shortName: 'ash-fern',
      canBeCarried: true,
    })
  }

  /** Delegate combining with cooled slag to craft a heat ward mix. */
  override useWith(gameState: GameState, other: Item): string {
    // If combined with cooled slag, produce a HeatWardMix in inventory
    if (other instanceof CooledSlag) {
      // Remove components from inventory if present
      const selfIndex = gameState.inventory.indexOf(this)
      if (selfIndex >= 0) gameState.inventory.splice(selfIndex, 1)
      const otherIndex = gameState.inventory.indexOf(other)
      if (otherIndex >= 0) gameState.inventory.splice(otherIndex, 1)

      const mix = new HeatWardMix()
      gameState.inventory.push(mix)
      return (
        'The ash-fern and cooled slag grind down into a coarse paste: a ' +
        'heat-ward mix.'
      )
    }

    return (
      `[failure]You can't use the [item_name]${this.name}[/item_name] ` +
      `with the [item_name]${other.name}[/item_name].[/failure]`
    )
  }
}
