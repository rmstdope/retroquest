import { Item, type GameState } from '@/engine'
import {
  FLAG_EXAMINED_SECRET_DOCUMENTS,
  FLAG_READ_SQUIRES_DIARY,
} from '../Act2StoryFlags'

/** Secret documents containing evidence that proves Sir Cedric's innocence. */
export class SecretDocuments extends Item {
  constructor() {
    super({
      name: 'secret documents',
      description:
        'A sealed envelope containing important legal documents and testimonies. ' +
        'The papers inside appear to be evidence related to a past court case.',
    })
  }

  override examine(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_READ_SQUIRES_DIARY)) {
      return (
        'You examine the sealed documents carefully. They appear to be official legal ' +
        'papers and testimonies from some kind of court case or military tribunal, but ' +
        "without more context about what you're looking for, you can't make sense of " +
        "their significance. The names and details mentioned don't mean anything to " +
        'you at the moment.'
      )
    }

    // Set flag that the secret documents have been examined after reading the diary
    gameState.setStoryFlag(FLAG_EXAMINED_SECRET_DOCUMENTS, true)

    return (
      'The documents contain sworn testimonies and legal evidence proving that Sir ' +
      'Cedric was falsely accused of cowardice during a past battle. The papers show ' +
      'he was actually protecting civilians and following direct orders from his ' +
      'commanding officer. This evidence would completely clear his name and restore ' +
      'his honor.'
    )
  }
}
