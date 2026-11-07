import { Spell, type Character, type GameState, characterName } from '@/engine'
import { Priest } from '../characters/Priest'
import {
  FLAG_JOURNEY_BLESS_COMPLETED,
  FLAG_MAGIC_FULLY_UNLOCKED,
  FLAG_PRIEST_BLESSED,
} from '../Act1StoryFlags'

/** The words for Elior himself that `cast bless on …` accepts. */
const SELF_WORDS: readonly string[] = ['me', 'myself', 'elior']

/** The priest's blessing, remembered: gives strength to Elior or another character. */
export class BlessSpell extends Spell {
  constructor() {
    super({
      id: 'bless',
      name: 'bless',
      description:
        `The blessing the ${characterName('priest')} said over you when you found the ` +
        "founders' locket.",
    })
  }

  /** Give a spell known in an older save the current description, which colours who taught it. */
  override refreshSavedText(): void {
    this.description = new BlessSpell().description
  }

  /** The reply while Mira has not yet taught Elior magic for real. */
  private outOfReach(): string {
    return (
      'You focus your will, a faint warmth spreads from your fingertips, ' +
      'and nothing answers it. The warmth is yours; the door it wants is ' +
      'not open yet.'
    )
  }

  /** Bless Elior himself, readying him for the journey, once magic is learned. */
  override castSpell(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED)) {
      return this.outOfReach()
    }
    gameState.setStoryFlag(FLAG_JOURNEY_BLESS_COMPLETED, true)
    return (
      'A quiet warmth settles on your shoulders and stays, the way the ' +
      `${characterName('priest')}'s hand did.`
    )
  }

  /** Bless Elior when he names himself (`me`, `myself`, `Elior`), as a bare cast does. */
  override castOnName(gameState: GameState, target: string): string | null {
    return SELF_WORDS.includes(target) ? this.castSpell(gameState) : null
  }

  /** Bless another character once magic is learned; the priest remembers being blessed. */
  override castOnCharacter(gameState: GameState, character: Character): string {
    if (!gameState.getStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED)) {
      return this.outOfReach()
    }
    if (character instanceof Priest)
      gameState.setStoryFlag(FLAG_PRIEST_BLESSED, true)
    return (
      `A divine light surrounds ${character.nameInSentence()} ` +
      'and leaves strength and resolve behind.'
    )
  }
}
