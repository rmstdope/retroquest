import { Item, event, writing, type GameState } from '@/engine'
import { AncientAmulet } from './AncientAmulet'
import { FLAG_ACT3_SEA_SEALED_LETTER_READ } from '../Act3StoryFlags'

/** A scrap of vellum preserved by salt-crystal varnish. */
export class SeaSealedLetter extends Item {
  constructor() {
    super({
      name: 'Sea-Sealed Letter',
      shortName: 'letter',
      description:
        event(
          'You unfold the salt-preserved vellum carefully. The ink, ' +
            'protected by crystalline varnish, is still clear:',
        ) +
        '\n\n' +
        writing('Malakar, our friend —') +
        '\n\n' +
        writing(
          'We made the relics together, the three of us, and swore they ' +
            'would only ever guard, never take. Now you speak of time as if ' +
            'it were a door you could open and close again. It is not a ' +
            'door. It is a wound, and what comes through it will not stop ' +
            'at saving us.',
        ) +
        '\n\n' +
        writing(
          'We are not afraid of what is coming. We are afraid of what you ' +
            'will become to stop it. Wait with us. Be patient, for once. If ' +
            'you will not, we will stand against you, not as your enemies ' +
            'but as your friends, and as Wardens of the Dawn.',
        ) +
        '\n\n' +
        writing('— Aren and Lysa') +
        '\n\n' +
        event(
          'Beneath their names, in a sharper hand and darker ink, someone ' +
            'has written a reply:',
        ) +
        '\n\n' +
        writing('You would have me wait while you die. — M.') +
        '\n\n' +
        event(
          'Your parents wrote to Malakar as a friend. He read it, and answered.',
        ),
      canBeCarried: true,
    })
  }

  /**
   * Examine the letter and set the read flag. The first reading ends with the
   * amulet's first glow.
   */
  override examine(gameState: GameState): string {
    const first = !gameState.getStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ)
    gameState.setStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ, true)
    return (
      event(`You examine the [item_name]${this.name}[/item_name].`) +
      '\n' +
      `${this.description}` +
      (first ? AncientAmulet.glowInBag(gameState, 1) : '')
    )
  }

  /** Handle letter pickup flavor text. */
  override pickedUp(_gameState: GameState): string {
    return event(
      'You carefully fold the letter — a plea to a friend, kept by the sea.',
    )
  }
}
