import { Item, type GameState, characterName, speech } from '@/engine'

/** Sword item representing a combat/heroism symbol with equip and examine actions. */
export class Sword extends Item {
  constructor() {
    super({
      name: 'sword',
      description:
        'A well-balanced iron sword with a sharp edge. The blade gleams with a faint ' +
        'sheen, and the leather-wrapped handle feels comfortable in your grip.',
      shortName: 'sword',
    })
  }

  /** Shopkeeper prevents taking the sword unless it's been purchased. */
  override preventPickup(): string {
    if (!this.canBeCarried) {
      return (
        characterName('Shopkeeper') +
        ' quickly steps over. ' +
        speech(
          `Hold on there, friend! That [item_name]${this.name}[/item_name] ` +
            "is merchandise, not a free sample. If you want it, you'll need to buy it " +
            'proper-like.',
        )
      )
    }
    return ''
  }

  /** Examine the sword for its combat readiness. */
  override use(_gameState: GameState): string {
    return 'It feels perfectly balanced and ready for combat.'
  }

  /** Equip the sword to feel more confident and prepared. */
  override equip(_gameState: GameState): string {
    return 'You feel more confident and prepared for any threats.'
  }
}
