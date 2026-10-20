import { Item, type GameState, characterName, event, speech } from '@/engine'
import { FLAG_SPECTRAL_LIBRARIAN_FRIENDLY } from '../Act2StoryFlags'
import { DispelSpell } from '../spells/DispelSpell'

/** Stationary tome that can teach the Dispel spell when the librarian permits. */
export class AncientChronicle extends Item {
  constructor() {
    super({
      name: 'ancient chronicle',
      shortName: 'chronicle',
      description:
        'A massive tome containing historical records of the region. The pages hold ' +
        'detailed accounts of ancient bloodlines, family genealogies, and the ' +
        'significance of settlements such as Willowbrook.',
      canBeCarried: false,
    })
  }

  /** Study the tome; blocked by the librarian until they are friendly. */
  override use(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_SPECTRAL_LIBRARIAN_FRIENDLY)) {
      // Learn dispel spell from ancient texts
      gameState.learnSpell(new DispelSpell())

      return event(
        'You study the ancient texts, reviewing the knowledge of the ' +
          '[spell_name]dispel[/spell_name] spell and the revelations about ' +
          'your heritage. The words of the Chosen One prophecy echo in your ' +
          'mind as you contemplate your destiny.',
      )
    }
    return (
      event(
        'The ' +
          characterName('Spectral Librarian') +
          ' materializes before you, blocking your access to the ancient ' +
          'texts.',
      ) +
      '\n' +
      speech("'These sacred chronicles are not for the unworthy,'") +
      ' the spirit intones. ' +
      speech(
        "'Prove yourself first, then perhaps I will permit you to study " +
          "these treasures.'",
      )
    )
  }
}
