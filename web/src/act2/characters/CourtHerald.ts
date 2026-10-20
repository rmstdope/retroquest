import { Character, type GameState, type Item } from '@/engine'
import { FLAG_COURT_HERALD_FORMAL_PRESENTATION } from '../Act2StoryFlags'
import { EntryPass } from '../items/EntryPass'

/** Official who manages court presentations and grants archive access. */
export class CourtHerald extends Character {
  constructor() {
    super({
      name: 'court herald',
      description:
        'An elaborately dressed official who manages formal presentations and ' +
        'ceremonies at court. He scrutinizes documents and credentials with ' +
        'practiced expertise.',
    })
  }

  /** Handle giving items to the Court Herald. */
  override giveItem(gameState: GameState, item: Item): string {
    if (item instanceof EntryPass) {
      // Set the formal presentation flag
      gameState.setStoryFlag(FLAG_COURT_HERALD_FORMAL_PRESENTATION, true)

      const itemName = item.name
      const heraldName = this.name
      const eventMsg =
        `[event]You present the [item_name]${itemName}[/item_name] to the ` +
        `[character_name]${heraldName}[/character_name].[/event]`
      const announcement =
        `[character_name]${heraldName}[/character_name]: [dialogue]Excellent! This is a ` +
        'properly certified entry pass. I hereby formally present you to the ' +
        'court and grant you access to our historical archives.'
      const announcementTail =
        'Your credentials are now on record, and you may research freely in ' +
        'our collections.[/dialogue]'
      return eventMsg + '\n' + announcement + ' ' + announcementTail
    } else {
      // Default behavior for other items
      return super.giveItem(gameState, item)
    }
  }

  /** Return dialogue for the Court Herald depending on presentation flag state. */
  override talkTo(gameState: GameState): string {
    const name = this.name
    if (gameState.getStoryFlag(FLAG_COURT_HERALD_FORMAL_PRESENTATION)) {
      return (
        `[character_name]${name}[/character_name]: [dialogue]You have been formally ` +
        'presented to the court and your credentials are on record. You may ' +
        'access the historical archives and speak with court historians ' +
        'about your research.[/dialogue]'
      )
    } else {
      return (
        `[character_name]${name}[/character_name]: [dialogue]I handle formal presentations ` +
        'and credentials for court access. If you wish to research in the ' +
        "historical archives or speak with court officials, you'll need proper " +
        'documentation of your standing.[/dialogue]'
      )
    }
  }
}
