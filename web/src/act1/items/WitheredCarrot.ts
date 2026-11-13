import { Item, type GameState } from '@/engine'

const WITHERED_DESCRIPTION =
  'A shriveled, orange carrot barely clinging to life. It looks edible, ' +
  'but only just.'
const FRESH_DESCRIPTION =
  'A vibrant, healthy carrot, freshly revived. It looks delicious and ' +
  'full of nutrients.'

/** A shriveled carrot that can be revived into a fresh carrot. */
export class WitheredCarrot extends Item {
  /**
   * Whether the carrot has been revived. Missing in saves made when the state
   * lived only in the name; see migrateLegacyState.
   */
  fresh?: boolean = false

  constructor() {
    super({
      name: 'withered carrot',
      description: WITHERED_DESCRIPTION,
      shortName: 'carrot',
      canBeCarried: true,
    })
  }

  /** Whether the carrot has been revived. */
  isFresh(): boolean {
    return this.fresh === true
  }

  /** The carrot's look: withered, or fresh once revived. */
  override descriptionFor(_gameState: GameState): string {
    return this.isFresh() ? FRESH_DESCRIPTION : WITHERED_DESCRIPTION
  }

  /**
   * Give a save made before the `fresh` field its value: a revived carrot
   * no longer has the withered description.
   */
  migrateLegacyState(): void {
    this.fresh ??= this.description !== WITHERED_DESCRIPTION
  }

  /** Turn the withered carrot into a fresh carrot and return a message (ReviveSpell). */
  revive(): string {
    this.fresh = true
    this.name = 'fresh carrot'
    this.shortName = 'carrot'
    return (
      'The [item_name]' +
      this.name.toLowerCase() +
      '[/item_name] looks vibrant and healthy!'
    )
  }

  /** The line for the carrot as it is when taken: withered, or fresh once revived. */
  override pickedUp(_gameState: GameState): string {
    if (this.isFresh()) {
      return (
        'It is cool and firm, with soil still on it. ' +
        'Not long ago it was barely alive.'
      )
    }
    return (
      'It bends in your fingers, soft and nearly gone. ' +
      'It is still a carrot, just.'
    )
  }
}
