import {
  Character,
  type GameState,
  type Item,
  dialogue,
  type NameOptions,
} from '@/engine'
import { FLAG_COURT_HERALD_FORMAL_PRESENTATION } from '../Act2StoryFlags'
import { EntryPass } from '../items/EntryPass'

/** Official who manages court presentations and grants archive access. */
export class CourtHerald extends Character {
  /** Named by what it is, so it reads "the …" (see `nameInSentence`). */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, common: true })
  }

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

      const heraldName = this.name
      const announcement =
        'Excellent! This is a ' +
        'properly certified entry pass. I hereby formally present you to the ' +
        'court and grant you access to our historical archives.'
      const announcementTail =
        'Your credentials are now on record, and you may research freely in ' +
        'our collections.'
      return dialogue(heraldName, announcement + ' ' + announcementTail)
    } else {
      // Default behavior for other items
      return super.giveItem(gameState, item)
    }
  }

  /** Return dialogue for the Court Herald depending on presentation flag state. */
  override talkTo(gameState: GameState): string {
    const name = this.name
    if (gameState.getStoryFlag(FLAG_COURT_HERALD_FORMAL_PRESENTATION)) {
      return dialogue(
        name,
        'You have been formally presented to the court and your ' +
          'credentials are on record. You may access the historical archives ' +
          'and speak with court historians about your research. Petitions that ' +
          "were the king's go to the Lord Commander now, by his order, until His " +
          'Majesty is found.',
      )
    } else {
      return dialogue(
        name,
        'I handle formal presentations and credentials for court access. ' +
          'If you wish to research in the historical archives or speak with ' +
          "court officials, you'll need proper documentation of your " +
          "standing. Petitions that were the king's go to the Lord Commander " +
          'now, by his order, until His Majesty is found.',
      )
    }
  }
}
