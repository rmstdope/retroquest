import {
  Character,
  type GameState,
  characterName,
  event,
  speech,
} from '@/engine'
import { BrassMirrorSegment } from '../items/BrassMirrorSegment'

/** A scholar who studies mirrorcraft and offers a mirror segment. */
export class AshScholar extends Character {
  /** Tracks whether this scholar has already given their mirror segment. */
  private gaveSegment = false

  constructor() {
    super({
      name: 'Ash Scholar',
      description:
        'A thoughtful figure with soot-streaked robes, carrying notes on ' +
        'reflective geometry and the craft of mirrors.',
    })
  }

  /** Speak to the scholar to receive advice and possibly a mirror segment. */
  override talkTo(gameState: GameState): string {
    // If the scholar hasn't yet given their segment, give one now.
    // Do NOT check the player's inventory; the scholar's gift is tracked
    // locally so the player may receive duplicates from other sources.
    if (!this.gaveSegment) {
      const segment = new BrassMirrorSegment()
      gameState.addItemToInventory(segment)
      this.gaveSegment = true
      return (
        'The ' +
        characterName(this.name) +
        ' straightens and ' +
        'studies you for a long moment before ' +
        'speaking. ' +
        speech(
          "'We are on an expedition — a small band of scholars and " +
            'tinkerers tracing the terraces and cataloguing anything that ' +
            'glints. We comb the fissures for fragments, map the channels, ' +
            'and bide our time until the sun lines up with the mounts. It was ' +
            'while prying at a collapsed ledge that I found this brass mirror ' +
            "segment tucked between cooled slag and soot. It's small, but it " +
            'will mend a mount. There are likely more of this sort scattered ' +
            'among the outcrops — search carefully and you will find them. ' +
            "Take this; it should help.'",
        ) +
        '\n' +
        event(`You receive the [item_name]${segment.name}[/item_name].`)
      )
    }
    return (
      'The ' +
      characterName(this.name) +
      ' offers a small nod. ' +
      speech(
        "'The terraces favor steady hands. We're on an expedition " +
          'cataloguing glass and shards; seek the outcrops for what the mountain ' +
          'has shed. When you find fragments, set them carefully—alignment ' +
          "matters.'",
      )
    )
  }
}
