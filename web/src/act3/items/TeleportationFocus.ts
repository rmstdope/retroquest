import { Item, characterName, speech, type GameState } from '@/engine'
import { FLAG_ACT3_MIRA_CONFESSED } from '../Act3StoryFlags'

/** Anchor focus for long-range circle magic; non-carriable ritual prism. */
export class TeleportationFocus extends Item {
  constructor() {
    super({
      name: 'teleportation focus',
      shortName: 'focus',
      description:
        "A crystal prism that hums faintly near Mira's spellwork. Facets " +
        'catch stray motes of light and fold them inward, anchoring safe ' +
        'circles across distant thresholds.',
      canBeCarried: false,
    })
  }

  /**
   * Return a descriptive examination of the focus. Once Mira has confessed,
   * a second line follows: the crossed seven Lysa scratched into the prism.
   */
  override examine(gameState: GameState): string {
    const study =
      'Reflections in the prism hover a breath out of sync—each ' +
      "a doorway waiting for Mira's word."
    if (!gameState.getStoryFlag(FLAG_ACT3_MIRA_CONFESSED)) return study
    return (
      study +
      '\n' +
      'Low on one facet, almost lost in the light, someone has scratched ' +
      "a seven with a bar through it. Lysa's hand. Your mother cut " +
      'this prism.'
    )
  }

  /** Prevent pickup, reminding the player of its ritual function. */
  override preventPickup(): string {
    return (
      characterName('Mira') +
      ' steadies the prism. ' +
      speech(
        'Careful. The circle anchors through this focus. I must bear ' +
          'it while the weave stays open.',
      )
    )
  }
}
