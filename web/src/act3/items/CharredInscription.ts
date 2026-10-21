import { Item, event, writing, type GameState } from '@/engine'
import { AncientAmulet } from './AncientAmulet'
import { FLAG_ACT3_CHARRED_INSCRIPTION_READ } from '../Act3StoryFlags'

/** A charred inscription etched into cooled lava, part of the Hidden Bond story. */
export class CharredInscription extends Item {
  constructor() {
    super({
      name: 'Charred Inscription',
      description:
        'Words burned deep into cooled lava, the letters blackened by ' +
        'intense heat. Three hands wrote here, one after another.',
      canBeCarried: false,
      shortName: 'inscription',
    })
  }

  /**
   * Examine the inscription to read its message. The first reading ends with
   * the amulet's second glow.
   */
  override examine(gameState: GameState): string {
    const first = !gameState.getStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ)
    gameState.setStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ, true)

    return (
      event(
        'You trace the charred letters with your finger, feeling the ' +
          'heat that once shaped them. The inscription reads:',
      ) +
      '\n\n' +
      writing('We are three, and we are one promise.') +
      '\n\n' +
      writing('I, Aren, pour courage into the Crystal of Light.') +
      '\n\n' +
      writing("I, Lysa, pour selflessness into the Dragon's Scale.") +
      '\n\n' +
      writing('I, Malakar, pour wisdom into the Phoenix Feather.') +
      '\n\n' +
      writing('What we pour into the ward, the ward will keep.') +
      '\n\n' +
      event(
        'The last name is burned deeper than the others, as if the stone ' +
          'was struck again long after it cooled. Your parents and Malakar ' +
          'made this promise together, and the wisdom was his.',
      ) +
      (first ? AncientAmulet.glowInBag(gameState, 2) : '')
    )
  }
}
