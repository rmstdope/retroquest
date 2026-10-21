import { Item, type GameState, event } from '@/engine'

/** The voices of the Hall of Echoes: scenery that gives the plain clue. */
export class Echoes extends Item {
  constructor() {
    super({
      name: 'Echoes',
      description:
        'You stand still and listen. Beneath the battle cries and laments, ' +
        'one voice repeats the same words over and over, patient as a ' +
        "heartbeat: 'Carry our voices into the glass. Where the servants' " +
        "light and the echoes meet, the true path shows itself.'",
      canBeCarried: false,
    })
  }

  /** The echoes say the same thing every time. */
  override examine(_gameState: GameState): string {
    return event(this.description)
  }
}
