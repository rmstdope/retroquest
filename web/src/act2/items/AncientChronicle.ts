import {
  Item,
  type GameState,
  characterName,
  event,
  speech,
  writing,
} from '@/engine'
import {
  FLAG_READ_ANCIENT_CHRONICLE,
  FLAG_SPECTRAL_LIBRARIAN_FRIENDLY,
} from '../Act2StoryFlags'
import { DispelSpell } from '../spells/DispelSpell'

/** The warning on the chronicle's last page, shown on the first and later readings. */
const MALAKAR_WARNING =
  "'Let it be recorded: the one called Malakar seeks the blood of " +
  "Willowbrook. If any Warden yet lives, let them guard it.'"

/** Stationary tome that can teach the Dispel spell when the librarian permits. */
export class AncientChronicle extends Item {
  constructor() {
    super({
      name: 'ancient chronicle',
      shortName: 'chronicle',
      description:
        'A massive tome containing historical records of the region. On its ' +
        'cover, worn almost smooth, is the sun rising over three linked rings.',
      canBeCarried: false,
    })
  }

  /**
   * Study the tome; blocked by the librarian until they are friendly. The
   * first permitted reading teaches dispel and shows the Wardens' passage and
   * Malakar's warning; later readings only recall the warning.
   */
  override use(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_SPECTRAL_LIBRARIAN_FRIENDLY)) {
      if (gameState.getStoryFlag(FLAG_READ_ANCIENT_CHRONICLE)) {
        return (
          event(
            "You turn again to the newer ink on the chronicle's last page:",
          ) +
          '\n' +
          writing(MALAKAR_WARNING)
        )
      }
      gameState.setStoryFlag(FLAG_READ_ANCIENT_CHRONICLE, true)
      gameState.learnSpell(new DispelSpell())

      return (
        event(
          'You open the chronicle. Pressed into the leather of its cover is ' +
            'the sun rising over three linked rings, the mark of the Wardens ' +
            'of the Dawn.',
        ) +
        '\n' +
        writing(
          "'The Wardens were few, and their magic was of the old kind: to " +
            'loosen what another hand has bound, to lift a working laid in ' +
            'malice. This they taught to those they trusted, and it is ' +
            "written here.'",
        ) +
        '\n' +
        '[success]You study the pages until the words settle in your mind. ' +
        'You have learned [spell_name]dispel[/spell_name].[/success]' +
        '\n' +
        event(
          'On the last page the ink is newer than the rest, as if someone ' +
            'added it within living memory:',
        ) +
        '\n' +
        writing(MALAKAR_WARNING)
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
      speech('These sacred chronicles are not for the unworthy,') +
      ' the spirit intones. ' +
      speech(
        'Prove yourself first, then perhaps I will permit you to study ' +
          'these treasures.',
      )
    )
  }
}
