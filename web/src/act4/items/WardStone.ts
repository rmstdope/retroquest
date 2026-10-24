import { Item, type GameState } from '@/engine'
import {
  FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED,
  FLAG_ACT4_SHATTERED_WARD_GUARDIANS_STARTED,
} from '../Act4StoryFlags'

/** Which of the three ward stones before the gates this is. */
export type WardStoneSide = 'left' | 'middle' | 'right'

/** The lines of one stone while the gates stand, and once they have fallen. */
const ON_THE_BEAT = ' swells and fades with the barrier, exactly on the beat.'
const OUT_OF_TIME =
  'The right stone brightens a breath after the barrier does, every time, ' +
  'like a man who has lost count.'

/**
 * One of the three ward stones. Two keep the barrier's time; the right one
 * is a breath behind, and light cast on it is what brings the gates down.
 */
export class WardStone extends Item {
  side: WardStoneSide

  constructor(side: WardStoneSide) {
    super({
      name: `${side[0].toUpperCase()}${side.slice(1)} Stone`,
      description: `The ${side} ward stone, carved with the same runes as the others.`,
      canBeCarried: false,
    })
    this.side = side
  }

  /** The player may say "left stone" or "left ward stone". */
  override answersTo(name: string): boolean {
    const wanted = name.toLowerCase()
    return (
      super.answersTo(name) ||
      wanted === `${this.side} ward stone` ||
      wanted === `${this.side} stone`
    )
  }

  /** Whether the guardians' hold on the gates is already broken. */
  private isDark(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED)
  }

  /** The stone's look: on the beat or a breath behind, then dark. The first look starts the quest. */
  override examine(gameState: GameState): string {
    if (this.isDark(gameState)) {
      return `The ${this.side} stone is dark.`
    }
    gameState.setStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_STARTED, true)
    if (this.side === 'right') return OUT_OF_TIME
    return `The ${this.side} stone${ON_THE_BEAT}`
  }
}
