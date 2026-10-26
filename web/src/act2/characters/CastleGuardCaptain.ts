import {
  Character,
  type GameState,
  characterName,
  speech,
  dialogue,
  type NameOptions,
} from '@/engine'
import { FLAG_CEDRIKS_HONOR_COMPLETED } from '../Act2StoryFlags'

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
        'A stern-looking officer in polished armor who oversees security for ' +
        'the castle grounds. He provides guidance on proper protocol for ' +
        'meeting with nobility.',
    })
  }

  /** Explain where Sir Cedric is and what he is owed; the answer follows his ruling. */
  override talkTo(gameState: GameState): string {
    const name = this.name
    const standing = gameState.getStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED)
      ? "Sir by right again, and I'm glad to say it."
      : 'He holds no rank now, but we still call him Sir, most of us, and ' +
        "you'll do the same if you've any sense."
    return (
      dialogue(
        name,
        'Welcome to the castle grounds. ' +
          characterName('Sir Cedric') +
          ` can be found in the courtyard. ${standing} He's been seeking ` +
          "capable individuals for important work, so if you're here about " +
          'that, be prepared to demonstrate your abilities.',
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
