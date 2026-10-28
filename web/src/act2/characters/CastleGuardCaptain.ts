import {
  Character,
  type GameState,
  characterName,
  speech,
  dialogue,
  type NameOptions,
} from '@/engine'
import {
  FLAG_CEDRIKS_HONOR_COMPLETED,
  FLAG_DEMONSTRATED_COMBAT_SKILLS,
} from '../Act2StoryFlags'

/** Orientation NPC who advises visitors on castle protocol and introductions. */
export class CastleGuardCaptain extends Character {
  /** Named by what it is, so it reads "the …" (see `nameInSentence`). */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, common: true })
  }

  constructor() {
    super({
      name: 'castle guard captain',
      description:
        'A grey-moustached officer in polished armor, standing where he can ' +
        'see both the gate and the courtyard arch. He keeps his voice low ' +
        'out of habit.',
    })
  }

  /**
   * Explain where Sir Cedric is and what he is owed; the answer follows his
   * ruling, and stops asking for a blade once Elior has held his own.
   */
  override talkTo(gameState: GameState): string {
    const name = this.name
    const standing = gameState.getStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED)
      ? "Sir by right again, and I'm glad to say it."
      : 'He holds no rank now, but we still call him Sir, most of us, and ' +
        "you'll do the same if you've any sense."
    const blade = gameState.getStoryFlag(FLAG_DEMONSTRATED_COMBAT_SKILLS)
      ? 'I hear you held your own against him. Not many do.'
      : "He's looking for people who can hold their own. If that's why " +
        "you're here, he'll want to see you with a blade."
    return (
      dialogue(
        name,
        'Welcome to the castle grounds. ' +
          characterName('Sir Cedric') +
          ` is in the courtyard. ${standing} ${blade}`,
      ) +
      '\n\nHe lowers his voice.\n\n' +
      speech(
        'And a word of advice: ask no questions about the king. His Majesty has not ' +
          'been seen these three weeks, since the night he vanished from his own ' +
          'chambers. The word sent out to the villages is that he is ill. The Lord ' +
          'Commander rules in his name until he returns.',
      )
    )
  }
}
