import { Item, type GameState, dialogue, effect } from '@/engine'
import { MAZE_ROUTE } from '../rooms/MirrorLabyrinth'

/** The voices of the Hall of Echoes: scenery that gives the route through the maze. */
export class Echoes extends Item {
  constructor() {
    super({
      name: 'Echoes',
      description:
        effect('You stand still and listen.') +
        ' Beneath the battle cries and laments, ' +
        'one voice repeats the same words over and over, patient as a ' +
        'heartbeat:',
      canBeCarried: false,
    })
  }

  /** The echoes give the route through the maze, the same every time. */
  override examine(_gameState: GameState): string {
    return this.description + '\n' + dialogue('an echo', `'${MAZE_ROUTE}'`)
  }
}
