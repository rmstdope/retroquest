import { Room, type Exits, type GameState } from '@/engine'
import {
  FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED,
  FLAG_ACT4_KNIGHT_OF_DESPAIR_STARTED,
} from '../Act4StoryFlags'
import { KnightOfDespair } from '../characters/KnightOfDespair'
import { Echoes } from '../items/Echoes'
import { EchoStone } from '../items/EchoStone'

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
      description:
        'This vast hall stretches into shadow, its vaulted ceiling lost in darkness ' +
        'above. Every footstep awakens whispers from ages past, as if the very walls ' +
        'have absorbed the voices of countless souls. Ethereal sounds drift through ' +
        'the air—fragments of conversations, battle cries, and laments that seem to ' +
        "come from everywhere and nowhere. At the hall's heart stands a figure in " +
        'tarnished armor, motionless as a statue but radiating an aura of profound sorrow.',
      items: [new Echoes(), new EchoStone()],
      characters: [new KnightOfDespair()],
      exits: { south: 'FortressGates', east: 'TowerOfShadows' },
    })
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
    return (
      '[failure]The Knight of Despair stands before the stair to the tower. ' +
      'He does not lift his sword. He simply does not move, and there is no ' +
      'way past him.[/failure]'
    )
  }
}
