import { Room, type Exits, type GameState } from '@/engine'
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

  /** Only the way back south is open; the stair east waits for the knight. */
  override getExits(_gameState: GameState): Exits {
    return { south: this.exits.south }
  }

  /** The knight blocks the stair to the Tower of Shadows. */
  override blockedExit(
    _gameState: GameState,
    direction: string,
  ): string | null {
    if (direction !== 'east') return null
    return (
      '[failure]The Knight of Despair stands before the stair to the tower. ' +
      'He does not lift his sword. He simply does not move, and there is no ' +
      'way past him.[/failure]'
    )
  }
}
