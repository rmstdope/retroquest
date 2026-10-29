import { Item, characterName, type GameState } from '@/engine'
import { FLAG_ACT3_FORTRESS_GATES_EXAMINED } from '../Act3StoryFlags'

/** The iron gates of Malakar's fortress, carved with sigils that seem to move. */
export class FortressGates extends Item {
  constructor() {
    super({
      name: 'fortress gates',
      shortName: 'gates',
      description:
        'Gates of blackened iron, taller than a house, carved with sigils ' +
        'that seem to move at the edge of sight. Through the lattice, ' +
        'corridors run into the dark.',
      canBeCarried: false,
    })
  }

  /** Handle examining the fortress gates. */
  override examine(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_ACT3_FORTRESS_GATES_EXAMINED)) {
      gameState.setStoryFlag(FLAG_ACT3_FORTRESS_GATES_EXAMINED, true)
      return (
        'The gates are taller than a house, and the sigils on them seem to ' +
        'move at the edge of sight. Beyond the lattice, corridors run into ' +
        'the dark. Somewhere in there is King Alden.\n\n' +
        'The [item_name]ancient amulet[/item_name] is warm against your palm. ' +
        'You came on this journey believing Malakar took your parents from ' +
        'you. You know better now. ' +
        `${characterName('Aren')} and ${characterName('Lysa')} were his ` +
        'closest friends, and the ward they became is still holding.\n\n' +
        'The Dragon said they were warded away, not dead. You do not yet ' +
        'know what that means.\n\n' +
        'In your pack, the lifelight elixir is warm. ' +
        '[bold]Act III is complete.[/bold] The final confrontation awaits.'
      )
    } else {
      return 'The gates stand shut. Somewhere beyond them is the king.'
    }
  }
}
