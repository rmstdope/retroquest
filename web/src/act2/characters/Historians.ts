import {
  Character,
  type GameState,
  type Item,
  characterName,
  speech,
} from '@/engine'
import {
  FLAG_SHOWED_JOURNAL_TO_HISTORIANS,
  FLAG_READ_TRAVELERS_JOURNAL,
  FLAG_RESEARCHED_FAMILY_HERITAGE,
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
    if (gameState.getStoryFlag(FLAG_RESEARCHED_FAMILY_HERITAGE)) {
      return (
        characterName(name) +
        ': ' +
        speech(
          'We checked the Willowbrook roll against his notes. One page is ' +
            'gone from it, cut out at the binding, and long ago by the look ' +
            'of it. The year you were born. His notes stop at the same ' +
            'place. Whatever he came for, someone hid it from him before he ' +
            'ever sat down.',
        )
      )
    }
    if (gameState.getStoryFlag(FLAG_SHOWED_JOURNAL_TO_HISTORIANS)) {
      return (
        characterName(name) +
        ': ' +
        speech(
          'Search the archive with us. If a thief has been at our shelves, ' +
            'we want to know what else he read.',
        )
      )
    } else {
      return (
        characterName(name) +
        ': ' +
        speech(
          'Welcome to the historical archives. We maintain records of ' +
            'regional history, family genealogies, and ancient chronicles. Do ' +
            "you have any historical documents or artifacts you'd like us to " +
            'examine?',
        ) +
        '\n\nOne of them adds, more quietly:\n\n' +
        speech(
          'We have searched every record for a king who simply vanished from his ' +
            "own bed. There is none, not in all of Greendale's history.",
        )
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
        characterName(histName) +
        '. They turn the pages slowly at first, then faster. One of them ' +
        'goes pale.[/success]'
      const speaker = characterName(histName) + ': '
      return (
        successMsg +
        '\n\n' +
        speaker +
        speech(
          'These are our birth rolls. Copied line for line, and that sketch ' +
            'is drawn from one of our own pages. Nobody has leave to copy ' +
            'the birth rolls. Nobody!',
        ) +
        '\n\n' +
        speaker +
        speech(
          'Whoever wrote this sat at our shelves. Search the archive with ' +
            'us; we will show you what he read.',
        )
      )
    } else {
      return super.giveItem(gameState, item)
    }
  }
}
