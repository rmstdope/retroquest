import { Item, type GameState, characterName, speech, writing } from '@/engine'
import { BlessSpell } from '../spells/BlessSpell'

/**
 * The founders' heirloom of Elior's mother's line: a small silver locket
 * bearing the founders' crest, hidden in the chapel the night she left.
 */
export class Locket extends Item {
  constructor() {
    super({
      name: 'locket',
      description:
        'A small, intricately carved silver locket, clearly very old. ' +
        'A tiny crest, a silver tree beneath twin moons, is worked into its lid. ' +
        'It feels cool to the touch. ' +
        'Perhaps someone in your family might know more about it.',
      shortName: 'locket',
      canBeCarried: true,
    })
  }

  /** Teach Bless spell when picked up if the spell is not yet known. */
  override pickedUp(gameState: GameState): string {
    if (!gameState.hasSpell(new BlessSpell().id)) {
      const blessSpell = new BlessSpell()
      gameState.learnSpell(blessSpell)
      return (
        'As you do this, the ' +
        characterName('priest') +
        ' gasps and looks closely at its crest. ' +
        speech(
          "The founders' relic... That crest, child, only the founders' line " +
            "wore it. Your mother's line. " +
            'She prayed here alone the night she left. ' +
            'She must have hidden it then, for you.',
        ) +
        '\nHe nods gravely. ' +
        speech('May this blessing protect you on your path.') +
        '\nHe teaches you the [spell_name]bless[/spell_name] spell!\n' +
        'You have learned [spell_name]bless[/spell_name].'
      )
    }
    return ''
  }

  /** Open the locket to read the engraving inside its lid. */
  override use(_gameState: GameState): string {
    return (
      'The locket springs open.\nAround the inside of the lid, tiny letters are engraved:' +
      writing("From the founders' line, to the next.") +
      '\nThe silver warms in your palm for a moment, then cools again.'
    )
  }
}
