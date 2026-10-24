import {
  Spell,
  clue,
  type Character,
  type GameState,
  type Item,
} from '@/engine'
import { Malakar } from '../characters/Malakar'
import { Wound } from '../items/Wound'

/** What the spell says when it is aimed at Malakar. */
const ALREADY_FORGIVEN = clue(
  'Malakar is already forgiven. It is the wound that needs it.',
)

/**
 * Learned from saying "forgiveness" to the healed Malakar. Cast on the wound
 * it plays the Redemption ending.
 */
export class Forgiveness extends Spell {
  constructor() {
    super({
      id: 'forgiveness',
      name: 'Forgiveness',
      description: 'Magic that lets a wound close because it is forgiven.',
    })
  }

  /** On the wound it closes it (Redemption); elsewhere nothing answers it, as usual. */
  override castOnItem(gameState: GameState, target: Item): string {
    if (target instanceof Wound) return target.forgive(gameState)
    return super.castOnItem(gameState, target)
  }

  /** Malakar is already forgiven; the wound is what needs it. */
  override castOnCharacter(gameState: GameState, target: Character): string {
    if (target instanceof Malakar) return ALREADY_FORGIVEN
    return super.castOnCharacter(gameState, target)
  }
}
