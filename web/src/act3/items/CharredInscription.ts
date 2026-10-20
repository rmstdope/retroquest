import { Item, type GameState } from '@/engine'
import { FLAG_ACT3_CHARRED_INSCRIPTION_READ } from '../Act3StoryFlags'

/** A charred inscription etched into cooled lava, part of the Hidden Bond story. */
export class CharredInscription extends Item {
  constructor() {
    super({
      name: 'Charred Inscription',
      description:
        'Words burned deep into cooled lava, the letters blackened by ' +
        'intense heat. The inscription speaks of a ward forged in desperation, ' +
        'written by hands that knew time was running short.',
      canBeCarried: false,
      shortName: 'inscription',
    })
  }

  /** Examine the inscription to read its message. */
  override examine(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ)) {
      gameState.setStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ, true)
    }

    return (
      '[event]You trace the charred letters with your finger, feeling the ' +
      'heat that once shaped them. The inscription reads:[/event]\n\n' +
      "[dim]'In fire and flame we forge the final ward. Should our son " +
      'face the darkness we once served, let him know that love burns ' +
      'brighter than any shadow. The binding is set in three parts: ' +
      'courage from the depths, wisdom from the heights, and sacrifice ' +
      "from the heart. When united, they shall be his shield.'[/dim]\n\n" +
      '[event]The words seem to pulse with warmth, as if the love that ' +
      'wrote them still burns in the stone.[/event]'
    )
  }
}
