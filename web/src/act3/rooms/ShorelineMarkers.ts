import { Room } from '@/engine'
import type { GameState } from '@/engine'
import { MoonRuneShards } from '../items/MoonRuneShards'
import { Steles } from '../items/Steles'
import { PolishedShell } from '../items/PolishedShell'
import { FLAG_ACT3_TIDEWARD_SIGILS_STARTED } from '../Act3StoryFlags'

/** Shore location with weathered steles containing moon rune shards. */
export class ShorelineMarkers extends Room {
  /** Whether runes have been revealed here at least once. */
  runesRevealed = false

  constructor() {
    super({
      name: 'Shoreline Markers',
      description:
        'Weathered steles stand in the cold sand, ' +
        'their faces full of shallow marks. ' +
        'Salt has smudged most of the lines, ' +
        'but moon sigils still show when the tide drops. ' +
        'Pale flakes sit loose in the grooves and catch the light.',
      items: [new Steles(), new PolishedShell()],
      characters: [],
      exits: { south: 'TidalCauseway', east: 'OuterWards' },
    })
  }

  /**
   * The room's look, from the current wording, so a save made before a
   * wording change shows the current text.
   */
  override descriptionFor(_gameState: GameState): string {
    return new ShorelineMarkers().description
  }

  /** Search the steles to find Moon Rune shards for ward construction. */
  override search(gameState: GameState): string {
    // Idempotent message once revealed, even if the shards are gone.
    if (this.runesRevealed) {
      return (
        '[failure]You comb the surf-slick stones again. Pale shards gleam in ' +
        'the cracks, but you have gathered all you can use.[/failure]'
      )
    }
    this.items.push(new MoonRuneShards())
    this.runesRevealed = true
    // Reaching the shoreline markers starts the Tideward Sigils side quest.
    if (!gameState.getStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_STARTED)) {
      gameState.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_STARTED, true)
    }
    return (
      'You brush aside kelp and barnacle crusts. A cluster of pale moon ' +
      'shards comes free—etched with curved lines that seem to hum when the ' +
      'moon leans toward the sea. They feel keyed to the tide, as if the ' +
      'lunar pull listens to these marks.'
    )
  }
}
