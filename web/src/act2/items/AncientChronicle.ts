import { Item, type GameState, characterName, speech, writing } from '@/engine'
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
          "You turn again to the newer ink on the chronicle's last page:" +
          '\n' +
          writing(MALAKAR_WARNING)
        )
      }
      gameState.setStoryFlag(FLAG_READ_ANCIENT_CHRONICLE, true)
      gameState.learnSpell(new DispelSpell())

      return (
        "Pressed into the leather of the chronicle's cover is " +
        'the sun rising over three linked rings, the mark of the Wardens ' +
        'of the Dawn. On the first page the same mark is drawn the old ' +
        'way, a tree under two moons, and the first entry tells of ' +
        'Wardens who settled a quiet valley to keep their relic safe, ' +
        'and built their mill over a seat of power there.' +
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
        'On the last page the ink is newer than the rest, as if someone ' +
        'added it within living memory:' +
        '\n' +
        writing(MALAKAR_WARNING)
      )
    }
    return (
      'The ' +
      characterName('Spectral Librarian') +
      ' is between you and the chronicle before you see them move. ' +
      speech('Not yet. Ask me first; I am the one who keeps it.')
    )
  }
}
