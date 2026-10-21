import { Item, type GameState, event } from '@/engine'
import { FLAG_ACT4_SHATTERED_WARD_GUARDIANS_STARTED } from '../Act4StoryFlags'

/** Ancient ward stones that anchor the fortress's magical defenses. */
export class WardStones extends Item {
  constructor() {
    super({
      name: 'Ward Stones',
      description:
        'Four pillars of black stone, carved with runes and glowing a steady ' +
        'violet. They stand exactly as far apart as each other, and the ' +
        'guardians never stray from the lines between them.',
      canBeCarried: false,
    })
  }

  /** Examine the ward stones; the first look starts the guardians quest. */
  override examine(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_STARTED, true)
    return event(
      'You look at each stone in turn. The runes are cut deep and even, the ' +
        'same hand on every one. Only one stone is not quite perfect: a corner ' +
        'has broken away, and the piece lies at its foot. Its light stutters ' +
        'where the others hold steady.',
    )
  }
}
