import { Item, type GameState } from '@/engine'
import { SeaSealedLetter } from './SeaSealedLetter'

/** A weathered mural along a half-drowned arch showing a guardian. */
export class Mural extends Item {
  private letterFound = false

  constructor() {
    super({
      name: 'mural',
      shortName: 'mural',
      description:
        'A faded mural paints a guardian bending over a small child. ' +
        'Salt has softened the colors, but the sigils around them still ' +
        'glow faintly when the moon hits the stone. The scene feels like ' +
        'a promise kept against the sea.',
      canBeCarried: false,
    })
  }

  /** Examine the mural to reveal hidden secrets or the letter. */
  override examine(gameState: GameState): string {
    if (this.letterFound) {
      return (
        "[event]The mural's quiet scene is whole again: the guardian's " +
        'shape holds the child as if the image itself was a tide shield. ' +
        'Where once a small box was sealed into the paint, empty stone now ' +
        'shows its place.[/event]'
      )
    }
    // Mark the letter as found the first time it is revealed
    this.letterFound = true
    gameState.currentRoom.addItem(new SeaSealedLetter())
    return (
      "[event]Fine salt lines run along the mural's base. Pressing the stone, " +
      'your hand finds a hollow and a dry scrap falls into your palm. A ' +
      '[item_name]Sea-Sealed Letter[/item_name] peels free, its ink half-hidden ' +
      'by varnish made of salt and tide.[/event]'
    )
  }
}
