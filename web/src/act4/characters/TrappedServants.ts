import { Character, type GameState, characterName, speech } from '@/engine'
import {
  FLAG_ACT4_SERVANTS_TRUST_EARNED,
  FLAG_ACT4_SERVANTS_FREED,
} from '../Act4StoryFlags'

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
      `The freed ${name} bow gratefully. ` +
      speech(
        "'Thank you for our freedom! " +
          'The Mirror Labyrinth ahead is treacherous - our pendant will help guide ' +
          "you, but beware: only the ancient echoes know the full truth.'",
      )
    )
  }
}
