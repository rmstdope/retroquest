import { Character, type GameState, dialogue } from '@/engine'
import {
  FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED,
  FLAG_ACT4_WHISPERS_MIRA_NAMED,
} from '../Act4StoryFlags'

/** What Mira says while the violet wall stands. */
const WALL_UP_LINE =
  "I'm fine. My hands will stop in a while. Go on. I'm not going anywhere."

/** What Mira says once the wall has fallen. */
const WALL_DOWN_LINE =
  "The way out stays open. I'll be right here when you come back through it."

/** Her payoff, once, if Elior said her name in the Tower of Shadows. */
const TOWER_LINE =
  "I heard you. Up there, in the dark. I said we'd hear, and I did."

/**
 * Mira at the Fortress Gates, her back to the gatepost; she keeps the way out
 * for the whole act. She never speaks of the ward stones. Her line follows the
 * story flags; the one field remembers that the tower line has been said.
 */
export class MiraAtTheGate extends Character {
  /** Whether she has already said her tower line. */
  towerLineHeard = false

  constructor() {
    super({
      name: 'Mira',
      description:
        'Mira, her back to the gatepost. Her hands are still unsteady from ' +
        'the circle.',
    })
  }

  /**
   * Wall up: one line. Wall down: her resting line, with the tower line once
   * in front of it if Elior named her to the whispers.
   */
  override talkTo(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED)) {
      return dialogue(this.name, WALL_UP_LINE)
    }
    if (
      !this.towerLineHeard &&
      gameState.getStoryFlag(FLAG_ACT4_WHISPERS_MIRA_NAMED)
    ) {
      this.towerLineHeard = true
      return dialogue(this.name, TOWER_LINE)
    }
    return dialogue(this.name, WALL_DOWN_LINE)
  }
}
