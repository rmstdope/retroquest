import { Item, type GameState, event, characterName, speech } from '@/engine'
import { BlessSpell } from '../spells/BlessSpell'

/** Small, intricately carved silver locket with narrative significance. */
export class Locket extends Item {
  constructor() {
    super({
      name: 'locket',
      description:
        'A small, intricately carved silver locket, clearly very old. It feels cool ' +
        'to the touch. Perhaps some elder in the village might know more about it.',
      shortName: 'locket',
      canBeCarried: true,
    })
  }

  /** Teach Bless spell when picked up if the spell is not yet known. */
  override pickedUp(gameState: GameState): string {
    if (!gameState.hasSpell(new BlessSpell().name)) {
      const blessSpell = new BlessSpell()
      gameState.learnSpell(blessSpell)
      return (
        event('You pick up the locket.') +
        '\nAs you do this, the ' +
        characterName('priest') +
        ' gasps. The ' +
        characterName('priest') +
        ' nods gravely. ' +
        speech(
          "'That locket... it is a relic of the village founders. It speaks " +
            'of your connection to this place and its history. May this blessing protect ' +
            "you on your path.'",
        ) +
        '\nHe teaches you the [spell_name]bless[/spell_name] spell!\n' +
        event('You have learned [spell_name]bless[/spell_name].')
      )
    }
    return ''
  }
}
