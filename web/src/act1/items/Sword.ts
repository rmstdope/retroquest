import { Item, type GameState } from '@/engine'

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
        '[character_name]Shopkeeper[/character_name] quickly steps over. ' +
        `[dialogue]'Hold on there, friend! That [item_name]${this.name}[/item_name] ` +
        "is merchandise, not a free sample. If you want it, you'll need to buy it " +
        "proper-like.'[/dialogue]"
      )
    }
    return ''
  }

  /** Examine the sword for its combat readiness. */
  override use(_gameState: GameState): string {
    return (
      '[event]You examine the [item_name]sword[/item_name]. ' +
      'It feels perfectly balanced and ready for combat.[/event]'
    )
  }

  /** Equip the sword to feel more confident and prepared. */
  override equip(_gameState: GameState): string {
    return (
      '[event]You grip the [item_name]sword[/item_name] firmly. ' +
      'You feel more confident and prepared for any threats.[/event]'
    )
  }

  /** Examine the sword and read its description. */
  override examine(_gameState: GameState): string {
    return (
      '[event]You examine the [item_name]sword[/item_name]. ' +
      `${this.description}[/event]`
    )
  }
}
