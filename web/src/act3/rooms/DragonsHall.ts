import { Room, type GameState } from '@/engine'
import { AncientDragon } from '../characters/AncientDragon'
import { Sigils } from '../items/Sigils'
import {
  FLAG_ACT3_DRAGONS_MEMORY_RECEIVED,
  FLAG_ACT3_DRAGONS_SCALE_ACQUIRED,
  FLAG_ACT3_SIGILS_MENDED,
} from '../Act3StoryFlags'

/** What the room gains once the scale is taken: the prison weakens. */
const CRACKED_LINE =
  'Where the scale lay, the sigils around the dragon have dimmed, and a ' +
  'hairline crack runs through the nearest ring.'

/** What the room gains instead once the sigils are mended. */
const MENDED_LINE = 'The sigils around the dragon burn steady and whole again.'

/** The sentence the room gains once the curse has shown itself here. */
const CURSE_LINE =
  'The old dripping has stopped; from the mines beyond comes no sound of ' +
  'picks at all.'

/** A vast chamber lit by slow-breathing embers beneath scaled coils. */
export class DragonsHall extends Room {
  constructor() {
    super({
      name: "Dragon's Hall",
      description:
        'A cathedral of living stone where time itself seems to bow in reverence, ' +
        'this vast chamber stretches beyond mortal comprehension beneath a vaulted ' +
        'ceiling lost in eternal shadow. Primordial embers burn with slow, hypnotic ' +
        'rhythm along the floor, their amber light pulsing like the heartbeat of ' +
        'the earth itself as they illuminate the massive coils of an ancient being. ' +
        'Arcane sigils of forgotten civilizations spiral across obsidian tiles in ' +
        'intricate patterns that seem to shift and breathe when glimpsed from the ' +
        'corner of your eye, each rune thrumming with power that predates human ' +
        'memory. The air itself shimmers with residual magic, thick with the scent ' +
        'of ozone, aged parchment, and something indefinably ancient that speaks ' +
        "to the deepest parts of your soul. At the chamber's sacred heart, the " +
        'Ancient Dragon rests in timeless majesty, its scales gleaming like ' +
        'polished obsidian kissed by starfire, each breath sending ripples of ' +
        'power through the mystical atmosphere that makes your very bones resonate ' +
        'with otherworldly harmonics.',
      items: [new Sigils()],
      characters: [new AncientDragon()],
      exits: { west: 'StillnessVestibule' },
    })
  }

  /**
   * The description, ending with the curse's mark once the clue is found,
   * then the cracked sigils once the scale is taken (or the mended ones).
   */
  override descriptionFor(gameState: GameState): string {
    let text = this.description
    if (gameState.getStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED)) {
      text = `${text} ${CURSE_LINE}`
    }
    if (gameState.getStoryFlag(FLAG_ACT3_SIGILS_MENDED)) {
      text = `${text} ${MENDED_LINE}`
    } else if (gameState.getStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED)) {
      text = `${text} ${CRACKED_LINE}`
    }
    return text
  }
}
