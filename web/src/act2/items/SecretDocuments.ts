import { Item, type GameState } from '@/engine'
import {
  FLAG_EXAMINED_SECRET_DOCUMENTS,
  FLAG_READ_SQUIRES_DIARY,
} from '../Act2StoryFlags'

/** The documents' description; `Act2.afterLoad` restores it in older saves. */
export const SECRET_DOCUMENTS_DESCRIPTION =
  'A sealed packet of papers: a sworn confession and a letter closed with ' +
  'black wax.'

/**
 * A watchman's confession and the letter that paid him, which clear Sir
 * Cedric's name and name where the king was carried.
 */
export class SecretDocuments extends Item {
  constructor() {
    super({
      name: 'secret documents',
      description: SECRET_DOCUMENTS_DESCRIPTION,
    })
  }

  /** Make no sense before the diary is read; afterwards reveal the confession and letter. */
  override examine(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_READ_SQUIRES_DIARY)) {
      return (
        'A sworn confession and a letter closed with black wax. They speak of ' +
        'gold, a gate and a night, but without knowing whose night, you cannot ' +
        'make sense of them.'
      )
    }

    // Set flag that the secret documents have been examined after reading the diary
    gameState.setStoryFlag(FLAG_EXAMINED_SECRET_DOCUMENTS, true)

    return (
      'A confession from a man of the night watch, written in Heavensforth ' +
      'where he fled. He swears that he and another were paid to leave the ' +
      "king's postern gate unguarded on the night King Alden vanished, and to " +
      'say afterwards that Sir Cedric had left his post. Pinned to it is the ' +
      'letter that paid them, closed with black wax pressed with a twisted ' +
      "rune, the same kind of rune as the token you fished out of Willowbrook's " +
      'well. It names where the king was to be carried: the bastion on the ' +
      'shattered ridge, north of the hills. It ends with a name in an old ' +
      'script you cannot read.'
    )
  }
}
