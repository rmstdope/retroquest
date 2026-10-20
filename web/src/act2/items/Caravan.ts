import { Item, type GameState } from '@/engine'

/** A large rescued merchant caravan object; non-carriable but interactive. */
export class Caravan extends Item {
  constructor() {
    super({
      name: 'caravan',
      shortName: 'caravan',
      description:
        'The rescued merchant caravan, battered but intact. Several merchants ' +
        'huddle around their damaged wagon, grateful to be alive. Their ' +
        'faces show relief mixed with exhaustion from their ordeal in the ' +
        'ravine. Crates of goods are scattered around, some damaged but ' +
        'most salvageable.',
      canBeCarried: false, // A caravan is too large to carry
    })
  }

  /** Describe the state of the caravan and the grateful merchants. */
  override examine(_gameState: GameState): string {
    return (
      "The merchant caravan is in rough shape but the people are safe. The wagon's " +
      'wheels are cracked and the canvas cover is torn, but the structure is ' +
      'sound. Several merchants tend to minor injuries while sorting through ' +
      'their goods. You see spice containers, bolts of fine cloth, and various ' +
      'trade items. The merchants look at you with deep gratitude—you clearly ' +
      'saved their lives.'
    )
  }
}
