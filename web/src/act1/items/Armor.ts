import { Item, type GameState, event, characterName, speech } from '@/engine'

/** Early defensive gear establishing the concept of protective equipment. */
export class Armor extends Item {
  constructor() {
    super({
      name: 'armor',
      description:
        'A sturdy leather armor vest that provides protection from harm. ' +
        'Well-crafted and reliable.',
      shortName: 'armor',
    })
  }

  /** Shopkeeper prevents taking the armor unless it's been purchased. */
  override preventPickup(): string {
    if (!this.canBeCarried) {
      return (
        characterName('Shopkeeper') +
        ' quickly steps over. ' +
        speech(
          `'Hold on there, friend! That [item_name]${this.name}[/item_name] ` +
            "is merchandise, not a free sample. If you want it, you'll need to buy " +
            "it proper-like.'",
        )
      )
    }
    return ''
  }

  /** Examine the armor for its protective qualities. */
  override use(_gameState: GameState): string {
    return event(
      'You examine the [item_name]armor[/item_name]. ' +
        'It looks like it would provide good protection if worn.',
    )
  }

  /** Equip the armor to feel more protected. */
  override equip(_gameState: GameState): string {
    return event(
      'You put on the [item_name]armor[/item_name]. ' +
        'You feel more protected and ready for danger.',
    )
  }

  /** Examine the armor and read its description. */
  override examine(_gameState: GameState): string {
    return event(
      `You examine the [item_name]armor[/item_name]. ${this.description}`,
    )
  }
}
