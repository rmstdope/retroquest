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
        'A hall of living stone opens beyond sight, its ceiling lost in ' +
        'shadow. Embers burn slowly along the floor, pulsing like a heartbeat, ' +
        'and somewhere in the dark, water drips. Rings of old sigils spiral ' +
        'across the black tiles around the Ancient Dragon. It lies coiled at ' +
        'the centre, scales like polished obsidian, and each slow breath hums ' +
        'in your bones.',
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
