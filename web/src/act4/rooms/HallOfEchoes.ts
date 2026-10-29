import { Room, type Exits, type GameState, clue } from '@/engine'
import {
  FLAG_ACT4_CEDRIC_FORGAVE,
  FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED,
  FLAG_ACT4_KNIGHT_OF_DESPAIR_STARTED,
} from '../Act4StoryFlags'
import { KnightOfDespair } from '../characters/KnightOfDespair'
import { SirCedricInTheHall } from '../characters/SirCedricInTheHall'
import { Banners } from '../items/Banners'
import { Echoes } from '../items/Echoes'
import { EchoStone } from '../items/EchoStone'
import { GhostlyWarriors } from '../characters/GhostlyWarriors'
import {
  HALL_AFTER_REDEMPTION,
  HALL_BEFORE_REDEMPTION,
  HALL_CEDRIC_AT_DOOR,
  HALL_CEDRIC_ON_STAIR,
  HALL_WARRIORS_SENTENCE,
} from './hallDescriptions'

/**
 * A mystical hall where the voices of the past linger in eternal resonance.
 *
 * Repository of ancient wisdom needed to solve fortress puzzles; the Knight of
 * Despair guards its deeper secrets.
 */
export class HallOfEchoes extends Room {
  constructor() {
    super({
      name: 'Hall of Echoes',
      description: HALL_BEFORE_REDEMPTION,
      items: [new Echoes(), new EchoStone(), new Banners()],
      characters: [new KnightOfDespair(), new SirCedricInTheHall()],
      exits: { south: 'FortressGates', east: 'TowerOfShadows' },
    })
  }

  /**
   * The description, derived from the story rather than read from the stored
   * text so older saves show the current wording: the knight at the stair or
   * kneeling (with the warriors while they remain), and Sir Cedric by the door
   * or, once he forgives, on the stair.
   */
  override descriptionFor(gameState: GameState): string {
    const redeemed = gameState.getStoryFlag(
      FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED,
    )
    const warriors = this.characters.some((c) => c instanceof GhostlyWarriors)
    const forgave = gameState.getStoryFlag(FLAG_ACT4_CEDRIC_FORGAVE)
    return (
      (redeemed ? HALL_AFTER_REDEMPTION : HALL_BEFORE_REDEMPTION) +
      (redeemed && warriors ? HALL_WARRIORS_SENTENCE : '') +
      (forgave ? HALL_CEDRIC_ON_STAIR : HALL_CEDRIC_AT_DOOR)
    )
  }

  /** Entering the hall starts the knight's side quest. */
  override onEnter(gameState: GameState): void {
    gameState.setStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_STARTED, true)
  }

  /** The way back south is always open; the stair east once the knight is redeemed. */
  override getExits(gameState: GameState): Exits {
    if (!gameState.getStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED)) {
      return { south: this.exits.south }
    }
    return { south: this.exits.south, east: this.exits.east }
  }

  /** The knight blocks the stair to the Tower of Shadows. */
  override blockedExit(gameState: GameState, direction: string): string | null {
    if (direction !== 'east') return null
    if (gameState.getStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED))
      return null
    return clue(
      'The Knight of Despair stands before the stair to the tower. ' +
        'He does not lift his sword. He simply does not move, and there is no ' +
        'way past him.',
    )
  }
}
