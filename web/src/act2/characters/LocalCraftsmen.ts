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
        'Skilled artisans working at various crafts - blacksmithing, carpentry, ' +
        'tailoring, and magical repair work. They demonstrate traditional ' +
        'techniques passed down through generations.',
    })
  }

  /** Refuse until the player helped residents, then teach mend, then greet. */
  override talkTo(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_HELPED_ELDERLY_RESIDENTS)) {
      const name = this.name
      return clue(
        'The ' +
          characterName(name) +
          " eye you with suspicion and refuse to talk to you. They don't " +
          'seem to trust you yet. Perhaps you need to prove yourself to the ' +
          'community first.',
      )
    }
    if (!gameState.hasSpell(new MendSpell().id)) {
      gameState.learnSpell(new MendSpell())
      const name = this.name
      return (
        '[success]You watch the ' +
        characterName(name) +
        ' work, observing their techniques for repairing ' +
        'items. As you study their methods, you begin to understand the ' +
        'magical principles behind restoration and repair. Through careful ' +
        'study, you learn the [spell_name]mend[/spell_name] ' +
        'spell![/success]'
      )
    }
    const name = this.name
    return dialogue(
      name,
      'Good to see you again! How has your repair magic been working? ' +
        'The mend spell is one of the most useful pieces of magic a person ' +
        'can learn.',
    )
  }
}
