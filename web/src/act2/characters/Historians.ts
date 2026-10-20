import { Character, type GameState, type Item } from '@/engine'
import {
  FLAG_SHOWED_JOURNAL_TO_HISTORIANS,
  FLAG_READ_TRAVELERS_JOURNAL,
} from '../Act2StoryFlags'
import { TravelersJournal } from '../items/TravelersJournal'

/** Group of scholars who validate lore and inspect historical documents. */
export class Historians extends Character {
  constructor() {
    super({
      name: 'historians',
      description:
        "A group of learned scholars who maintain the court's historical records and " +
        'genealogical archives. They are eager to examine any historical documents or ' +
        'artifacts.',
    })
  }

  /** Return appropriate dialogue when the player talks to the Historians. */
  override talkTo(gameState: GameState): string {
    const name = this.name
    if (gameState.getStoryFlag(FLAG_SHOWED_JOURNAL_TO_HISTORIANS)) {
      const prefix =
        `[character_name]${name}[/character_name]: ` +
        '[dialogue]The journal you showed us was most '
      return (
        prefix +
        "illuminating! The references to Willowbrook's bloodlines confirm what " +
        'we suspected from the ancient chronicles. Your heritage appears to be ' +
        'quite significant indeed.[/dialogue]'
      )
    } else {
      return (
        `[character_name]${name}[/character_name]: [dialogue]Welcome to the historical ` +
        'archives. We maintain records of regional history, family genealogies, and ' +
        "ancient chronicles. Do you have any historical documents or artifacts you'd " +
        'like us to examine?[/dialogue]'
      )
    }
  }

  /** Handle giving items to the Historians. */
  override giveItem(gameState: GameState, item: Item): string {
    if (item instanceof TravelersJournal) {
      if (!gameState.getStoryFlag(FLAG_READ_TRAVELERS_JOURNAL)) {
        return (
          '[failure]You should not give things away that you know nothing about. ' +
          'Perhaps you should ensure that you understand its contents before ' +
          'sharing it with others.[/failure]'
        )
      }

      gameState.setStoryFlag(FLAG_SHOWED_JOURNAL_TO_HISTORIANS, true)
      const histName = this.name
      const itemName = item.name
      const successMsg =
        `[success]You show the [item_name]${itemName}[/item_name] to the ` +
        `[character_name]${histName}[/character_name]. ` +
        'They examine it with great interest, ' +
        'cross-referencing the records. ' +
        'Their study of the genealogical information reveals details ' +
        'that would take ordinary scholars years to compile. ' +
        "[dialogue]'This is fascinating! The journal confirms several theories about " +
        "Willowbrook's significance and provides crucial context for the " +
        "ancient chronicles.'[/dialogue][/success]"
      return successMsg
    } else {
      return super.giveItem(gameState, item)
    }
  }
}
