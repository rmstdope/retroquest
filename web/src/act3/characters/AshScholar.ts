import {
  Character,
  type GameState,
  characterName,
  event,
  speech,
} from '@/engine'
import { BrassMirrorSegment } from '../items/BrassMirrorSegment'
import { CharredNotebook } from '../items/CharredNotebook'

/** A scholar who studies mirrorcraft and offers a mirror segment and a charred notebook. */
export class AshScholar extends Character {
  /** Tracks whether this scholar has already given their mirror segment and notebook. */
  private gaveSegment = false

  constructor() {
    super({
      name: 'Ash Scholar',
      description:
        'A thoughtful figure with soot-streaked robes, carrying notes on ' +
        'reflective geometry and the craft of mirrors.',
    })
  }

  /** Speak to the scholar; the first talk gives the segment and the notebook. */
  override talkTo(gameState: GameState): string {
    // If the scholar hasn't yet given his gifts, give the segment and the notebook now.
    // Do NOT check the player's inventory; the scholar's gift is tracked
    // locally so the player may receive duplicates from other sources.
    if (!this.gaveSegment) {
      const segment = new BrassMirrorSegment()
      gameState.addItemToInventory(segment)
      this.gaveSegment = true
      const notebook = new CharredNotebook()
      gameState.addItemToInventory(notebook)
      return (
        'The ' +
        characterName(this.name) +
        ' straightens and studies you for a long moment before speaking.\n' +
        speech(
          "'We are on an expedition: a small band of scholars and tinkerers, " +
            "tracing the terraces and cataloguing anything that glints.'",
        ) +
        '\n' +
        speech(
          "'I found this brass mirror segment while prying at a collapsed " +
            'ledge. It is small, but it will mend a mount. There will be more ' +
            "among the outcrops, if you search carefully.'",
        ) +
        '\n' +
        event(`You receive the [item_name]${segment.name}[/item_name].`) +
        '\n' +
        speech(
          "'This was in the same ledge. A notebook, burned nearly through. " +
            'Whoever wrote in it knew these mirrors better than any of us, ' +
            "and I cannot make out who that was. Perhaps you can.'",
        ) +
        '\n' +
        event(`You receive the [item_name]${notebook.name}[/item_name].`)
      )
    }
    return (
      'The ' +
      characterName(this.name) +
      ' offers a small nod. ' +
      speech(
        "'The terraces favour steady hands. Seek the outcrops for what the " +
          "mountain has shed.'",
      )
    )
  }
}
