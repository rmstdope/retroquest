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
        'The shore here is quiet and cold. Weathered steles rise from the sand, ' +
        'their worn faces full of shallow marks. Salt and time have smudged ' +
        'many lines, but faint moon sigils still show when the tide drops. ' +
        'Loose pale flakes sit in the grooves; they shimmer like old stars. ' +
        'When the moon is high, the stones seem to hum with a slow, patient ' +
        'voice—an old magic tied to the sea.',
      items: [new Steles(), new PolishedShell()],
      characters: [],
      exits: { south: 'TidalCauseway', east: 'OuterWards' },
    })
  }

  /** Search the steles to find Moon Rune shards for ward construction. */
  override search(gameState: GameState): string {
    // Idempotent message once revealed, even if the shards are gone.
    if (this.runesRevealed) {
      return (
        '[failure]You comb the surf-slick stones again. pale shards gleam in ' +
        "the cracks, but you've already gathered what you need.[/failure]"
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
