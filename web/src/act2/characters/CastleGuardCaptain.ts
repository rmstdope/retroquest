import { Character, type GameState, characterName, speech } from '@/engine'

/** Orientation NPC who advises visitors on castle protocol and introductions. */
export class CastleGuardCaptain extends Character {
  constructor() {
    super({
      name: 'castle guard captain',
      description:
        'A stern-looking officer in polished armor who oversees security for ' +
        'the castle grounds. He provides guidance on proper protocol for ' +
        'meeting with nobility.',
    })
  }

  /** Explain where Sir Cedric is and how to address him. */
  override talkTo(_gameState: GameState): string {
    const name = this.name
    return (
      characterName(name) +
      ': ' +
      speech(
        'Welcome to the castle grounds. ' +
          characterName('Sir Cedric') +
          ' can be found in the courtyard. When speaking with him, address ' +
          "him as 'Sir' and show proper respect. He's been seeking capable " +
          "individuals for important work, so if you're here about that, be " +
          'prepared to demonstrate your abilities.',
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
