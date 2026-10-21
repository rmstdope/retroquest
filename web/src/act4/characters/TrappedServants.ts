import { Character, type GameState, characterName, speech } from '@/engine'
import {
  FLAG_ACT4_SERVANTS_TRUST_EARNED,
  FLAG_ACT4_SERVANTS_FREED,
} from '../Act4StoryFlags'

/** What the servants are called once their chains are broken. */
const FREED_SERVANTS_NAME = 'Freed Servants'

/** Fortress servants enslaved by dark magic, seeking freedom. */
export class TrappedServants extends Character {
  constructor() {
    super({
      name: 'Trapped Servants',
      description:
        'Grey figures walk the courtyard paths in circles, chains of shadow ' +
        'at their ankles. They wear what is left of kitchen aprons and stable ' +
        'coats. None of them looks up.',
    })
  }

  /** Also answers to "servants", whatever their name is now. */
  override answersTo(name: string): boolean {
    return (
      super.answersTo(name) ||
      ['servants', 'trapped servants', 'freed servants'].includes(
        name.toLowerCase(),
      )
    )
  }

  /** The servants are freed: they stay in the courtyard under a new name. */
  free(): void {
    this.name = FREED_SERVANTS_NAME
  }

  /** Return the servants' plea, which changes as their trust and freedom are won. */
  override talkTo(gameState: GameState): string {
    const name = characterName(this.name)
    if (!gameState.getStoryFlag(FLAG_ACT4_SERVANTS_TRUST_EARNED)) {
      return (
        `The ${name} watch you from the corners of their eyes and keep ` +
        'walking. One whispers, without stopping: ' +
        speech(
          "'Others came through that gate. They were all brave, until the " +
            'guardians. If you were braver than the guardians, you would ' +
            "carry something of theirs.'",
        )
      )
    }
    if (!gameState.getStoryFlag(FLAG_ACT4_SERVANTS_FREED)) {
      return (
        `The ${name} have stopped walking. They stand close together, ` +
        'watching you. ' +
        speech("'We are so tired. Whatever you can do for us, do it gently.'")
      )
    }
    return (
      `The ${name} bow, a little stiffly, as if they have forgotten how. ` +
      speech(
        "'The mirrors past the arch lie. We used to polish them, and they " +
          'lied to us too. Keep the pendant close, and listen for the ones ' +
          "who have nothing left to lie about.'",
      )
    )
  }
}
