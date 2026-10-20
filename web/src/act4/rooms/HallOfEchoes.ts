import { Room } from '@/engine'

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
      items: [],
      characters: [],
      exits: { south: 'FortressGates', north: 'TowerOfShadows' },
    })
  }
}
