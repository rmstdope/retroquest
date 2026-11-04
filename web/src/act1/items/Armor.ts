import { Item, type GameState, nameInSentence, speech } from '@/engine'

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
        nameInSentence('character', 'Hemlock', { atStart: true }) +
        ' quickly steps over. ' +
        speech(
          `Hold on there, friend! That [item_name]${this.name}[/item_name] ` +
            "is merchandise, not a free sample. If you want it, you'll need to buy " +
            'it proper-like.',
        )
      )
    }
    return ''
  }

  /** Examine the armor for its protective qualities. */
  override use(_gameState: GameState): string {
    return 'It looks like it would provide good protection if worn.'
  }

  /** Equip the armor to feel more protected. */
  override equip(_gameState: GameState): string {
    return 'You feel more protected and ready for danger.'
  }

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return (
      'It is stiff, and it smells of new leather. ' +
      'It will soften with wearing.'
    )
  }
}
