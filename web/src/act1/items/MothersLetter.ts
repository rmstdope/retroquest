import { Item, type GameState, characterName, writing } from '@/engine'
import { FLAG_READ_MOTHERS_LETTER } from '../Act1StoryFlags'

/**
 * A water-stained fragment of a letter from Elior's mother, left in a tin
 * under the smooth stone at the river bend. Reading it completes the Faded
 * Photograph quest.
 */
export class MothersLetter extends Item {
  constructor() {
    super({
      name: "mother's letter",
      shortName: 'letter',
      description:
        "A fragment of a letter, water-stained at the edges, in your mother's hand:" +
        writing(
          `My dearest ${characterName('Elior')}, if you are reading this, ` +
            'you found the bend, as I knew you would. ' +
            'The river remembers what the village forgets.\n' +
            `A man called ${characterName('Malakar')} has been asking about ` +
            'Willowbrook, and about our line. Do not answer him. ' +
            `${characterName('Mira')} keeps the amulet for you. ` +
            'When you are ready, it will know you.\n' +
            'Your father and I',
        ) +
        '\nThe rest has blurred away in the water stains.',
      canBeCarried: true,
    })
  }

  /** Reading the letter sets FLAG_READ_MOTHERS_LETTER. */
  override examine(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_READ_MOTHERS_LETTER, true)
    return super.examine(gameState)
  }

  /** Using the letter reads it, the same as examining it. */
  override use(gameState: GameState): string {
    return this.examine(gameState)
  }
}
