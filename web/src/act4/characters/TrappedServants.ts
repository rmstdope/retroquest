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
        'Several ethereal figures wander in endless circles, their faces ' +
        'etched with torment. Dark chains of shadow magic bind their spirits ' +
        'to this cursed ground, forcing them to serve Malakar against their will. ' +
        'Their eyes plead for release from their eternal suffering.',
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
        `The eyes of the ${name} regard you with fear and suspicion. ` +
        'One whispers: ' +
        speech(
          "'Many have come before... all have fallen to " +
            'shadow. Prove your courage against the darkness before we dare ' +
            "trust...'",
        )
      )
    }
    if (!gameState.getStoryFlag(FLAG_ACT4_SERVANTS_FREED)) {
      return (
        `The faces of the ${name} brighten with hope as they sense your ` +
        'worthiness. ' +
        speech(
          "'You have shown courage! Please, use your " +
            'compassion to break these cursed chains that bind us to eternal ' +
            "servitude.'",
        )
      )
    }
    return (
      `The ${name} bow gratefully. ` +
      speech(
        "'Thank you for our freedom! " +
          'The Mirror Labyrinth ahead is treacherous - our pendant will help guide ' +
          "you, but beware: only the ancient echoes know the full truth.'",
      )
    )
  }
}
