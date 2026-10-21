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
 * talks repeat what opens the paths and where the nymphs are. The sprites
 * finish each other's sentences.
 */
export class ForestSprites extends Character {
  riddlesQuestGiven = false

  constructor() {
    super({
      name: 'forest sprites',
      description:
        'Motes of light no bigger than a thumbnail, each with wings like a ' +
        'split beech-nut husk. They never all hold still at once.',
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

  /**
   * Offer the riddles quest on the first talk; every talk ends with the path
   * line. The sprites finish each other's sentences.
   */
  override talkTo(gameState: GameState): string {
    const name = this.name
    const eventMsg = event('You approach the ' + characterName(name) + '.')
    if (!this.riddlesQuestGiven) {
      // Give the Forest Guardian's Riddles quest
      this.riddlesQuestGiven = true
      gameState.setStoryFlag(FLAG_FOREST_GUARDIANS_RIDDLES_OFFERED, true)
      return (
        eventMsg +
        '\n' +
        speech(
          "'A traveller—' '—with muddy boots—' '—wanting the deep paths.'",
        ) +
        '\n\n' +
        speech(
          "'And the nymphs have riddles—' '—east of here—' '—if you're " +
            "clever.'",
        ) +
        '\n\n' +
        this.pathLine(gameState)
      )
    } else {
      // Subsequent conversations repeat the way on
      return (
        eventMsg +
        '\n' +
        speech(
          "'Back again—' '—did you forget?' 'Nymphs are east—' '—with their " +
            "riddles.'",
        ) +
        '\n\n' +
        this.pathLine(gameState)
      )
    }
  }

  /** Study the sprites more closely. */
  override examine(_gameState: GameState): string {
    return event(
      'You study the ' +
        characterName(this.name) +
        ` more closely. ${this.description} The longer you watch, the more ` +
        'it seems they are watching you back.',
    )
  }
}
