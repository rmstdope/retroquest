import {
  Character,
  type GameState,
  type Item,
  characterName,
  dialogue,
  type NameOptions,
} from '@/engine'
import {
  FLAG_COURT_HERALD_FORMAL_PRESENTATION,
  FLAG_COURT_HERALD_OATH_LINE_SAID,
  FLAG_RESEARCHED_FAMILY_HERITAGE,
} from '../Act2StoryFlags'
import { FOUNDING_OATH } from '../oath'
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
        'An official in a tabard stiff with gold thread, standing at a ' +
        'lectern with the court ledger open on it. He reads every seal twice.',
    })
  }

  /** Handle giving items to the Court Herald. */
  override giveItem(gameState: GameState, item: Item): string {
    if (item instanceof EntryPass) {
      // Set the formal presentation flag
      gameState.setStoryFlag(FLAG_COURT_HERALD_FORMAL_PRESENTATION, true)

      return (
        `The ${characterName('Court Herald')} reads the seal twice and never looks at the line ` +
        'above it.' +
        '\n' +
        dialogue(
          this.name,
          'The seal of Greendale, in good order. I hereby present you to the ' +
            'court, and enter you in the ledger. The archives are open to ' +
            'you; the historians keep them.',
        )
      )
    } else {
      // Default behavior for other items
      return super.giveItem(gameState, item)
    }
  }

  /**
   * His usual talk, and on the first talk after the archive search is done,
   * once, the oath he read at the king's crowning.
   */
  override talkTo(gameState: GameState): string {
    const due =
      gameState.getStoryFlag(FLAG_RESEARCHED_FAMILY_HERITAGE) &&
      !gameState.getStoryFlag(FLAG_COURT_HERALD_OATH_LINE_SAID)
    const usual = this.usualTalk(gameState)
    if (!due) return usual
    gameState.setStoryFlag(FLAG_COURT_HERALD_OATH_LINE_SAID, true)
    return (
      usual +
      '\n\n' +
      dialogue(
        this.name,
        `I read the oath at His Majesty's crowning. '${FOUNDING_OATH}' I ` +
          'did not know who the Wardens were. I am told you do.',
      )
    )
  }

  /** Return dialogue for the Court Herald depending on presentation flag state. */
  private usualTalk(gameState: GameState): string {
    const name = this.name
    if (gameState.getStoryFlag(FLAG_COURT_HERALD_FORMAL_PRESENTATION)) {
      return dialogue(
        name,
        'You are entered in the ledger, and the archives are open to you. ' +
          'The historians know the shelves; ask them where to look. Petitions that ' +
          "were the king's go to the Lord Commander now, by his order, until His " +
          'Majesty is found.',
      )
    } else {
      return dialogue(
        name,
        'Presentations to the court come through me, and nobody reads in ' +
          'the archives unpresented. If you carry a pass, hand it to me and I ' +
          "will enter you. Petitions that were the king's go to the Lord Commander " +
          'now, by his order, until His Majesty is found.',
      )
    }
  }
}
