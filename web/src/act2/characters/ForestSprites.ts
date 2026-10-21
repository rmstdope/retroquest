import {
  Character,
  type GameState,
  characterName,
  event,
  speech,
} from '@/engine'
import {
  FLAG_ENHANCED_LANTERN_USED_FOREST_ENTRANCE,
  FLAG_FOREST_GUARDIANS_RIDDLES_OFFERED,
  FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE,
} from '../Act2StoryFlags'

/**
 * Playful threshold guardians who offer the Forest Guardian's Riddles quest.
 *
 * The first interaction sets FLAG_FOREST_GUARDIANS_RIDDLES_OFFERED; later
 * dialogues give directional hints (Ancient Grove, Whispering Glade).
 */
export class ForestSprites extends Character {
  riddlesQuestGiven = false

  constructor() {
    super({
      name: 'forest sprites',
      description:
        'Tiny, luminescent beings that dance through the air like living sparks ' +
        'of light. These mischievous but benevolent forest spirits appear as ' +
        'glowing wisps with delicate, translucent wings. They speak in chiming ' +
        'voices that sound like wind chimes in a gentle breeze, and their ' +
        'presence fills the air with a sense of ancient magic and playful ' +
        'wisdom.',
    })
  }

  /**
   * The sprites' closing line about the south path, finishing each other's
   * sentences: a tease before the charm, a remark on the light when only the
   * lantern is lit, and a step aside once the charm is used.
   */
  private pathLine(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE)) {
      return (
        speech("'The hermit's mark—'") +
        '\n\n' +
        speech("'—we see it, we see it—'") +
        '\n\n' +
        speech("'—so the grove path is yours. No tricks.'")
      )
    }
    if (gameState.getStoryFlag(FLAG_ENHANCED_LANTERN_USED_FOREST_ENTRANCE)) {
      return (
        speech("'Pretty light! Pretty light—'") +
        '\n\n' +
        speech("'—but it won't walk you past us.'")
      )
    }
    return (
      speech("'The grove path? Walk it, walk it—'") +
      '\n\n' +
      speech("'—round and round—'") +
      '\n\n' +
      speech("'—and back you come! Unless you wear the hermit's mark.'")
    )
  }

  /** Offer the riddles quest on the first talk; every talk ends with the path line. */
  override talkTo(gameState: GameState): string {
    const name = this.name
    const eventMsg = event('You approach the ' + characterName(name) + '.')
    if (!this.riddlesQuestGiven) {
      // Give the Forest Guardian's Riddles quest
      this.riddlesQuestGiven = true
      gameState.setStoryFlag(FLAG_FOREST_GUARDIANS_RIDDLES_OFFERED, true)
      return (
        eventMsg +
        '\nThe ' +
        characterName(name) +
        ' flutter around you in a sparkling dance, their chiming voices ' +
        'creating a melodic chorus. ' +
        speech(
          "'Welcome, traveler, to the threshold of the deep forest! We are " +
            'the guardians of the ancient paths, keepers of riddles and ' +
            "secrets old.'",
        ) +
        '\n\n' +
        speech(
          "'If you would venture deeper into our sacred realm, you must " +
            'prove your wisdom and understanding of forest ways. Seek the ' +
            'Ancient Grove where the silver-barked tree holds court, and ' +
            'beyond that, the Whispering Glade where the water spirits dwell. ' +
            'Answer their riddles, and you shall earn the right to walk freely ' +
            "among the deepest mysteries of our forest.'",
        ) +
        '\n\n' +
        this.pathLine(gameState)
      )
    } else {
      // Subsequent conversations provide guidance
      return (
        eventMsg +
        '\nThe ' +
        characterName(name) +
        ' continue their eternal dance, chiming softly. ' +
        this.pathLine(gameState)
      )
    }
  }

  /** Study the sprites more closely. */
  override examine(_gameState: GameState): string {
    const name = this.name
    return event(
      'You study the ' +
        characterName(name) +
        ` more closely. ${this.description} They seem to be composed of ` +
        'pure forest magic, ancient guardians who have watched over these ' +
        'woods since the earliest days. Their dance follows patterns that ' +
        'mirror the movement of leaves in the wind and the flow of streams ' +
        'through the forest.',
    )
  }
}
