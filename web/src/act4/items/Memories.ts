import { Item, type GameState, dialogue, event } from '@/engine'
import {
  FLAG_ACT4_PARENTS_LEGACY_COMPLETED,
  FLAG_ACT4_PARENTS_LEGACY_STARTED,
} from '../Act4StoryFlags'
import { PARENTS_VAULT_AFTER } from '../rooms/vaultDescriptions'

/** The speaker of the one remembered line inside the ward memory. */
const LYSA = 'Lysa'

/**
 * The lanterns of memory in the Parents' Vault. Examining them plays the whole
 * truth once: the quest completes, the room changes and the way north opens.
 */
export class Memories extends Item {
  constructor() {
    super({
      name: 'Memories',
      description:
        'Lantern-like memories hang in the air, warm and still, each with ' +
        'your parents in it.',
      canBeCarried: false,
    })
  }

  /** Also answers to "memory" and "lanterns". */
  override answersTo(name: string): boolean {
    return (
      super.answersTo(name) ||
      ['memory', 'lanterns'].includes(name.toLowerCase())
    )
  }

  /** Plays the scene once; afterwards only a dim line. */
  override examine(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT4_PARENTS_LEGACY_STARTED, true)
    if (gameState.getStoryFlag(FLAG_ACT4_PARENTS_LEGACY_COMPLETED)) {
      return (
        '[dim]The lanterns are dim now. You do not need to look again; you ' +
        'will not forget.[/dim]'
      )
    }
    gameState.setStoryFlag(FLAG_ACT4_PARENTS_LEGACY_COMPLETED, true)
    gameState.currentRoom.description = PARENTS_VAULT_AFTER
    return [
      event(
        'Three young Wardens bent over one workbench: your father, your ' +
          'mother, and a dark-haired man laughing at something Lysa said. ' +
          'Between them lie a crystal, a feather and a scale.',
      ),
      event(
        'A dark year. A fever sweeps the land, and Aren and Lysa fall ill ' +
          'with it. Nothing the Wardens know can heal them. Malakar sits by ' +
          'their beds, reading, searching, unable to wait.',
      ),
      event(
        'Malakar alone in a room full of clocks, tearing the air open to ' +
          'pull back the days before the fever. Aren and Lysa wake, well ' +
          'again. But the wound he opened does not close, and it begins to ' +
          'feed.',
      ),
      event(
        'Your parents before the wound, hands joined, pouring themselves ' +
          'into it until they are only light, bound to the amulet and to the ' +
          'crown of King Alden, so that you would be hidden and the wound ' +
          'held shut.',
      ),
      dialogue(LYSA, 'Hold it shut, Aren. Hide him. That is enough.'),
      event(
        'Last, and smallest: Malakar by a cottage fire in Willowbrook, ' +
          'rocking a baby in his arms and humming. The baby is you.',
      ),
      event(
        'The lanterns dim, one by one, until only the amulet glows in your ' +
          'hand.',
      ),
    ].join('\n')
  }
}
