import { Item, type GameState, characterName, event } from '@/engine'
import { FLAG_READ_TRAVELERS_JOURNAL } from '../Act2StoryFlags'

/** A family journal containing genealogies and lore about Willowbrook and ley sites. */
export class TravelersJournal extends Item {
  constructor() {
    super({
      name: "traveler's journal",
      shortName: 'journal',
      description:
        'A well-worn leather journal containing historical notes, family genealogies, ' +
        'and references to ancient bloodlines. Several passages mention Willowbrook ' +
        'and its significance in regional history.',
      canBeCarried: true,
    })
  }

  override use(gameState: GameState): string {
    // Set flag to indicate the journal has been read
    gameState.setStoryFlag(FLAG_READ_TRAVELERS_JOURNAL, true)
    return (
      event(
        "You carefully open the weathered traveler's journal and begin " +
          'reading the faded entries...',
      ) +
      '\n\nThe journal belongs to ' +
      characterName('Lysander Ravencrest') +
      ', a distant ancestor who traveled these lands centuries ago. His ' +
      "elegant script reveals fascinating details about your family's " +
      "ancient heritage:\n\n*'The bloodline of Ravencrest has long been " +
      'tied to the mystical energies that flow through Willowbrook and ' +
      'its surrounding lands. We are not mere wanderers, but guardians ' +
      'of an ancient pact - keepers of balance between the mortal realm ' +
      'and the forces beyond. The village of Willowbrook sits upon a ' +
      'convergence of ley lines, making it a focal point for both ' +
      "protective and destructive magics.'*\n\n*'I have documented the " +
      'locations of several hidden sanctuaries and the bloodline ' +
      'connections to various noble houses throughout the region. The ' +
      'Ravencrest family crest - a silver tree beneath twin moons - can ' +
      'be found carved into stone markers at sites of power. These ' +
      'markers serve as keys to accessing restricted archives in the ' +
      "great libraries.'*\n\n*'Should any of my descendants find " +
      'themselves in need of answers about our heritage, this journal ' +
      'contains references and genealogical charts that will grant them ' +
      'access to the deepest historical records. The knowledge within ' +
      'could prove vital when darkness stirs again, as the ancient ' +
      "prophecies foretell it inevitably will.'*\n\n" +
      event(
        'The journal is filled with detailed maps, family trees, and ' +
          'scholarly references that would serve as excellent credentials ' +
          'when researching historical documents in libraries, archives, or ' +
          'when speaking with historians and scholars. The information ' +
          'clearly establishes your noble ancestry and legitimate claim to ' +
          'accessing restricted historical records.',
      )
    )
  }
}
