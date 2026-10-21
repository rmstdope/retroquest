import { Character, type GameState, characterName, speech } from '@/engine'
import { FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED } from '../Act3StoryFlags'

/** Keeper of the hush before the dragon's hall: a former singer who gave up their voice. */
export class SilenceKeeper extends Character {
  /** Whether the player has heard the Keeper's story; saves from before this field was added read it as false. */
  introduced = false

  constructor() {
    super({
      name: 'silence keeper',
      description:
        'A tall figure robed in shadow-dark fabric that seems to absorb ' +
        'sound itself. Their face is hidden beneath a deep hood, and they ' +
        'move without disturbing the stillness around them.',
    })
  }

  /**
   * Speak as a person: the whole story and the hint on the first talk, a short
   * reminder on later talks, and a closing line once the Oath of Stillness
   * has opened the way (also on a first talk after that).
   */
  override talkTo(gameState: GameState): string {
    const keeper = characterName('Silence Keeper')
    if (gameState.getStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED)) {
      return (
        `The ${keeper} bows their hooded head: ` +
        speech(
          "'The sleeper spoke with you, and the stone held. Forty years, " +
            "and I have never been so glad to have kept a quiet.'",
        )
      )
    }
    if (this.introduced) {
      return (
        `The ${keeper} does not turn: ` +
        speech(
          "'Forty years I have listened to those stones. They are cold. " +
            "Bless them; give them the chant.'",
        )
      )
    }
    this.introduced = true
    return (
      `The ${keeper} whispers, their voice barely disturbing the air: ` +
      speech(
        "'I have kept this hush for forty years, so the sleeper below can " +
          'rest. I was a singer once, in the villages above. I sang one ' +
          'night too loud, too near the deep, and something old turned over ' +
          'in its sleep. I put my voice down that night and never picked it ' +
          "up.'",
      ) +
      '\n\n' +
      speech(
        "'The stones in this room were cut to carry a whisper to the " +
          'sleeper without waking it. They have gone cold. Bless them, and ' +
          "give them the old chant, and the way will open.'",
      )
    )
  }
}
