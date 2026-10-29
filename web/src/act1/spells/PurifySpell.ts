import { Spell, type Character, type GameState, type Item } from '@/engine'
import { Well } from '../items/Well'
import { River } from '../items/River'
import { FLAG_MAGIC_FULLY_UNLOCKED } from '../Act1StoryFlags'

/** Cleansing spell that removes impurities from items or environments. */
export class PurifySpell extends Spell {
  constructor() {
    super({
      id: 'purify',
      name: 'purify',
      description:
        'Your mother taught it to the fisherman at the bend, and he gave ' +
        'it back to you. It makes foul water clean.',
    })
  }

  private fizzle(): string {
    return (
      'The magic fizzles out, achieving nothing. ' +
      'It feels like the magic is just out of reach.'
    )
  }

  override castSpell(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED)) {
      return this.fizzle()
    }
    return 'A cleansing energy flows from your hands.'
  }

  override castOnItem(gameState: GameState, item: Item): string {
    if (!gameState.getStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED)) {
      return this.fizzle()
    }
    if (item instanceof Well) {
      return item.purify(gameState)
    }
    if (item instanceof River) {
      return (
        'The light runs out over the water and finds nothing to do. The ' +
        'river was never the trouble. Your mother stood at this bend and ' +
        'taught this spell to the fisherman; the water remembers her better ' +
        'than it needs you.'
      )
    }
    return (
      'A cleansing energy flows from your hands, but nothing else ' +
      'seems to happen.'
    )
  }

  override castOnCharacter(gameState: GameState, character: Character): string {
    if (!gameState.getStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED)) {
      return this.fizzle()
    }
    return (
      `The cleansing runs over ${character.nameInSentence()} ` +
      'and finds nothing to wash away.'
    )
  }
}
