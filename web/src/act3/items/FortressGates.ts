import { Item, characterName, type GameState } from '@/engine'
import { FLAG_ACT3_FORTRESS_GATES_EXAMINED } from '../Act3StoryFlags'

/** The massive gates of Malakar's fortress, bound with eldritch wards. */
export class FortressGates extends Item {
  constructor() {
    super({
      name: 'fortress gates',
      shortName: 'gates',
      description:
        'Massive blackened iron gates tower above, carved with sigils that ' +
        'writhe and pulse with dark energy. Beyond the lattice, malevolent ' +
        'corridors stretch into shadow.',
      canBeCarried: false,
    })
  }

  /** Handle examining the fortress gates. */
  override examine(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_ACT3_FORTRESS_GATES_EXAMINED)) {
      gameState.setStoryFlag(FLAG_ACT3_FORTRESS_GATES_EXAMINED, true)
      return (
        'The fortress gates tower above you. ' +
        'Their blackened iron is carved with sigils that seem to writhe in ' +
        'the corner of your vision. Beyond the lattice, you glimpse corridors ' +
        "that pulse with malevolent energy. This is the threshold of Malakar's " +
        "domain—where King Alden is held captive and the kingdom's fate will " +
        'be decided.\n\n' +
        'The [item_name]ancient amulet[/item_name] is warm against your palm. ' +
        'You came on this journey believing Malakar took your parents from ' +
        'you. You know better now. ' +
        `${characterName('Aren')} and ${characterName('Lysa')} were his ` +
        'closest friends, and the ward they became is still holding.\n\n' +
        'The Dragon said they were warded away, not dead. You do not yet ' +
        'know what that means.\n\n' +
        'The lifelight elixir pulses with protective power, ready to shield ' +
        "you from the sorcerer's influence. " +
        '[bold]Act III is complete.[/bold] The final confrontation awaits.'
      )
    } else {
      return (
        'The gates stand ' +
        'ready to be breached. The weight of destiny presses down as you ' +
        'prepare for the final assault.'
      )
    }
  }
}
