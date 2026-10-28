import {
  Character,
  type GameState,
  characterName,
  clue,
  dialogue,
  type NameOptions,
} from '@/engine'
import { MendSpell } from '../spells/MendSpell'
import { FLAG_HELPED_ELDERLY_RESIDENTS } from '../Act2StoryFlags'

/**
 * Collective artisan NPC that awards the Mend spell after civic aid.
 *
 * Requires FLAG_HELPED_ELDERLY_RESIDENTS before the dialogue becomes welcoming;
 * the first interaction after that teaches the mend spell by observation.
 */
export class LocalCraftsmen extends Character {
  /** Named by what they are, so it reads "the …" (see `nameInSentence`). */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, common: true })
  }

  /** Several of them, so the default replies take plural verbs. */
  override isPlural(): boolean {
    return true
  }

  constructor() {
    super({
      name: 'local craftsmen',
      description:
        'Artisans at their benches: a smith, a carpenter, a tailor with a ' +
        'lapful of torn sailcloth, and an old woman who mends with her hands ' +
        'and a murmur instead of a needle.',
    })
  }

  /** Refuse until the player helped residents, then teach mend, then greet. */
  override talkTo(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_HELPED_ELDERLY_RESIDENTS)) {
      const name = this.name
      return (
        clue(`The ${characterName(name)} keep their eyes on their work.`) +
        '\n\n' +
        dialogue(
          name,
          "We don't know you. Old Tomas can barely get down this lane on " +
            "his own; help our own first, and we'll talk.",
        )
      )
    }
    if (!gameState.hasSpell(new MendSpell().id)) {
      gameState.learnSpell(new MendSpell())
      return (
        '[success]The old woman at the end bench ' +
        'runs her thumb along a split bowl, murmuring, and the crack closes ' +
        'behind her thumb. She hands you a second bowl and has you do it, ' +
        'again and again, until the wood answers you too. You have learned ' +
        '[spell_name]mend[/spell_name].[/success]'
      )
    }
    const name = this.name
    return dialogue(
      name,
      'Back again. Whatever you mend, mend it slowly; a rushed join is the ' +
        'first to split.',
    )
  }
}
