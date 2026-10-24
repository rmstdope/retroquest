import { Item, type GameState, writing } from '@/engine'
import { FLAG_READ_TRAVELERS_JOURNAL } from '../Act2StoryFlags'

/**
 * The notebook of the grey-cloaked stranger who lodged at the Silver Stag:
 * notes copied from the castle archive. Nothing in it says whose it is.
 */
export class TravelersJournal extends Item {
  constructor() {
    super({
      name: "traveler's journal",
      shortName: 'journal',
      description:
        'A plain leather journal, its cover rubbed grey at the corners. ' +
        'There is no name inside. The pages are crowded with notes in a ' +
        'small, careful hand, and many of them look copied from somewhere ' +
        'else.',
      canBeCarried: true,
    })
  }

  /** Read the stranger's notes; sets the read flag and shows the same text every time. */
  override use(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_READ_TRAVELERS_JOURNAL, true)
    return (
      "There is no name inside the cover of the weathered traveler's " +
      'journal, only page after page in a small, careful hand.' +
      '\n\n' +
      writing(
        "'Third night in Greendale. The archivists doze at their desks. " +
          "The birth rolls of Willowbrook were easy enough to reach.'",
      ) +
      '\n\n' +
      writing(
        "'Copied: the families who came to Willowbrook from elsewhere. " +
          "Ten I can trace. One I cannot follow past the village gate.'",
      ) +
      '\n\n' +
      writing(
        "'Called at the healer's hut. The amulet is not with her, she " +
          "says. She lies well.'",
      ) +
      '\n\n' +
      writing("'The innkeeper grows curious. I leave tonight.'") +
      '\n\n' +
      'Below the notes, a sketch, drawn twice over: a sun rising over three ' +
      'linked rings. Beside it, a question mark, pressed so hard the nib ' +
      'has torn the page.' +
      '\n\n' +
      "Whoever wrote this had sat with the castle's own records, and read " +
      'them closely. The historians in the Great Hall would know where ' +
      'these notes were copied from.'
    )
  }
}
